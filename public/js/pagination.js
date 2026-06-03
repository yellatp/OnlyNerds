// ============================================================
// PAGINATION
// ============================================================

/**
 * Get a human-readable label for a freshness filter value.
 * @param {string} freshness - The freshness filter value (e.g. '24h', '30d', '')
 * @returns {string}
 */
function getFreshnessLabel(freshness) {
    const labels = {
        '24h': 'Past 24 hours',
        '3d': 'Past 3 days',
        '5d': 'Past 5 days',
        '10d': 'Past 10 days',
        '30d': 'Past 30 days',
        '45d': 'Past 45 days',
        '60d': 'Past 60 days',
    };
    return labels[freshness] || 'All Time';
}

/**
 * Update the pagination info text, freshness badge, and button disabled states.
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {number} totalJobs - Total filtered job count
 * @param {string} [freshness] - Active freshness filter value
 */
export function updatePagination(currentPage, totalPages, totalJobs, freshness) {
    const pageInfo = `Page ${currentPage} of ${totalPages} (${totalJobs.toLocaleString()} jobs)`;

    document.getElementById('page-info').textContent = pageInfo;
    document.getElementById('page-info-bottom').textContent = pageInfo;

    // Update freshness badge dynamically
    const freshnessEl = document.getElementById('stats-freshness');
    if (freshnessEl) {
        const label = getFreshnessLabel(freshness);
        freshnessEl.textContent = `(${label})`;
    }

    const prevBtns = [document.getElementById('prev-page')];
    const nextBtns = [document.getElementById('next-page')];

    prevBtns.forEach(btn => { if (btn) btn.disabled = currentPage === 1; });
    nextBtns.forEach(btn => { if (btn) btn.disabled = currentPage === totalPages; });
}
