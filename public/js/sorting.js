// ============================================================
// ONLY NERDS — SORTING
// ============================================================

/**
 * Sort jobs array based on the given sort state.
 * @param {Array} jobs - The jobs array to sort
 * @param {{ key: string|null, direction: 'asc'|'desc' }} sortState
 * @returns {Array} The sorted array
 */
export function applySorting(jobs, sortState) {
    if (!sortState.key) return jobs;

    const { key, direction } = sortState;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...jobs].sort((a, b) => {
        let aVal, bVal;

        // Freshness sort: by published_on or scraped_at
        if (key === 'published_on') {
            const aDate = a.published_on || a.scraped_at;
            const bDate = b.published_on || b.scraped_at;
            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;
            return (new Date(aDate) - new Date(bDate)) * multiplier;
        }

        // Salary sort: by median
        if (key === 'salary') {
            aVal = a.salary?.median || 0;
            bVal = b.salary?.median || 0;
            return (aVal - bVal) * multiplier;
        }

        // Default string sort
        aVal = a[key] || '';
        bVal = b[key] || '';

        // Handle location object
        if (key === 'location') {
            if (aVal && typeof aVal === 'object') aVal = aVal.name || '';
            if (bVal && typeof bVal === 'object') bVal = bVal.name || '';
        }

        // Handle company_slug fallback
        if (key === 'company') {
            aVal = aVal || a.company_slug || '';
            bVal = bVal || b.company_slug || '';
        }

        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();

        // Push numeric-leading strings after alpha
        const aStartsWithNumber = /^\d/.test(aVal);
        const bStartsWithNumber = /^\d/.test(bVal);
        if (aStartsWithNumber && !bStartsWithNumber) return 1;
        if (!aStartsWithNumber && bStartsWithNumber) return -1;

        return aVal < bVal ? -multiplier : aVal > bVal ? multiplier : 0;
    });
}
