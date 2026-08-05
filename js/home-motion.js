/* Krueka home — video motion elaborado:
   una mano levanta una piedra que da la vuelta y se transforma en la Tierra.
   Escena SVG detallada (continentes, atmósfera, nubes, estrellas) animada por CSS. */
(function () {
  var host = document.getElementById('hero-motion');
  if (!host) return;

  host.innerHTML =
    '<div class="motion-stage" aria-hidden="true">' +
    '<svg viewBox="0 0 360 360" width="340" height="340" role="img" aria-label="Una mano levanta una piedra que se convierte en la Tierra">' +
      '<defs>' +
        '<radialGradient id="ocean" cx="36%" cy="30%" r="85%">' +
          '<stop offset="0%" stop-color="#8fd0ff"/><stop offset="45%" stop-color="#3f97e8"/>' +
          '<stop offset="80%" stop-color="#1763b8"/><stop offset="100%" stop-color="#0b3f7e"/>' +
        '</radialGradient>' +
        '<radialGradient id="stoneG" cx="38%" cy="30%" r="85%">' +
          '<stop offset="0%" stop-color="#c8ccd4"/><stop offset="55%" stop-color="#878d99"/><stop offset="100%" stop-color="#4c525c"/>' +
        '</radialGradient>' +
        '<linearGradient id="landG" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#5cc98a"/><stop offset="100%" stop-color="#2f8f5f"/>' +
        '</linearGradient>' +
        '<radialGradient id="atmo" cx="50%" cy="50%" r="50%">' +
          '<stop offset="62%" stop-color="rgba(125,190,255,0)"/>' +
          '<stop offset="86%" stop-color="rgba(125,190,255,.28)"/>' +
          '<stop offset="100%" stop-color="rgba(125,190,255,0)"/>' +
        '</radialGradient>' +
        '<radialGradient id="burst" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="rgba(255,255,255,.95)"/>' +
          '<stop offset="45%" stop-color="rgba(125,190,255,.55)"/>' +
          '<stop offset="100%" stop-color="rgba(125,190,255,0)"/>' +
        '</radialGradient>' +
        '<clipPath id="globeClip"><circle cx="180" cy="168" r="76"/></clipPath>' +
        '<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '</defs>' +

      '<g class="m-stars" fill="#dfe9ff">' +
        '<circle class="st" cx="60" cy="60" r="1.6"/><circle class="st st2" cx="300" cy="80" r="1.4"/>' +
        '<circle class="st st3" cx="40" cy="200" r="1.3"/><circle class="st st2" cx="320" cy="210" r="1.7"/>' +
        '<circle class="st st3" cx="90" cy="300" r="1.3"/><circle class="st" cx="290" cy="300" r="1.5"/>' +
        '<circle class="st st2" cx="180" cy="34" r="1.3"/>' +
      '</g>' +

      '<circle class="m-atmo" cx="180" cy="168" r="76" fill="url(#atmo)"/>' +

      '<g class="m-spin">' +
        '<circle class="m-stone" cx="180" cy="168" r="76" fill="url(#stoneG)"/>' +
        '<g class="m-stone-tex" fill="rgba(0,0,0,.14)">' +
          '<ellipse cx="158" cy="150" rx="16" ry="9"/><ellipse cx="205" cy="150" rx="11" ry="7"/>' +
          '<ellipse cx="170" cy="196" rx="14" ry="8"/><ellipse cx="205" cy="196" rx="8" ry="5"/>' +
        '</g>' +
        '<ellipse class="m-stone-hi" cx="155" cy="138" rx="20" ry="11" fill="rgba(255,255,255,.30)"/>' +

        '<g class="m-earth">' +
          '<circle cx="180" cy="168" r="76" fill="url(#ocean)"/>' +
          '<g clip-path="url(#globeClip)">' +
            '<g class="m-continents" fill="url(#landG)">' +
              '<path d="M118 128 q10 -16 30 -18 q22 -2 26 10 q3 12 -8 18 q-6 16 -22 20 q-16 4 -24 -6 q-8 -14 -2 -24"/>' +
              '<path d="M136 176 q12 -6 22 2 q9 8 6 22 q-3 14 -16 18 q-13 3 -18 -8 q-5 -18 6 -34"/>' +
              '<path d="M186 118 q10 -12 24 -10 q14 2 16 12 q2 10 -8 14 q-14 6 -24 2 q-10 -6 -8 -18"/>' +
              '<path d="M188 142 q14 -8 26 0 q12 8 8 24 q-4 16 -18 20 q-14 4 -20 -8 q-6 -20 4 -36"/>' +
              '<path d="M232 132 q12 -4 18 6 q6 10 -2 20 q-8 10 -20 6 q-10 -4 -10 -16 q0 -10 14 -16"/>' +
              '<path d="M238 200 q10 -4 16 4 q5 8 -3 14 q-9 6 -17 0 q-7 -6 -2 -14 q3 -3 6 -4"/>' +
            '</g>' +
            '<ellipse cx="180" cy="96" rx="40" ry="12" fill="rgba(255,255,255,.85)"/>' +
            '<ellipse cx="180" cy="240" rx="34" ry="10" fill="rgba(255,255,255,.55)"/>' +
            '<g class="m-clouds" fill="rgba(255,255,255,.5)">' +
              '<ellipse cx="150" cy="140" rx="24" ry="8"/><ellipse cx="215" cy="120" rx="18" ry="6"/>' +
              '<ellipse cx="195" cy="200" rx="22" ry="7"/>' +
            '</g>' +
            '<ellipse cx="180" cy="168" rx="76" ry="76" fill="none"/>' +
            '<path d="M104 168 a76 76 0 0 0 152 0 z" fill="rgba(6,20,46,.22)"/>' +
          '</g>' +
          '<ellipse cx="156" cy="140" rx="22" ry="12" fill="rgba(255,255,255,.32)"/>' +
        '</g>' +
      '</g>' +

      '<circle class="m-burst" cx="180" cy="168" r="10" fill="url(#burst)"/>' +

      '<g class="m-orbit">' +
        '<circle cx="180" cy="168" r="118" fill="none" stroke="rgba(160,180,220,.4)" stroke-width="1" stroke-dasharray="2 7"/>' +
        '<circle class="m-sat" cx="180" cy="50" r="4.5" fill="#7cc4ff"/>' +
        '<circle class="m-sat m-sat2" cx="180" cy="286" r="3.5" fill="#5cc98a"/>' +
      '</g>' +

      '<g class="m-hand">' +
        '<path d="M164 306 q-6 -26 2 -40 q5 -8 12 -6 q6 2 8 10 l3 16 q8 -8 17 -6 q9 2 11 11 q2 10 -6 14 q-14 8 -28 10 q-14 2 -19 -9" fill="#eab389"/>' +
        '<rect x="160" y="298" width="34" height="38" rx="13" fill="#eab389"/>' +
        '<path d="M164 306 q-6 -26 2 -40 q5 -8 12 -6 q6 2 8 10 l3 16 q8 -8 17 -6 q9 2 11 11 q2 10 -6 14" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>' +
      '</g>' +

      '<text class="m-tag" x="180" y="342" text-anchor="middle" fill="#aeb8d6" font-family="Sora,Inter,sans-serif" font-size="15.5" font-weight="700" letter-spacing=".3">Transformamos la educación a nivel mundial</text>' +
    '</svg>' +
    '</div>';
})();
