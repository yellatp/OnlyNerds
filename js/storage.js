// ============================================================
// ONLY NERDS — LOCAL STORAGE UTILITIES
// ============================================================

const STORAGE_KEY = 'job-applications';

/**
 * Normalize BambooHR career URLs so saved jobs with /careers/view/ID
 * are migrated to /careers/ID format for consistent lookup.
 */
function normalizeBambooUrl(url) {
    if (!url || !url.includes('bamboohr.com/careers')) return url;
    const match = url.match(/https:\/\/([^.]+)\.bamboohr\.com/);
    if (!match) return url;
    const slug = match[1];
    // Companies that use /careers/ID format (not /careers/view/ID)
    const altFormat = new Set(['31greenltd']);
    if (altFormat.has(slug) && url.includes('/careers/view/')) {
        return url.replace('/careers/view/', '/careers/');
    }
    return url;
}

/** Load all application statuses from localStorage */
export function loadApplicationStatus() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const apps = saved ? JSON.parse(saved) : {};
        // Migrate old BambooHR URLs to normalized format
        const migrated = {};
        for (const [url, val] of Object.entries(apps)) {
            const normalized = normalizeBambooUrl(url);
            // If normalized differs and the normalized key doesn't already exist, use it
            if (normalized !== url && !(normalized in apps)) {
                migrated[normalized] = val;
            } else {
                migrated[url] = val;
            }
        }
        return migrated;
    } catch {
        return {};
    }
}

/** Save a job's application status */
export function saveApplicationStatus(jobUrl, status) {
    const apps = loadApplicationStatus();
    apps[jobUrl] = {
        status: status, // 'saved', 'applied', 'ignored'
        date: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

/** Delete a job's application status */
export function deleteApplicationStatus(jobUrl) {
    const apps = loadApplicationStatus();
    delete apps[jobUrl];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

/** Get the count of saved jobs */
export function getSavedJobsCount() {
    const apps = loadApplicationStatus();
    return Object.values(apps).filter(a => a.status === 'saved').length;
}

/** Get all saved job URLs */
export function getSavedJobUrls() {
    const apps = loadApplicationStatus();
    return Object.entries(apps)
        .filter(([, v]) => v.status === 'saved')
        .map(([url]) => url);
}
