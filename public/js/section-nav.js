// ============================================================
// SHARED SECTION NAVIGATION
// ============================================================
// Highlights the active section link based on scroll position.
// Used by companies.astro and job-search.astro.
// Links must have class 'section-link' and data-section attr matching section id.

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.section-link');
    if (!navLinks.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    navLinks.forEach((l) => {
                        const active = l.getAttribute('data-section') === entry.target.id;
                        if (active) {
                            l.style.color = '#EDEDEA';
                            l.style.background = '#1C1C18';
                        } else {
                            l.style.color = '#706E66';
                            l.style.background = 'transparent';
                        }
                    });
                }
            });
        },
        { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );

    navLinks.forEach((l) => {
        const id = l.getAttribute('data-section') ?? '';
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
});
