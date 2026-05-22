// ============================================================
// JOB BOARD APP
// ============================================================

import { showToast, showLoadingToast } from './ui_utils.js';
import { loadApplicationStatus, getSavedJobsCount } from './storage.js';
import { loadJobsProgressive, updateStats } from './jobs_loader.js';
import { filterJobs, clearFilterInputs, populateFilterOptions } from './filters.js';
import { render } from './renderer.js';
import { updateURL, loadFromURL } from './url_state.js';
import { setupEventListeners } from './events.js';
import { applySorting } from './sorting.js';
import { classifyJobs, getCategoryCounts, getCategoriesForDomain, CATEGORY_ORDER, DOMAINS, DOMAIN_ORDER } from './categories.js';

class JobBoardApp {
    constructor() {
        this.allJobs = [];
        this.filteredJobs = [];
        this.currentPage = 1;
        this.perPage = window.innerWidth <= 900 ? 25 : 50;
        this.sortState = { key: 'published_on', direction: 'desc' };

        this.filterState = {
            search: '', location: '', company: '', department: '',
            salary_min: '', skill_level: '', employment_type: '',
            remote: '', ats: '', freshness: '', show: '',
            domain: '', category: ''
        };

        this.debounceTimer = null;
        this.selectedCategory = '';
        this.selectedDomain = '';
    }

    // ── Initialization ───────────────────────────────────────────
    async init() {
        await this.loadJobs();
        setupEventListeners(this);
        // loadFromURL is called after all chunks are loaded (in jobs_loader.js completion handler)
        // to avoid race condition where URL filters only apply to first chunk
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

            this.sortState = { key: 'published_on', direction: 'desc' };

            // Default freshness filter: show jobs from past 30 days
            // Only apply if no explicit freshness filter is set from URL
            if (!this.filterState.freshness) {
                this.filterState.freshness = '30d';
                const freshnessEl = document.getElementById('filter-freshness');
                if (freshnessEl) freshnessEl.value = '30d';
            }

            loadingEl.style.display = 'none';
            resultsEl.style.display = 'block';

            console.log(`Loaded ${this.allJobs.length} jobs`);

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
        this.debounceTimer = setTimeout(() => this.render(), 300);
    }

    // ── Filtering ────────────────────────────────────────────
    applyFilters() {
        // Pass domain/category from app state (not DOM) into filterJobs
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
        this.filteredJobs = [...this.allJobs];
        this.currentPage = 1;
        updateURL(this.filterState, this.currentPage, this.sortState);
        this.render();
    }

    refilter() {
        if (this.hasActiveFilters()) {
            this.applyFilters();
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

    // ── Category Selection ───────────────────────────────────
    selectCategory(category) {
        if (this.selectedCategory === category) {
            // Toggle off
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
        // Parse compound values like "freshness-desc", "published_on-asc"
        // The sort dropdown uses format: "{sortKey}-{direction}"
        const parts = key.split('-');
        const sortKey = parts[0];
        const sortDir = parts[1];

        if (sortDir === 'asc' || sortDir === 'desc') {
            // Compound value: set both key and direction
            if (this.sortState.key === sortKey && this.sortState.direction === sortDir) {
                // Already set — toggle direction
                this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortState.key = sortKey;
                this.sortState.direction = sortDir;
            }
        } else {
            // Simple value: toggle if same key, else set with default direction
            if (this.sortState.key === key) {
                this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortState.key = key;
                this.sortState.direction = 'asc';
            }
        }

        this.currentPage = 1;
        updateURL(this.filterState, this.currentPage, this.sortState);
        this.render();
    }

    // ── Pagination ───────────────────────────────────────────
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredJobs.length / this.perPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // ── URL State ────────────────────────────────────────────
    loadFromURL() {
        const { hasFilters, page, domain, category } = loadFromURL();
        this.currentPage = page;
        // Read domain/category from URL
        if (domain) {
            this.selectedDomain = domain;
            this.filterState.domain = domain;
        }
        if (category) {
            this.selectedCategory = category;
            this.filterState.category = category;
        }
        if (hasFilters) {
            const { filteredJobs, filterState } = filterJobs(this.allJobs, {
                domain: this.selectedDomain,
                category: this.selectedCategory
            });
            this.filteredJobs = filteredJobs;
            this.filterState = filterState;
        }
    }

    /**
     * Called after ALL chunks are loaded (from jobs_loader.js completion handler).
     * This ensures URL filters apply to the full dataset, not just the first chunk.
     */
    loadFromURLAfterAllChunks() {
        this.loadFromURL();
        this.render();
    }

    // ── Saved Jobs Count ─────────────────────────────────────
    updateSavedCount() {
        const count = getSavedJobsCount();
        const el = document.getElementById('saved-count');
        if (el) el.textContent = `${count} saved`;
    }
}

// ============================================================
// THEME TOGGLE
// ============================================================
const STORAGE_KEY = 'onlynerds-theme';

function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to light mode
    return 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '🌙' : '☀️';
        btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}

// ============================================================
// INITIALIZE APP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme before anything renders to prevent flash
    const theme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', theme);

    const app = new JobBoardApp();
    app.init();

    // Wire up theme toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        // Set initial icon
        toggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
        toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
        toggleBtn.addEventListener('click', toggleTheme);
    }
});
