/* Acceso a Krueka: captcha, recuperar la cuenta y crear una contraseña nueva */
(function () {
  var g = function (id) { return document.getElementById(id); };

  function decir(caja, texto, tipo) {
    var box = g(caja);
    if (!box) { alert(texto); return; }
    box.textContent = texto;
    box.className = "alert " + (tipo || "ok");
    box.classList.remove("hidden");
  }

  /* ---- Captcha de Cloudflare Turnstile ----
     El widget vive dentro del formulario de docentes y deja su comprobante
     en un campo oculto. Si Cloudflare no carga, el ingreso sigue funcionando. */
  var Captcha = {
    campo: function () { return document.querySelector('#form-doc [name="cf-turnstile-response"]'); },
    token: function () { var c = Captcha.campo(); return (c && c.value) || undefined; },
    reiniciar: function () { try { if (window.turnstile) window.turnstile.reset(); } catch (err) {} }
  };
  window.Captcha = Captcha;

  /* ---- Aviso de contraseñas filtradas ----
     Consulta el servicio público HaveIBeenPwned con el método de anonimato por
     prefijo: solo viajan los primeros 5 caracteres del hash, nunca la contraseña. */
  async function vecesFiltrada(clave) {
    try {
      if (!(window.crypto && crypto.subtle)) return 0;
      var datos = new TextEncoder().encode(clave);
      var hash = await crypto.subtle.digest("SHA-1", datos);
      var hex = Array.from(new Uint8Array(hash)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("").toUpperCase();
      var prefijo = hex.slice(0, 5), resto = hex.slice(5);
      var r = await fetch("https://api.pwnedpasswords.com/range/" + prefijo, { headers: { "Add-Padding": "true" } });
      if (!r.ok) return 0;
      var texto = await r.text();
      var linea = texto.split("\n").find(function (l) { return l.slice(0, resto.length).toUpperCase() === resto; });
      if (!linea) return 0;
      return parseInt((linea.split(":")[1] || "0").trim(), 10) || 0;
    } catch (err) { return 0; }
  }

  var Cuenta = {
    /* Envía el correo con el enlace para crear una contraseña nueva */
    async recuperar(e) {
      if (e) e.preventDefault();
      var campo = g("email");
      var correo = ((campo && campo.value) || "").trim();
      if (!correo) {
        correo = (window.prompt("Escrib\u00ed tu correo institucional y te enviamos el enlace para crear una contrase\u00f1a nueva:") || "").trim();
        if (campo && correo) campo.value = correo;
      }
      if (!correo) return;
      if (correo.indexOf("@") === -1) { decir("err-doc", "Ese correo no parece v\u00e1lido.", "err"); return; }

      var link = g("link-recuperar");
      var original = link ? link.textContent : "";
      if (link) link.textContent = "Enviando\u2026";

      var r = await db.auth.resetPasswordForEmail(correo, {
        redirectTo: location.origin + location.pathname,
        captchaToken: Captcha.token()
      });

      if (link) link.textContent = original;
      Captcha.reiniciar();
      if (r && r.error) { decir("err-doc", "No se pudo enviar el correo: " + r.error.message, "err"); return; }
      decir("err-doc", "Listo. Te enviamos un correo a " + correo + " con el enlace para crear una contrase\u00f1a nueva. Si no lo ves, revis\u00e1 el correo no deseado.", "ok");
    },

    /* Guarda la contraseña nueva (cuando el usuario vuelve desde el correo) */
    async guardarNueva(e) {
      e.preventDefault();
      var p1 = g("np1").value, p2 = g("np2").value;
      if (p1.length < 10) { decir("err-nueva", "La contrase\u00f1a debe tener al menos 10 caracteres.", "err"); return; }
      if (p1 !== p2) { decir("err-nueva", "Las dos contrase\u00f1as no coinciden.", "err"); return; }
      if (!/[0-9]/.test(p1) || !/[a-zA-Z]/.test(p1)) { decir("err-nueva", "Combin\u00e1 letras y n\u00fameros para que sea m\u00e1s segura.", "err"); return; }

      decir("err-nueva", "Revisando que la contrase\u00f1a sea segura\u2026", "info");
      var veces = await vecesFiltrada(p1);
      if (veces > 0) {
        decir("err-nueva", "Esa contrase\u00f1a aparece en filtraciones p\u00fablicas de internet (" + veces.toLocaleString("es") + " veces). Eleg\u00ed otra distinta.", "err");
        return;
      }

      var r = await db.auth.updateUser({ password: p1 });
      if (r && r.error) { decir("err-nueva", "No se pudo cambiar la contrase\u00f1a: " + r.error.message, "err"); return; }
      decir("err-nueva", "Tu contrase\u00f1a qued\u00f3 cambiada. Ya pod\u00e9s entrar con ella.", "ok");
      setTimeout(function () { location.href = location.pathname; }, 1800);
    },

    cancelarNueva() {
      var n = g("screen-nueva"), l = g("screen-login");
      if (n) n.classList.add("hidden");
      if (l) l.classList.remove("hidden");
      try { history.replaceState(null, "", location.pathname); } catch (err) {}
    },

    mostrarNueva() {
      var n = g("screen-nueva"), l = g("screen-login"), a = g("screen-app");
      if (!n) return;
      if (l) l.classList.add("hidden");
      if (a) a.classList.add("hidden");
      n.classList.remove("hidden");
    }
  };

  window.Cuenta = Cuenta;

  /* Si vuelve desde el enlace del correo, mostrarle el formulario de contraseña nueva */
  try {
    if (typeof db !== "undefined" && db.auth && db.auth.onAuthStateChange) {
      db.auth.onAuthStateChange(function (evento) {
        if (evento === "PASSWORD_RECOVERY") Cuenta.mostrarNueva();
      });
    }
  } catch (err) {}

  function revisarEnlace() {
    var h = location.hash || "";
    if (h.indexOf("type=recovery") !== -1) Cuenta.mostrarNueva();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", revisarEnlace);
  else revisarEnlace();
})();
