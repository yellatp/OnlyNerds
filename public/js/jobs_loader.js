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
            <div class="alert alert-warning">
                <h4>Cannot load job data</h4>
                <p>This page must be served via HTTP to load job data.</p>
                <p>Try: <code>npx serve .</code> or open via <code>http://localhost</code></p>
            </div>
        `;
    }
    if (resultsEl) resultsEl.style.display = 'none';
}

/**
 * Fetch a page of jobs from the D1 search API with filters.
 * @param {Object} filters - Filter parameters
 * @param {number} offset - Pagination offset
 * @param {number} limit - Page size (max 2000)
 * @returns {Promise<{jobs: Array, total: number, hasMore: boolean}>}
 */
export async function fetchD1Page(filters = {}, offset = 0, limit = BULK_LIMIT) {
    const params = new URLSearchParams();
    params.set('limit', limit);
    params.set('offset', offset);

    // Pass all active filters to the API
    // NOTE: category and domain are NOT sent to the API because
    // D1 has NULL for these columns (classification happens client-side).
    // They are filtered client-side in app.js _queryServer().
    if (filters.search) params.set('q', filters.search);
    if (filters.location) params.set('location', filters.location);
    if (filters.company) params.set('company', filters.company);
    if (filters.ats) params.set('ats', filters.ats);
    if (filters.skill_level) params.set('skill_level', filters.skill_level);
    if (filters.employment_type) params.set('employment_type', filters.employment_type);
    if (filters.remote === '1' || filters.remote === 'true') params.set('remote', '1');
    if (filters.freshness) params.set('freshness', filters.freshness);
    // Pass sort params to the API
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.dir) params.set('dir', filters.dir);

    const url = `${D1_API_BASE}?${params.toString()}`;
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
 * Fetch a chunk and parse as JSON.
 */
async function fetchAndDecompress(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Chunk fetch failed: ${response.status}`);
    return response.json();
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
 *   - Stats from /api/stats for accurate counts
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
 * Load initial data from D1 API.
 * Only loads the first page + stats. All filtering/pagination
 * is done server-side via the D1 search API.
 */
async function loadFromD1API(app) {
    // Fetch first page on main thread (no filters = all jobs)
    const firstPage = await fetchD1Page({}, 0, BULK_LIMIT);

    if (firstPage.jobs.length === 0) {
        throw new Error('D1 API returned empty results');
    }

    // Classify first batch
    classifyJobs(firstPage.jobs);
    app.allJobs = firstPage.jobs;
    app.filteredJobs = firstPage.jobs;

    // Store the total count from D1 for accurate pagination
    app.totalJobCount = firstPage.total || 0;

    // Update stats from D1 stats API (accurate counts)
    const stats = await fetchD1Stats();
    if (stats) {
        updateStatsFromD1(stats);
    } else {
        updateStats(app.allJobs, null);
    }

    populateFilterOptions(app.allJobs);
    app.render();

    console.log(`Loaded ${app.allJobs.length} jobs from D1 (${app.totalJobCount} total in DB)`);
}

/**
 * Query D1 API with current filters and pagination.
 * Used when filters change or page changes.
 * @param {Object} app - App instance
 * @param {Object} filters - Current filter state
 * @param {number} page - Page number (1-based)
 * @param {number} perPage - Jobs per page
 * @returns {Promise<{jobs: Array, total: number}>}
 */
export async function queryD1WithFilters(app, filters, page, perPage) {
    const offset = (page - 1) * perPage;
    const result = await fetchD1Page(filters, offset, perPage);

    // Classify the returned jobs
    classifyJobs(result.jobs);

    return {
        jobs: result.jobs,
        total: result.total || 0
    };
}

/**
 * Update stats bar using D1 stats API response.
 * @param {{totalJobs: number, totalCompanies: number, lastUpdated: string|null}} stats
 */
function updateStatsFromD1(stats) {
    const jobsEl = document.getElementById('total-jobs');
    const companiesEl = document.getElementById('total-companies');
    const platformsEl = document.getElementById('total-platforms');
    const updatedEl = document.getElementById('last-updated');

    if (jobsEl) jobsEl.textContent = (stats.totalJobs || 0).toLocaleString();
    if (companiesEl) companiesEl.textContent = (stats.totalCompanies || 0).toLocaleString();
    if (platformsEl) platformsEl.textContent = (stats.totalPlatforms || 0).toLocaleString();
    if (updatedEl && stats.lastUpdated) {
        const d = new Date(stats.lastUpdated);
        updatedEl.textContent = d.toLocaleDateString();
    }
}

/**
 * Update stats bar with local job array (fallback when D1 stats unavailable).
 */
export function updateStats(jobs, lastUpdated) {
    const jobsEl = document.getElementById('total-jobs');
    const companiesEl = document.getElementById('total-companies');
    const updatedEl = document.getElementById('last-updated');

    if (jobsEl) jobsEl.textContent = jobs.length.toLocaleString();
    if (companiesEl) {
        const companies = new Set(jobs.map(j => j.company).filter(Boolean));
        companiesEl.textContent = companies.size.toLocaleString();
    }
    if (updatedEl && lastUpdated) {
        const d = new Date(lastUpdated);
        updatedEl.textContent = d.toLocaleDateString();
    }
}
