// ============================================================
// JOBS LOADER
// ============================================================

import { populateFilterOptions } from './filters.js';
import { classifyJobs } from './categories.js';

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
 * Fetch and decompress a single gzipped JSON file.
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
 * Load jobs progressively: first chunk on main thread, rest via worker.
 * @param {Object} app - App instance
 * @param {string} basePath - Directory containing manifest and chunks
 */
export async function loadJobsProgressive(app, basePath = './data/chunks') {
    // Detect file:// protocol and show helpful message
    if (isFileProtocol()) {
        showFileProtocolWarning();
        throw new Error('Cannot load job data via file:// protocol. Use a local HTTP server instead.');
    }

    const base_url = new URL(basePath, location.href).href;
    const manifest = await fetch(`${base_url}/jobs_manifest.json`).then(res => {
        if (!res.ok) throw new Error('Failed to load jobs manifest');
        return res.json();
    });

    // First chunk on main thread — renders immediately
    const firstChunk = await fetchAndDecompress(`${base_url}/${manifest.chunks[0]}`);
    // Classify first chunk before rendering
    classifyJobs(firstChunk);
    app.allJobs = firstChunk;
    app.filteredJobs = firstChunk;
    updateStats(app.allJobs, manifest.last_updated);
    populateFilterOptions(app.allJobs);
    app.render();

    if (manifest.chunks.length <= 1) {
        return;
    }

    // Remaining chunks via web worker
    // Use absolute URL to worker script to avoid issues with base path
    const workerUrl = new URL('./chunk_worker.js', location.href).href;
    const worker = new Worker(workerUrl);
    let pending = manifest.chunks.length - 1;

    worker.onmessage = ({ data: jobs }) => {
        // Classify incoming jobs with domain/category/normalized_role
        classifyJobs(jobs);
        app.allJobs.push(...jobs);
        app.refilter();
        app.render();
        updateStats(app.allJobs, manifest.last_updated);
        if (--pending === 0) {
            worker.terminate();
            // Re-populate filter options with full dataset
            populateFilterOptions(app.allJobs);
            // Apply URL filters now that ALL jobs are loaded (fixes race condition)
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
 * Update the stats bar in the DOM.
 * @param {Array} jobs - The full jobs array
 * @param {string} [lastUpdated] - ISO timestamp from manifest
 */
export function updateStats(jobs, lastUpdated) {
    const companies = new Set(jobs.map(j => j.company_slug || j.company)).size;
    document.getElementById('total-jobs').textContent = jobs.length.toLocaleString();
    document.getElementById('total-companies').textContent = companies.toLocaleString();
}
