// ============================================================
// ONLY NERDS — URL STATE MANAGEMENT
// ============================================================

/**
 * Sync current filter/sort/page state to the URL query string.
 * @param {object} filterState
 * @param {number} currentPage
 * @param {{ key: string|null, direction: string }} sortState
 */
export function updateURL(filterState, currentPage, sortState) {
    const params = new URLSearchParams();

    if (filterState.search) params.set('search', filterState.search);
    if (filterState.location) params.set('location', filterState.location);
    if (filterState.company) params.set('company', filterState.company);
    if (filterState.department) params.set('dept', filterState.department);
    if (filterState.salary_min) params.set('salary', filterState.salary_min);
    if (filterState.skill_level) params.set('exp', filterState.skill_level);
    if (filterState.employment_type) params.set('type', filterState.employment_type);
    if (filterState.remote) params.set('remote', filterState.remote);
    if (filterState.ats) params.set('ats', filterState.ats);
    if (filterState.freshness) params.set('fresh', filterState.freshness);
    if (filterState.show) params.set('show', filterState.show);
    if (filterState.domain) params.set('domain', filterState.domain.toLowerCase());
    if (filterState.category) params.set('category', filterState.category.toLowerCase());
    if (currentPage > 1) params.set('page', currentPage.toString());

    if (sortState.key) {
        params.set('sort', sortState.key);
        params.set('dir', sortState.direction);
    }

    const newURL = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

    window.history.replaceState({}, '', newURL);
}

/**
 * Read filter/sort/page state from the URL and populate DOM inputs.
 * @returns {{ hasFilters: boolean, page: number }}
 */
export function loadFromURL() {
    const params = new URLSearchParams(window.location.search);

    const search = params.get('search') || '';
    const location = params.get('location') || '';
    const company = params.get('company') || '';
    const department = params.get('dept') || '';
    const salary = params.get('salary') || '';
    const skillLevel = params.get('exp') || '';
    const employmentType = params.get('type') || '';
    const remote = params.get('remote') || '';
    const ats = params.get('ats') || '';
    const freshness = params.get('fresh') || '';
    const show = params.get('show') || '';
    const domain = params.get('domain') || '';
    const category = params.get('category') || '';
    const page = parseInt(params.get('page')) || 1;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('filter-search', search);
    setVal('filter-location', location);
    setVal('filter-location-adv', location);
    setVal('filter-company', company);
    setVal('filter-department', department);
    setVal('filter-salary-min', salary);
    setVal('filter-skill-level', skillLevel);
    setVal('filter-employment-type', employmentType);
    setVal('filter-remote', remote);
    setVal('filter-ats', ats);
    setVal('filter-freshness', freshness);
    setVal('filter-show', show);

    const hasFilters = !!(search || location || company || department || salary ||
        skillLevel || employmentType || remote || ats || freshness || show ||
        domain || category);

    return { hasFilters, page, domain, category };
}
