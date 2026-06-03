// ============================================================
// RENDERER (Tile-based)
// ============================================================

import { applySorting } from './sorting.js';
import { updatePagination } from './pagination.js';
import { escape, normalizeBambooUrl } from './ui_utils.js';
import { loadApplicationStatus } from './storage.js';

/**
 * Format a salary value for display.
 */
function formatSalary(salary) {
    if (!salary?.median) return null;
    const fmt = n => '$' + (n / 1000).toFixed(0) + 'k';
    return `${fmt(salary.p25)} - ${fmt(salary.p75)}`;
}

/**
 * Compute job freshness info from published_on or scraped_at.
 */
function getFreshness(job) {
    const dateStr = job.published_on || job.scraped_at;
    if (!dateStr) return { text: 'Unknown', hours: Infinity, level: 'light' };

    const now = Date.now();
    const date = new Date(dateStr).getTime();
    if (isNaN(date)) return { text: 'Unknown', hours: Infinity, level: 'light' };

    const hours = (now - date) / 3600000;
    const days = Math.floor(hours / 24);

    let text, level;
    if (hours < 1) {
        text = 'Added < 1 hour ago';
        level = 'green';
    } else if (hours < 24) {
        text = `Added ${Math.floor(hours)} hour${Math.floor(hours) !== 1 ? 's' : ''} ago`;
        level = 'green';
    } else if (days < 3) {
        text = `Posted ${days} day${days !== 1 ? 's' : ''} ago`;
        level = 'green';
    } else if (days < 7) {
        text = `Posted ${days} day${days !== 1 ? 's' : ''} ago`;
        level = 'blue';
    } else if (days < 30) {
        text = `Posted ${days} day${days !== 1 ? 's' : ''} ago`;
        level = 'gray';
    } else {
        text = `Posted ${days} day${days !== 1 ? 's' : ''} ago`;
        level = 'light';
    }

    return { text, hours, level };
}

/**
 * Get the ATS badge class.
 */
function getAtsClass(ats) {
    const map = {
        'greenhouse': 'badge-ats-greenhouse',
        'lever': 'badge-ats-lever',
        'workday': 'badge-ats-workday',
        'ashby': 'badge-ats-ashby',
        'icims': 'badge-ats-icims',
        'bamboohr': 'badge-ats-bamboohr',
        'workable': 'badge-ats-workable',
    };
    return map[ats?.toLowerCase()] || 'badge-ats-unknown';
}

/**
 * Get the skill level badge class.
 */
function getSkillClass(level) {
    const map = {
        'intern': 'badge-skill-intern',
        'entry': 'badge-skill-entry',
        'mid': 'badge-skill-mid',
        'senior': 'badge-skill-senior',
    };
    return map[level?.toLowerCase()] || '';
}

/**
 * Get the employment type badge class.
 */
function getTypeClass(type) {
    const map = {
        'full-time': 'badge-type-full-time',
        'part-time': 'badge-type-part-time',
        'contract': 'badge-type-contract',
        'internship': 'badge-type-internship',
    };
    return map[type?.toLowerCase()] || 'badge-type-full-time';
}

/**
 * Render a single job tile as HTML string.
 */
function renderTile(job, apps) {
    let url = job.absolute_url || job.url || '#';
    // Normalize BambooHR URLs
    if (url.includes('bamboohr.com')) {
        url = normalizeBambooUrl(url);
    }
    const company = job.company || job.company_slug || 'Unknown';
    const title = job.title || 'Untitled';
    const location = job.location
        ? (typeof job.location === 'object' ? job.location.name || 'Not specified' : job.location)
        : 'Not specified';
    const salary = formatSalary(job.salary);
    const freshness = getFreshness(job);
    const ats = job.ats || 'unknown';
    const skillLevel = job.skill_level || '';
    const employmentType = job.employment_type || '';
    const department = job.department || '';
    const category = job.category || '';
    const isRemote = job.workplaceType?.toLowerCase() === 'remote'
        || location.toLowerCase().includes('remote');

    // Application status (apps passed in from parent to avoid per-tile localStorage reads)
    const appStatus = apps[url]?.status || '';

    const isSaved = appStatus === 'saved';
    const isApplied = appStatus === 'applied';

    const safeUrl = escape(url);
    const safeCompany = escape(company);
    const safeTitle = escape(title);
    const safeLocation = escape(location);
    const safeDept = escape(department);
    const safeCategory = escape(category);

    // Category badge class
    const catClass = category
        ? 'category-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
        : '';

    return `
        <div class="job-tile" data-url="${safeUrl}">
            <div class="tile-title">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeTitle}</a>
            </div>
            <div class="tile-company">
                ${safeCompany}
                ${job.is_recruiter ? '<span class="recruiter-badge">Recruiter</span>' : ''}
            </div>
            <div class="tile-location">
                ${safeLocation}
                ${isRemote ? '<span class="remote-badge">Remote</span>' : ''}
            </div>
            <div class="tile-salary">
                ${salary ? `<span>${salary}</span>` : '<span class="no-salary">-</span>'}
            </div>
            <div class="tile-meta">
                ${category ? `<span class="badge category-badge ${catClass}">${safeCategory}</span>` : ''}
                ${employmentType ? `<span class="badge ${getTypeClass(employmentType)}">${escape(employmentType)}</span>` : ''}
                ${skillLevel ? `<span class="badge ${getSkillClass(skillLevel)}">${escape(skillLevel)}</span>` : ''}
                ${department ? `<span class="badge badge-dept">${safeDept}</span>` : ''}
                <span class="badge ${getAtsClass(ats)}">${escape(ats)}</span>
            </div>
            <div class="tile-actions">
                <button class="btn btn-save ${isSaved ? 'active' : ''}" data-action="save" data-url="${safeUrl}">
                    ${isSaved ? 'Saved' : 'Save'}
                </button>
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-apply">
                    Apply
                </a>
            </div>
            <div class="tile-freshness">
                <span class="fresh-dot fresh-dot-${freshness.level}"></span>
                <span class="fresh-text-${freshness.level}">${freshness.text}</span>
            </div>
        </div>
    `;
}

/**
 * Render the job grid for the current page.
 * @param {object} app - The JobBoardApp instance
 */
export function render(app) {
    const grid = document.getElementById('job-grid');
    if (!grid) return;

    // Apply sorting (only relevant for client-side mode; in server-side mode,
    // jobs come pre-sorted from the API)
    const displayJobs = applySorting(app.filteredJobs, app.sortState);

    // Use totalJobCount for pagination when in server-side mode
    const totalCount = app.serverSide ? app.totalJobCount : displayJobs.length;
    const totalPages = Math.ceil(totalCount / app.perPage);

    // Bounds check
    if (app.currentPage > totalPages && totalPages > 0) app.currentPage = 1;
    if (app.currentPage < 1) app.currentPage = 1;

    // In server-side mode, the pageJobs are already the correct slice from the API
    // In client-side mode, slice from the full array
    const pageJobs = app.serverSide ? displayJobs : displayJobs.slice((app.currentPage - 1) * app.perPage, app.currentPage * app.perPage);

    // Clear grid
    grid.innerHTML = '';

    if (pageJobs.length === 0) {
        grid.innerHTML = '<div class="text-center py-5" style="color:#dfe6e9;grid-column:1/-1;"><p class="fs-5">No jobs found</p><p class="text-muted">Try adjusting your filters.</p></div>';
        updatePagination(app.currentPage, 1, totalCount, app.filterState?.freshness);
        return;
    }

    // Load application status once for all tiles on this page
    const apps = loadApplicationStatus();

    // Render tiles
    pageJobs.forEach(job => {
        const div = document.createElement('div');
        div.innerHTML = renderTile(job, apps);
        const tile = div.firstElementChild;
        if (tile) grid.appendChild(tile);
    });

    updatePagination(app.currentPage, totalPages, totalCount, app.filterState?.freshness);
}
