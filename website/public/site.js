// Progressive decoration only. Content and navigation work without JavaScript.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('arrived');
      observer.unobserve(entry.target);
    }
  }, {threshold: 0.08});
  document.querySelectorAll('.steps article, .link-grid > a, .change-card').forEach(element => {
    element.classList.add('reveal');
    observer.observe(element);
  });
}
