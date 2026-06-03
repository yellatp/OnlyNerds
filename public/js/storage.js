// ============================================================
// ONLY NERDS — LOCAL STORAGE UTILITIES
// ============================================================

import { normalizeBambooUrl } from './ui_utils.js';

const STORAGE_KEY = 'job-applications';

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
