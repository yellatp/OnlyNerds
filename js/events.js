// ============================================================
// EVENT LISTENERS
// ============================================================

import { showToast } from './ui_utils.js';
import { saveApplicationStatus, deleteApplicationStatus } from './storage.js';

/**
 * Wire up all DOM event listeners.
 * @param {object} app - The JobBoardApp instance
 */
export function setupEventListeners(app) {

    // ── Pagination ────────────────────────────────────────────
    document.getElementById('prev-page')?.addEventListener('click', () => app.previousPage());
    document.getElementById('next-page')?.addEventListener('click', () => app.nextPage());

    // ── Per-page selector ────────────────────────────────────
    document.getElementById('per-page')?.addEventListener('change', (e) => {
        app.perPage = parseInt(e.target.value);
        app.currentPage = 1;
        if (app.serverSide) {
            app.applyFilters();
        } else {
            app.render();
        }
    });

    // ── Tiles-per-row selector ──────────────────────────────
    document.getElementById('tiles-per-row')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const grid = document.getElementById('job-grid');
        if (grid) {
            grid.className = grid.className.replace(/tiles-\d+/g, '').trim();
            if (val !== 'auto') grid.classList.add('tiles-' + val);
        }
        app.render();
    });

    // ── Sort dropdown ─────────────────────────────────────────
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
        app.handleSort(e.target.value);
    });

    // ── Filter buttons ───────────────────────────────────────
    document.getElementById('clear-filters')?.addEventListener('click', () => app.clearFilters());

    // ── Instant filter apply on change ───────────────────────
    const instantFilterIds = [
        'filter-company', 'filter-department', 'filter-skill-level',
        'filter-employment-type', 'filter-remote', 'filter-ats',
        'filter-freshness', 'filter-show'
    ];

    instantFilterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => app.applyFilters());
        }
    });

    // ── Debounced text input filters ─────────────────────────
    const debouncedIds = ['filter-search', 'filter-location', 'filter-location-adv', 'filter-salary-min'];

    debouncedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                // Update filterState from DOM before debounced query
                const val = el.value;
                const key = id.replace('filter-', '').replace('-adv', '');
                if (key === 'search') app.filterState.search = val;
                else if (key === 'location') app.filterState.location = val;
                else if (key === 'salary') app.filterState.salary_min = val;
                app.debounceRender();
            });
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(app.debounceTimer);
                    // Update filterState from DOM
                    const val = el.value;
                    const key = id.replace('filter-', '').replace('-adv', '');
                    if (key === 'search') app.filterState.search = val;
                    else if (key === 'location') app.filterState.location = val;
                    else if (key === 'salary') app.filterState.salary_min = val;
                    app.applyFilters();
                }
            });
        }
    });

    // ── Delegated: Save button clicks on tiles ───────────────
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="save"]');
        if (!btn) return;

        const url = btn.dataset.url;
        if (!url) return;

        const isActive = btn.classList.contains('active');

        if (isActive) {
            deleteApplicationStatus(url);
            btn.classList.remove('active');
            btn.textContent = 'Save';
            showToast('Job removed from saved.', 'secondary');
        } else {
            saveApplicationStatus(url, 'saved');
            btn.classList.add('active');
            btn.textContent = 'Saved';
            showToast('Job saved!', 'success');
        }

        app.updateSavedCount();
    });

    // ── Collapsible control toggles (All Jobs, Sort, Filters) ──
    // Wire up .control-toggle buttons to show/hide their .control-section panels
    document.querySelectorAll('.control-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            if (!targetId) return;
            const panel = document.getElementById(targetId);
            if (!panel) return;

            const isOpen = btn.getAttribute('aria-expanded') === 'true';
            // Toggle this panel
            if (isOpen) {
                panel.style.display = 'none';
                btn.setAttribute('aria-expanded', 'false');
                btn.classList.remove('active');
            } else {
                panel.style.display = '';
                btn.setAttribute('aria-expanded', 'true');
                btn.classList.add('active');
            }
        });
    });

    // ── Saved count click — show saved only ──────────────────
    document.getElementById('saved-count')?.addEventListener('click', () => {
        const showSelect = document.getElementById('filter-show');
        if (showSelect) {
            showSelect.value = showSelect.value === 'saved' ? '' : 'saved';
            app.applyFilters();
        }
    });

    // ── Delegated: Category pill clicks ──────────────────────
    document.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (pill) {
            const category = pill.dataset.category;
            if (category) {
                app.selectCategory(category);
            }
        }
    });

    // ── Delegated: Domain toggle clicks ──────────────────────
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.domain-btn');
        if (btn) {
            const domain = btn.dataset.domain;
            if (domain) {
                app.selectDomain(domain);
            }
        }
    });

    // ── Delegated: Apply button click tracking ───────────────
    document.addEventListener('click', (e) => {
        const applyBtn = e.target.closest('.btn-apply');
        if (!applyBtn) return;

        const url = applyBtn.getAttribute('href');
        if (!url || url === '#') return;

        // Find the parent tile to get job details
        const tile = applyBtn.closest('.job-tile');
        const title = tile?.querySelector('.tile-title a')?.textContent?.trim() || '';
        const company = tile?.querySelector('.tile-company')?.textContent?.trim() || '';

        // Track the apply click
        trackApplyClick({ url, title, company });

        // Open in new tab (default behavior for <a target="_blank">)
    });
}

/**
 * Track an apply button click by sending to analytics endpoint.
 * Falls back to localStorage if no backend is available.
 */
function trackApplyClick({ url, title, company }) {
    const event = {
        type: 'apply_click',
        job_url: url,
        title: title,
        company: company,
        timestamp: new Date().toISOString()
    };

    // Use relative path so it works with both Pages and Workers deployments
    const ANALYTICS_URL = '/api/analytics/click';
    fetch(ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        mode: 'cors'
    }).catch(() => {
        // Fallback: store in localStorage
        try {
            const clicks = JSON.parse(localStorage.getItem('apply_clicks') || '[]');
            clicks.push(event);
            // Keep only last 500 clicks to avoid storage limits
            if (clicks.length > 500) clicks.splice(0, clicks.length - 500);
            localStorage.setItem('apply_clicks', JSON.stringify(clicks));
        } catch (e) {
            // Silently fail - analytics is non-critical
        }
    });
}
