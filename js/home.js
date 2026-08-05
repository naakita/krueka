/* Krueka — home: motion de entrada al hacer scroll */
(function () {
  var els = document.querySelectorAll('.reveal');

  // Si no hay IntersectionObserver o el usuario prefiere menos movimiento, mostrar todo.
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduced) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  els.forEach(function (el) { io.observe(el); });

  // Sombra de la barra de navegación al hacer scroll.
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (!nav) return;
    nav.style.boxShadow = (window.scrollY > 10) ? '0 10px 30px rgba(0,0,0,.35)' : 'none';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
