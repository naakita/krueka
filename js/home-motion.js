/* Krueka home — video motion: una mano levanta una piedra que se convierte en la Tierra.
   Escena SVG animada por CSS; se reproduce sola y en bucle. */
(function () {
  var host = document.getElementById('hero-motion');
  if (!host) return;

  host.innerHTML =
    '<div class="motion-stage" aria-hidden="true">' +
      '<svg viewBox="0 0 320 320" width="320" height="320" role="img" aria-label="Una mano levanta una piedra que se convierte en la Tierra">' +
        '<defs>' +
          '<radialGradient id="stoneG" cx="38%" cy="32%" r="80%">' +
            '<stop offset="0%" stop-color="#b9bec7"/><stop offset="55%" stop-color="#7d838f"/><stop offset="100%" stop-color="#4a4f59"/>' +
          '</radialGradient>' +
          '<radialGradient id="earthG" cx="38%" cy="32%" r="80%">' +
            '<stop offset="0%" stop-color="#7cc4ff"/><stop offset="55%" stop-color="#2783DE"/><stop offset="100%" stop-color="#0f3f78"/>' +
          '</radialGradient>' +
          '<radialGradient id="glowG" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="rgba(94,168,255,.55)"/><stop offset="100%" stop-color="rgba(94,168,255,0)"/>' +
          '</radialGradient>' +
        '</defs>' +

        '<circle class="m-glow" cx="160" cy="150" r="120" fill="url(#glowG)"/>' +

        '<g class="m-orbit">' +
          '<circle cx="160" cy="150" r="112" fill="none" stroke="rgba(154,163,192,.35)" stroke-width="1" stroke-dasharray="3 6"/>' +
          '<circle class="m-sat" cx="160" cy="38" r="4" fill="#5EA8FF"/>' +
          '<circle class="m-sat m-sat2" cx="160" cy="262" r="3" fill="#46A171"/>' +
        '</g>' +

        '<g class="m-spin">' +
          '<circle class="m-stone" cx="160" cy="150" r="70" fill="url(#stoneG)"/>' +
          '<g class="m-earth">' +
            '<circle cx="160" cy="150" r="70" fill="url(#earthG)"/>' +
            '<g fill="#46A171" opacity=".9">' +
              '<path d="M120 118 q14 -12 30 -6 q14 5 8 18 q-6 12 -22 10 q-16 -2 -16 -22"/>' +
              '<path d="M188 128 q16 -6 26 4 q8 10 -4 18 q-14 8 -24 -2 q-8 -12 2 -20"/>' +
              '<path d="M128 178 q10 -8 24 -4 q12 4 6 16 q-8 12 -22 8 q-12 -6 -8 -20"/>' +
              '<path d="M196 178 q14 -4 20 6 q6 10 -6 16 q-12 6 -20 -4 q-6 -12 6 -18"/>' +
            '</g>' +
            '<ellipse cx="138" cy="126" rx="22" ry="12" fill="rgba(255,255,255,.28)"/>' +
          '</g>' +
        '</g>' +

        '<g class="m-hand" fill="#e8b08a">' +
          '<path d="M150 250 q-4 -22 4 -34 q6 -8 12 -2 q4 4 4 12 l2 18 q10 -6 18 -2 q8 4 6 14 q-2 10 -12 12 l-22 4 q-10 2 -12 -10"/>' +
          '<rect x="146" y="244" width="30" height="34" rx="12"/>' +
        '</g>' +

        '<text class="m-tag" x="160" y="306" text-anchor="middle" fill="#9AA3C0" font-family="Sora,Inter,sans-serif" font-size="15" font-weight="700">Transformamos la educación a nivel mundial</text>' +
      '</svg>' +
    '</div>';
})();
