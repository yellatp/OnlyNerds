// ============================================================
// JOBS LOADER — D1 API Edition
// ============================================================
// Loads jobs from the D1 search API (/api/search) instead of
// R2 chunks. Falls back to R2 chunks if D1 is unavailable.
// ============================================================

import { populateFilterOptions } from './filters.js';
import { classifyJobs } from './categories.js';

const D1_API_BASE = '/api/search';
const STATS_API = '/api/stats';
const CHUNK_BASE = './data/chunks';
const BULK_LIMIT = 2000; // Max jobs per D1 API call

/**
 * Detect if page is opened via file:// protocol (which blocks fetch).
 */
function isFileProtocol() {
    return window.location.protocol === 'file:';
}

/**
 * Show a helpful message when opened via file:// protocol.
 */
function showFileProtocolWarning() {
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results');
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div style="text-align:center;padding:40px 20px;max-width:500px;margin:0 auto;">
                <div style="font-size:48px;margin-bottom:16px;color:var(--accent);">!</div>
                <h3 style="color:var(--text);margin-bottom:12px;">Cannot load job data directly</h3>
                <p style="color:var(--text-light);margin-bottom:20px;line-height:1.6;">
                    The job board needs to be served via HTTP to load data.
                    Open a terminal in the project root and run:
                </p>
                <code style="display:inline-block;background:var(--input-bg);padding:10px 20px;border-radius:8px;border:1px solid var(--border);color:var(--accent);font-size:14px;margin-bottom:20px;">
                    npx serve . -p 4323 -s
                </code>
                <p style="color:var(--text-muted);font-size:13px;margin-top:12px;">
                    Then open <strong>http://localhost:4323</strong> in your browser.
                </p>
            </div>
        `;
    }
    if (resultsEl) resultsEl.style.display = 'none';
}

/**
 * Fetch and decompress a single gzipped JSON file (R2 fallback).
 * @param {string} url - Path to the .json.gz file
 * @returns {Promise<Array>} Parsed JSON array
 */
export async function fetchAndDecompress(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    const blob = await response.blob();
    const ds = new DecompressionStream('gzip');
    const text = await new Response(blob.stream().pipeThrough(ds)).blob().then(b => b.text());
    return JSON.parse(text);
}

/**
 * Fetch a page of jobs from the D1 search API.
 * @param {number} offset - Pagination offset
 * @param {number} limit - Page size (max 2000)
 * @returns {Promise<{jobs: Array, total: number, hasMore: boolean}>}
 */
async function fetchD1Page(offset = 0, limit = BULK_LIMIT) {
    const url = `${D1_API_BASE}?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`D1 API returned ${response.status}`);
    return response.json();
}

/**
 * Fetch stats from the D1 stats API.
 * @returns {Promise<{totalJobs: number, totalCompanies: number, lastUpdated: string|null}>}
 */
async function fetchD1Stats() {
    try {
        const response = await fetch(STATS_API);
        if (!response.ok) throw new Error(`Stats API returned ${response.status}`);
        return response.json();
    } catch {
        return null;
    }
}

/**
 * Fallback: load jobs from R2 chunks (original method).
 * Used when D1 API is unavailable.
 */
async function loadFromR2Chunks(app) {
    console.warn('D1 API unavailable, falling back to R2 chunks');
    const base_url = new URL(CHUNK_BASE, location.href).href;
    const manifest = await fetch(`${base_url}/jobs_manifest.json`).then(res => {
        if (!res.ok) throw new Error('Failed to load jobs manifest');
        return res.json();
    });

    // First chunk on main thread
    const firstChunk = await fetchAndDecompress(`${base_url}/${manifest.chunks[0]}`);
    classifyJobs(firstChunk);
    app.allJobs = firstChunk;
    app.filteredJobs = firstChunk;
    updateStats(app.allJobs, manifest.last_updated);
    populateFilterOptions(app.allJobs);
    app.render();

    if (manifest.chunks.length <= 1) return;

    // Remaining chunks via web worker
    const workerUrl = new URL('./chunk_worker.js', location.href).href;
    const worker = new Worker(workerUrl);
    let pending = manifest.chunks.length - 1;

    worker.onmessage = ({ data: jobs }) => {
        classifyJobs(jobs);
        app.allJobs.push(...jobs);
        app.refilter();
        app.render();
        updateStats(app.allJobs, manifest.last_updated);
        if (--pending === 0) {
            worker.terminate();
            populateFilterOptions(app.allJobs);
            if (typeof app.loadFromURLAfterAllChunks === 'function') {
                app.loadFromURLAfterAllChunks();
            }
        }
    };

    worker.onerror = (err) => {
        console.error('Chunk worker error:', err);
        worker.terminate();
    };

    manifest.chunks.slice(1).forEach(chunk => {
        worker.postMessage(`${base_url}/${chunk}`);
    });
}

/**
 * Load jobs progressively from D1 API:
 *   - First page on main thread → renders immediately
 *   - Remaining pages via web worker
 * Falls back to R2 chunks if D1 API is unavailable.
 * @param {Object} app - App instance
 */
export async function loadJobsProgressive(app) {
    // Detect file:// protocol and show helpful message
    if (isFileProtocol()) {
        showFileProtocolWarning();
        throw new Error('Cannot load job data via file:// protocol. Use a local HTTP server instead.');
    }

    try {
        // Try loading from D1 API first
        await loadFromD1API(app);
    } catch (err) {
        console.warn('D1 API failed, trying R2 chunks fallback:', err);
        try {
            await loadFromR2Chunks(app);
        } catch (r2Err) {
            console.error('Both D1 and R2 failed:', r2Err);
            throw new Error('Failed to load job data from any source.');
        }
    }
}

/**
 * Load all jobs from D1 API with pagination.
 * First page loads on main thread, remaining pages via web worker.
 */
async function loadFromD1API(app) {
    // Fetch first page on main thread
    const firstPage = await fetchD1Page(0, BULK_LIMIT);
    const totalJobs = firstPage.total || 0;

    if (firstPage.jobs.length === 0) {
        throw new Error('D1 API returned empty results');
    }

    // Classify first batch
    classifyJobs(firstPage.jobs);
    app.allJobs = firstPage.jobs;
    app.filteredJobs = firstPage.jobs;

    // Update stats from D1 stats API (accurate counts)
    const stats = await fetchD1Stats();
    if (stats) {
        updateStatsFromD1(stats);
    } else {
        updateStats(app.allJobs, null);
    }

    populateFilterOptions(app.allJobs);
    app.render();

    // If all jobs fit in one page, we're done
    if (!firstPage.hasMore) {
        if (typeof app.loadFromURLAfterAllChunks === 'function') {
            app.loadFromURLAfterAllChunks();
        }
        console.log(`Loaded ${app.allJobs.length} jobs from D1`);
        return;
    }

    // Load remaining pages via web worker
    const workerCode = `
        self.onmessage = async ({ data: { apiBase, limit, total } }) => {
            const pageSize = limit;
            const startOffset = pageSize; // Skip first page (already loaded)
            for (let offset = startOffset; offset < total; offset += pageSize) {
                try {
                    const url = apiBase + '?limit=' + pageSize + '&offset=' + offset;
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const data = await res.json();
                    self.postMessage({ type: 'page', jobs: data.jobs || [] });
                } catch (err) {
                    self.postMessage({ type: 'error', error: err.message });
                }
            }
            self.postMessage({ type: 'done' });
        };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = ({ data }) => {
        if (data.type === 'page') {
            const jobs = data.jobs;
            if (jobs.length === 0) return;
            classifyJobs(jobs);
            app.allJobs.push(...jobs);
            app.refilter();
            app.render();
            if (stats) {
                updateStatsFromD1(stats);
            } else {
                updateStats(app.allJobs, null);
            }
        } else if (data.type === 'error') {
            console.error('D1 worker error:', data.error);
        } else if (data.type === 'done') {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            // Re-populate filter options with full dataset
            populateFilterOptions(app.allJobs);
            // Apply URL filters now that ALL jobs are loaded
            if (typeof app.loadFromURLAfterAllChunks === 'function') {
                app.loadFromURLAfterAllChunks();
            }
            console.log(`Loaded ${app.allJobs.length} jobs from D1`);
        }
    };

    worker.onerror = (err) => {
        console.error('D1 worker error:', err);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
    };

    // Start the worker
    worker.postMessage({
        apiBase: D1_API_BASE,
        limit: BULK_LIMIT,
        total: totalJobs
    });
}

/**
 * Update stats bar using D1 stats API response.
 * @param {{totalJobs: number, totalCompanies: number, lastUpdated: string|null}} stats
 */
function updateStatsFromD1(stats) {
    const jobsEl = document.getElementById('total-jobs');
    const companiesEl = document.getElementById('total-companies');
    if (jobsEl) jobsEl.textContent = (stats.totalJobs || 0).toLocaleString();
    if (companiesEl) companiesEl.textContent = (stats.totalCompanies || 0).toLocaleString();
}

/**
 * Update the stats bar in the DOM (fallback for R2 chunks).
 * @param {Array} jobs - The full jobs array
 * @param {string} [lastUpdated] - ISO timestamp from manifest
 */
export function updateStats(jobs, lastUpdated) {
    const companies = new Set(jobs.map(j => j.company_slug || j.company)).size;
    document.getElementById('total-jobs').textContent = jobs.length.toLocaleString();
    document.getElementById('total-companies').textContent = companies.toLocaleString();
}
