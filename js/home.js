/* Krueka — home pública: navegación, reveal y detalles de interfaz. */
(function () {
  'use strict';
  var soft=document.createElement('link');soft.rel='stylesheet';soft.href='css/home-soft.css?v=20260806f';document.head.appendChild(soft);
  document.querySelectorAll('a[href="#clubes"], #clubes').forEach(function(el){el.remove();});
  document.querySelectorAll('.signal-strip span').forEach(function(el){if(el.textContent.trim()==='Clubes internos')el.remove();});
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduced) { reveals.forEach(function (el) { el.classList.add('is-visible'); }); }
  else { var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.11, rootMargin: '0px 0px -7% 0px' }); reveals.forEach(function (el) { observer.observe(el); }); }
  var nav = document.getElementById('nav');
  function syncNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 14); }
  window.addEventListener('scroll', syncNav, { passive: true }); syncNav();
  var menu = document.querySelector('.menu-button'); var links = document.getElementById('nav-links');
  if (menu && links) { menu.addEventListener('click', function () { var open = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!open)); menu.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú'); links.classList.toggle('open', !open); }); links.addEventListener('click', function (event) { if (event.target.tagName !== 'A') return; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Abrir menú'); links.classList.remove('open'); }); }
  var year = document.getElementById('year'); if (year) year.textContent = String(new Date().getFullYear());
})();
