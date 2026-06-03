// ============================================================
// JOB BOARD APP
// ============================================================

import { showToast, showLoadingToast } from './ui_utils.js';
import { loadApplicationStatus, getSavedJobsCount } from './storage.js';
import { loadJobsProgressive, updateStats, fetchD1Page, queryD1WithFilters } from './jobs_loader.js';
import { filterJobs, clearFilterInputs, populateFilterOptions, readFilterInputs } from './filters.js';
import { render } from './renderer.js';
import { updateURL, loadFromURL } from './url_state.js';
import { setupEventListeners } from './events.js';
import { applySorting } from './sorting.js';
import { classifyJobs, classifyJob, getCategoryCounts, getCategoriesForDomain, CATEGORY_ORDER, DOMAINS, DOMAIN_ORDER } from './categories.js';

class JobBoardApp {
    constructor() {
        this.allJobs = [];
        this.filteredJobs = [];
        this.currentPage = 1;
        this.perPage = window.innerWidth <= 900 ? 25 : 50;
        this.sortState = { key: 'scraped_at', direction: 'desc' };

        this.filterState = {
            search: '', location: '', company: '', department: '',
            salary_min: '', skill_level: '', employment_type: '',
            remote: '', ats: '', freshness: '', show: '',
            domain: '', category: ''
        };

        this.debounceTimer = null;
        this.selectedCategory = '';
        this.selectedDomain = '';

        // Server-side query mode: when true, filters/pagination query D1 API
        this.serverSide = true;
        // Total job count from D1 stats API
        this.totalJobCount = 0;
        // Loading state for server-side queries
        this._loading = false;
    }

    // ── Initialization ───────────────────────────────────────────
    async init() {
        await this.loadJobs();
        setupEventListeners(this);
        // Apply URL params after initial load (page, freshness, sort, etc.)
        this.loadFromURLAfterAllChunks();
        this.render();
    }

    // ── Data Loading ───────────────────────────────────────────
    async loadJobs() {
        const loadingEl = document.getElementById('loading');
        const resultsEl = document.getElementById('results');

        try {
            await loadJobsProgressive(this);

            // Classify all jobs after loading
            classifyJobs(this.allJobs);

            this.sortState = { key: 'scraped_at', direction: 'desc' };

            // Default freshness filter: show all jobs (no date restriction)
            if (!this.filterState.freshness) {
                this.filterState.freshness = '';
                const freshnessEl = document.getElementById('filter-freshness');
                if (freshnessEl) freshnessEl.value = '';
            }

            loadingEl.style.display = 'none';
            resultsEl.style.display = 'block';

            console.log(`Loaded ${this.allJobs.length} jobs (${this.totalJobCount} total in DB)`);

        } catch (error) {
            console.error('Error loading jobs:', error);
            showToast('Error loading job data.', 'danger');
            loadingEl.textContent = 'Failed to load job data.';
        }
    }

    // ── Rendering ────────────────────────────────────────────
    render() {
        render(this);
        this.updateSavedCount();
        this.updateCategoryPills();
        this.updateDomainToggle();
    }

    debounceRender() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            // Sync all filter values from DOM before querying
            this._syncFilterStateFromDOM();
            if (this.serverSide) {
                this.applyFilters();
            } else {
                this.render();
            }
        }, 300);
    }

    // ── Filtering ────────────────────────────────────────────
    async applyFilters() {
        if (this._loading) return;

        if (this.serverSide) {
            // Read current DOM filter values into filterState
            this._syncFilterStateFromDOM();
            // Server-side filtering: query D1 API
            await this._queryServer(this.currentPage);
        } else {
            // Client-side filtering (R2 fallback mode)
            const { filteredJobs, filterState } = filterJobs(this.allJobs, {
                domain: this.selectedDomain,
                category: this.selectedCategory
            });
            this.filteredJobs = filteredJobs;
            this.filterState = filterState;
            this.currentPage = 1;
            updateURL(this.filterState, this.currentPage, this.sortState);
            this.render();
        }
    }

    /**
     * Sync filterState from current DOM input values.
     * This ensures the server query uses the actual selected filters.
     */
    _syncFilterStateFromDOM() {
        const domFilters = readFilterInputs();
        this.filterState.search = domFilters.search;
        this.filterState.location = domFilters.location;
        this.filterState.company = domFilters.company;
        this.filterState.department = domFilters.department;
        this.filterState.salary_min = domFilters.salary_min;
        this.filterState.skill_level = domFilters.skill_level;
        this.filterState.employment_type = domFilters.employment_type;
        this.filterState.remote = domFilters.remote;
        this.filterState.ats = domFilters.ats;
        this.filterState.freshness = domFilters.freshness;
        this.filterState.show = domFilters.show;
        // Domain and category are managed via app state
        this.filterState.domain = this.selectedDomain;
        this.filterState.category = this.selectedCategory;
    }

    clearFilters() {
        clearFilterInputs();
        this.filterState = {
            search: '', location: '', company: '', department: '',
            salary_min: '', skill_level: '', employment_type: '',
            remote: '', ats: '', freshness: '', show: '',
            domain: '', category: ''
        };
        this.selectedCategory = '';
        this.selectedDomain = '';

        if (this.serverSide) {
            this._queryServer(1);
        } else {
            this.filteredJobs = [...this.allJobs];
            this.currentPage = 1;
            updateURL(this.filterState, this.currentPage, this.sortState);
            this.render();
        }
    }

    refilter() {
        if (this.hasActiveFilters()) {
            this.applyFilters();
        } else if (this.serverSide) {
            this._queryServer(1);
        } else {
            this.filteredJobs = [...this.allJobs];
        }
    }

    hasActiveFilters() {
        const f = this.filterState;
        return f.search || f.location || f.company || f.department ||
            f.salary_min || f.skill_level || f.employment_type ||
            f.remote || f.ats || f.freshness || f.show ||
            f.domain || f.category;
    }

    /**
     * Query the D1 API with current filters and pagination.
     * Updates filteredJobs with the server response.
     */
    async _queryServer(page) {
        this._loading = true;
        try {
            const filters = this._buildFilterParams();
            const result = await queryD1WithFilters(this, filters, page, this.perPage);

            // Classify returned jobs client-side since D1 has NULL for category/domain columns
            const pageJobs = (result.jobs || []).map(job => {
                if (!job.category || !job.domain) {
                    const cls = classifyJob(job);
                    job.category = job.category || cls.category;
                    job.domain = job.domain || cls.domain;
                    job.normalized_role = job.normalized_role || cls.normalized_role;
                }
                return job;
            });

            // Apply category/domain filtering client-side
            let filteredJobs = pageJobs;
            let totalCount = result.total || 0;
            if (this.selectedCategory || this.selectedDomain) {
                filteredJobs = pageJobs.filter(job => {
                    if (this.selectedCategory) {
                        const jobCat = job.category || '';
                        if (jobCat !== this.selectedCategory) return false;
                    }
                    if (this.selectedDomain) {
                        const jobDomain = job.domain || '';
                        if (jobDomain !== this.selectedDomain) return false;
                    }
                    return true;
                });
                // Estimate total from client-side allJobs for category/domain filters
                if (this.allJobs && this.allJobs.length > 0) {
                    const filteredAll = this.allJobs.filter(job => {
                        if (this.selectedCategory) {
                            const jobCat = job.category || '';
                            if (jobCat !== this.selectedCategory) return false;
                        }
                        if (this.selectedDomain) {
                            const jobDomain = job.domain || '';
                            if (jobDomain !== this.selectedDomain) return false;
                        }
                        return true;
                    });
                    totalCount = filteredAll.length;
                }
            }

            this.filteredJobs = filteredJobs;
            this.totalJobCount = totalCount;
            this.currentPage = page;

            updateURL(this.filterState, this.currentPage, this.sortState);
            this.render();
        } catch (err) {
            console.error('Server query failed, falling back to client-side:', err);
            // Fall back to client-side filtering
            this.serverSide = false;
            const { filteredJobs, filterState } = filterJobs(this.allJobs, {
                domain: this.selectedDomain,
                category: this.selectedCategory
            });
            this.filteredJobs = filteredJobs;
            this.filterState = filterState;
            this.currentPage = 1;
            updateURL(this.filterState, this.currentPage, this.sortState);
            this.render();
        } finally {
            this._loading = false;
        }
    }

    /**
     * Build filter parameters object from current filterState.
     */
    _buildFilterParams() {
        const f = this.filterState;
        const params = {};

        if (f.search) params.search = f.search;
        if (f.location) params.location = f.location;
        if (f.company) params.company = f.company;
        if (f.ats) params.ats = f.ats;
        // NOTE: category and domain are NOT sent to the API because
        // D1 has NULL for these columns (classification happens client-side).
        // They are filtered client-side in _queryServer() after receiving API results.
        if (f.skill_level) params.skill_level = f.skill_level;
        if (f.employment_type) params.employment_type = f.employment_type;
        if (f.remote) params.remote = f.remote;
        if (f.freshness) params.freshness = f.freshness;
        // Include sort params for server-side sorting
        if (this.sortState.key) {
            params.sort = this.sortState.key;
            params.dir = this.sortState.direction;
        }

        return params;
    }

    // ── Category Selection ───────────────────────────────────
    selectCategory(category) {
        if (this.selectedCategory === category) {
            this.selectedCategory = '';
            this.filterState.category = '';
        } else {
            this.selectedCategory = category;
            this.filterState.category = category;
        }
        this.currentPage = 1;
        updateURL(this.filterState, this.currentPage, this.sortState);
        this.applyFilters();
    }

    selectDomain(domain) {
        if (this.selectedDomain === domain) {
            this.selectedDomain = '';
            this.filterState.domain = '';
        } else {
            this.selectedDomain = domain;
            this.filterState.domain = domain;
        }
        this.selectedCategory = '';
        this.filterState.category = '';
        this.currentPage = 1;
        updateURL(this.filterState, this.currentPage, this.sortState);
        this.applyFilters();
    }

    updateCategoryPills() {
        const container = document.getElementById('category-pills');
        if (!container) return;

        const counts = getCategoryCounts(this.allJobs);
        const domain = this.selectedDomain || 'All Jobs';
        const visibleCategories = getCategoriesForDomain(domain, this.allJobs);

        let html = '';
        for (const cat of CATEGORY_ORDER) {
            if (!visibleCategories.includes(cat)) continue;
            const count = counts[cat] || 0;
            if (count === 0) continue;
            const active = this.selectedCategory === cat ? ' active' : '';
            html += `<button class="category-pill${active}" data-category="${cat}">
                ${cat} <span class="category-pill-count">${count}</span>
            </button>`;
        }

        container.innerHTML = html;
    }

    updateDomainToggle() {
        const container = document.getElementById('domain-toggle');
        if (!container) return;

        let html = '';
        for (const d of DOMAIN_ORDER) {
            const active = (this.selectedDomain === d) || (!this.selectedDomain && d === 'All Jobs') ? ' active' : '';
            html += `<button class="domain-btn${active}" data-domain="${d}">${d}</button>`;
        }
        container.innerHTML = html;
    }

    // ── Sorting ──────────────────────────────────────────────
    handleSort(key) {
        const parts = key.split('-');
        const sortKey = parts[0];
        const sortDir = parts[1];

        if (sortDir === 'asc' || sortDir === 'desc') {
            this.sortState.key = sortKey;
            this.sortState.direction = sortDir;
        } else {
            if (this.sortState.key === key) {
                this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortState.key = key;
                this.sortState.direction = 'asc';
            }
        }

        this.currentPage = 1;
        updateURL(this.filterState, this.currentPage, this.sortState);

        // In server-side mode, query the API with the new sort
        if (this.serverSide) {
            this._queryServer(this.currentPage);
        } else {
            this.render();
        }
    }

    // ── Pagination ───────────────────────────────────────────
    previousPage() {
        if (this.currentPage > 1) {
            if (this.serverSide) {
                this._queryServer(this.currentPage - 1);
            } else {
                this.currentPage--;
                this.render();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    nextPage() {
        const totalPages = Math.ceil((this.serverSide ? this.totalJobCount : this.filteredJobs.length) / this.perPage);
        if (this.currentPage < totalPages) {
            if (this.serverSide) {
                this._queryServer(this.currentPage + 1);
            } else {
                this.currentPage++;
                this.render();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // ── URL State ────────────────────────────────────────────
    loadFromURL() {
        const params = loadFromURL();
        if (!params) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        if (params.freshness) {
            this.filterState.freshness = params.freshness;
            setVal('filter-freshness', params.freshness);
        }
        if (params.sort) {
            const parts = params.sort.split('-');
            if (parts.length === 2) {
                // Map old 'published_on' sort key to 'scraped_at'
                const sortKey = parts[0] === 'published_on' ? 'scraped_at' : parts[0];
                this.sortState.key = sortKey;
                this.sortState.direction = parts[1];
                setVal('sort-select', `${sortKey}-${parts[1]}`);
            }
        }
        if (params.page) {
            this.currentPage = parseInt(params.page, 10) || 1;
        }
        if (params.q) {
            this.filterState.search = params.q;
            setVal('filter-search', params.q);
        }
        if (params.company) {
            this.filterState.company = params.company;
            setVal('filter-company', params.company);
        }
        if (params.ats) {
            this.filterState.ats = params.ats;
            setVal('filter-ats', params.ats);
        }
        if (params.category) {
            this.selectedCategory = params.category;
            this.filterState.category = params.category;
        }
        if (params.domain) {
            this.selectedDomain = params.domain;
            this.filterState.domain = params.domain;
        }
        if (params.skill_level) {
            this.filterState.skill_level = params.skill_level;
            setVal('filter-skill-level', params.skill_level);
        }
        if (params.employment_type) {
            this.filterState.employment_type = params.employment_type;
            setVal('filter-employment-type', params.employment_type);
        }
        if (params.remote) {
            this.filterState.remote = params.remote;
            setVal('filter-remote', params.remote);
        }
        if (params.show) {
            this.filterState.show = params.show;
            setVal('filter-show', params.show);
        }
    }

    loadFromURLAfterAllChunks() {
        this.loadFromURL();
        // Apply the URL params by querying the server with the current page
        if (this.serverSide) {
            this._queryServer(this.currentPage);
        } else {
            this.applyFilters();
        }
    }

    // ── Saved Jobs ───────────────────────────────────────────
    updateSavedCount() {
        const count = getSavedJobsCount();
        const el = document.getElementById('saved-count');
        if (el) el.textContent = count;
    }
}

// ── Theme ──────────────────────────────────────────────────
function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-bs-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    setTheme(getPreferredTheme());

    const app = new JobBoardApp();
    window.app = app;
    await app.init();
});
