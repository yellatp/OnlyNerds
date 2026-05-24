// ============================================================
// FILTERING
// ============================================================

import { escapeRegex, escape } from './ui_utils.js';
import { loadApplicationStatus } from './storage.js';

/**
 * US state abbreviations → normalized location name.
 * Used by the location filter so "CA", "California", "TX" all match "United States".
 */
const US_STATE_MAP = {
    'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas',
    'ca': 'California', 'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware',
    'fl': 'Florida', 'ga': 'Georgia', 'hi': 'Hawaii', 'id': 'Idaho',
    'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa', 'ks': 'Kansas',
    'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
    'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi',
    'mo': 'Missouri', 'mt': 'Montana', 'ne': 'Nebraska', 'nv': 'Nevada',
    'nh': 'New Hampshire', 'nj': 'New Jersey', 'nm': 'New Mexico', 'ny': 'New York',
    'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio', 'ok': 'Oklahoma',
    'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island', 'sc': 'South Carolina',
    'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah',
    'vt': 'Vermont', 'va': 'Virginia', 'wa': 'Washington', 'wv': 'West Virginia',
    'wi': 'Wisconsin', 'wy': 'Wyoming',
    'dc': 'District of Columbia',
    // Common non-standard abbreviations
    'mass': 'Massachusetts', 'penn': 'Pennsylvania', 'conn': 'Connecticut',
    'miss': 'Mississippi', 'mizzou': 'Missouri', 'cali': 'California',
    'philly': 'Pennsylvania', 'sf': 'California', 'la': 'California',
    'nyc': 'New York', 'bk': 'New York',
};

/**
 * Normalize a location string so US state abbreviations map to "United States".
 * This ensures "CA", "California", "San Francisco, CA" all match when filtering by "United States".
 */
function normalizeLocation(location) {
    if (!location) return location;
    const lower = location.toLowerCase().trim();

    // Check if it's a US state abbreviation
    if (US_STATE_MAP[lower]) return 'United States';

    // Check if location contains a US state (e.g., "San Francisco, CA")
    const stateMatch = lower.match(/\b([a-z]{2})\b$/);
    if (stateMatch && US_STATE_MAP[stateMatch[1]]) return 'United States';

    // Check for full state name
    for (const [abbr, name] of Object.entries(US_STATE_MAP)) {
        if (lower.includes(name.toLowerCase())) return 'United States';
    }

    return location;
}

/**
 * Read current filter values from the DOM.
 * @returns {object} Filter state object
 */
export function readFilterInputs() {
    // Read from the search bar location input (primary), fall back to advanced filter input
    const locationEl = document.getElementById('filter-location');
    const locationAdvEl = document.getElementById('filter-location-adv');
    const locationVal = (locationEl?.value || locationAdvEl?.value || '').toLowerCase().trim();
    return {
        hideRecruiters: true,
        hideApplied: false,
        search: document.getElementById('filter-search')?.value?.toLowerCase().trim() || '',
        location: locationVal,
        company: document.getElementById('filter-company')?.value || '',
        department: document.getElementById('filter-department')?.value || '',
        salary_min: document.getElementById('filter-salary-min')?.value || '',
        skill_level: document.getElementById('filter-skill-level')?.value || '',
        employment_type: document.getElementById('filter-employment-type')?.value || '',
        remote: document.getElementById('filter-remote')?.value || '',
        ats: document.getElementById('filter-ats')?.value || '',
        freshness: document.getElementById('filter-freshness')?.value || '',
        show: document.getElementById('filter-show')?.value || '',
        // Domain and category are managed via app state, not DOM inputs
        domain: '',
        category: ''
    };
}

/**
 * Populate company and department select filters from loaded jobs.
 * @param {Array} allJobs
 */
export function populateFilterOptions(allJobs) {
    const companies = new Set();
    const departments = new Set();

    for (const job of allJobs) {
        const c = job.company || job.company_slug;
        if (c) companies.add(c);
        if (job.department) departments.add(job.department);
    }

    const companySelect = document.getElementById('filter-company');
    const deptSelect = document.getElementById('filter-department');

    if (companySelect) {
        const currentVal = companySelect.value;
        companySelect.innerHTML = '<option value="">Company</option>';
        [...companies].sort().forEach(c => {
            companySelect.innerHTML += `<option value="${escape(c)}">${escape(c)}</option>`;
        });
        companySelect.value = currentVal;
    }

    if (deptSelect) {
        const currentVal = deptSelect.value;
        deptSelect.innerHTML = '<option value="">Department</option>';
        [...departments].sort().forEach(d => {
            deptSelect.innerHTML += `<option value="${escape(d)}">${escape(d)}</option>`;
        });
        deptSelect.value = currentVal;
    }
}


/**
 * Filter the full jobs array based on the current filter inputs.
 * @param {Array} allJobs - The complete jobs array
 * @param {object} [overrides] - Optional overrides for domain/category (from app state)
 * @returns {{ filteredJobs: Array, filterState: object }}
 */
export function filterJobs(allJobs, overrides = {}) {
    const f = readFilterInputs();
    // Apply domain/category overrides from app state (not DOM)
    if (overrides.domain !== undefined) f.domain = overrides.domain;
    if (overrides.category !== undefined) f.category = overrides.category;
    const apps = loadApplicationStatus();

    const searchRegex = f.search ? new RegExp(escapeRegex(f.search), 'i') : null;
    const locationRegex = f.location ? new RegExp(escapeRegex(f.location), 'i') : null;

    const filterState = { ...f };

    const now = Date.now();

    const filteredJobs = allJobs.filter(job => {
        // Recruiter filter
        if (f.hideRecruiters && job.is_recruiter === true) return false;

        // Application status
        const url = job.absolute_url || job.url;
        const jobStatus = apps[url]?.status || '';

        if (f.hideApplied && (jobStatus === 'applied' || jobStatus === 'ignored')) return false;

        // Show filter
        if (f.show === 'saved' && jobStatus !== 'saved') return false;
        if (f.show === 'applied' && jobStatus !== 'applied') return false;

        // Text fields for search
        const title = (job.title || '').toLowerCase();
        const company = ((job.company || job.company_slug) || '').toLowerCase();
        let location = '';
        if (job.location) {
            location = typeof job.location === 'object'
                ? (job.location.name || '').toLowerCase()
                : (job.location || '').toLowerCase();
        }
        const department = (job.department || '').toLowerCase();

        // Search across title, company, location, department
        if (searchRegex) {
            const searchTarget = `${title} ${company} ${location} ${department}`;
            if (!searchRegex.test(searchTarget)) return false;
        }

        // Location filter (with US state normalization)
        if (locationRegex) {
            const normalizedLocation = normalizeLocation(location);
            // Try matching against both raw and normalized location
            if (!locationRegex.test(location) && !locationRegex.test(normalizedLocation)) {
                return false;
            }
        }

        // Company select filter
        if (f.company) {
            const jobCompany = (job.company || job.company_slug || '').toLowerCase();
            if (jobCompany !== f.company.toLowerCase()) return false;
        }

        // Department select filter
        if (f.department) {
            if (department !== f.department.toLowerCase()) return false;
        }

        // Salary min filter
        const minSalary = parseInt(f.salary_min) || 0;
        if (minSalary > 0) {
            const median = job.salary?.median;
            if (!median || median < minSalary) return false;
        }

        // Remote filter
        if (f.remote === 'remote') {
            const isRemote = (job.workplaceType && job.workplaceType.toLowerCase() === 'remote');
            if (!isRemote) return false;
        } else if (f.remote === 'onsite') {
            const isRemote = (job.workplaceType && job.workplaceType.toLowerCase() === 'remote');
            if (isRemote) return false;
        }

        // ATS filter
        if (f.ats) {
            const jobAts = (job.ats || '').toLowerCase();
            if (jobAts !== f.ats.toLowerCase()) return false;
        }

        // Skill level filter
        if (f.skill_level) {
            const jobSkillLevel = (job.skill_level || '').toLowerCase();
            if (jobSkillLevel !== f.skill_level.toLowerCase()) return false;
        }

        // Employment type filter
        if (f.employment_type) {
            const jobType = (job.employment_type || '').toLowerCase();
            if (jobType !== f.employment_type.toLowerCase()) return false;
        }

        // Freshness filter
        if (f.freshness) {
            const dateStr = job.published_on || job.scraped_at;
            if (dateStr) {
                const jobDate = new Date(dateStr).getTime();
                if (!isNaN(jobDate)) {
                    const hoursAgo = (now - jobDate) / 3600000;
                    const hoursMap = { '24h': 24, '3d': 72, '5d': 120, '10d': 240, '30d': 720, '45d': 1080, '60d': 1440 };
                    const maxHours = hoursMap[f.freshness];
                    if (maxHours && hoursAgo > maxHours) return false;
                }
            } else if (f.freshness !== '') {
                return false;
            }
        }

        // ── Domain filter ────────────────────────────────────
        if (f.domain) {
            const jobDomain = job.domain || '';
            if (jobDomain !== f.domain) return false;
        }

        // ── Category filter ──────────────────────────────────
        if (f.category) {
            const jobCategory = job.category || '';
            if (jobCategory !== f.category) return false;
        }

        return true;
    });

    return { filteredJobs, filterState };
}

/** Reset all filter DOM inputs to defaults */
export function clearFilterInputs() {
    const els = {
        'filter-search': '',
        'filter-location': '',
        'filter-location-adv': '',
        'filter-company': '',
        'filter-department': '',
        'filter-salary-min': '',
        'filter-skill-level': '',
        'filter-employment-type': '',
        'filter-remote': '',
        'filter-ats': '',
        'filter-freshness': '',
        'filter-show': '',
    };
    Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });
}


