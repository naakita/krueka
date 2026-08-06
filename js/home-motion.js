/* Krueka — motion real optimizado: mano, piedra y planeta Tierra. */
(function () {
  'use strict';
  var host = document.getElementById('hero-motion');
  var video = document.getElementById('hero-video');
  if (!host || !video) return;

  var poster = window.__KRUEKA_MOTION_POSTER || '';
  window.__KRUEKA_MOTION_POSTER = null;
  if (poster) {
    host.style.backgroundImage = 'url("' + poster + '")';
    host.style.backgroundSize = 'cover';
    host.style.backgroundPosition = 'center';
    video.poster = poster;
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  try {
    var encoded = (window.__KRUEKA_MOTION || []).join('');
    window.__KRUEKA_MOTION = null;
    var binary = atob(encoded);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    var source = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
    video.addEventListener('loadeddata', function () {
      video.classList.add('ready');
      var play = video.play();
      if (play && typeof play.catch === 'function') play.catch(function () {});
    }, { once: true });
    video.src = source;
    video.load();
    window.addEventListener('pagehide', function () { URL.revokeObjectURL(source); }, { once: true });
  } catch (error) {
    console.warn('Krueka motion: se mostrará la imagen de respaldo.', error);
  }
})();
