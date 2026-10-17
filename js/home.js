/* Krueka · navegación pública. Contenido y tema independientes de JavaScript. */
(function () {
  'use strict';
  var nav = document.getElementById('nav');
  function syncNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 14); }
  window.addEventListener('scroll', syncNav, { passive: true }); syncNav();
  var menu = document.querySelector('.menu-button');
  var links = document.getElementById('nav-links');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Abrir menú');
    links.classList.remove('open');
  }
  if (menu && links) {
    menu.addEventListener('click', function () {
      if (menu.getAttribute('aria-expanded') === 'true') { closeMenu(); return; }
      menu.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-label', 'Cerrar menú'); links.classList.add('open');
    });
    links.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
    });
  }
  var year = document.getElementById('year'); if (year) year.textContent = String(new Date().getFullYear());
})();
