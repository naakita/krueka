/* Acceso a Krueka: recuperar la cuenta y crear una contraseña nueva */
(function () {
  var g = function (id) { return document.getElementById(id); };

  function decir(caja, texto, tipo) {
    var box = g(caja);
    if (!box) { alert(texto); return; }
    box.textContent = texto;
    box.className = "alert " + (tipo || "ok");
    box.classList.remove("hidden");
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
        redirectTo: location.origin + location.pathname
      });

      if (link) link.textContent = original;
      if (r && r.error) { decir("err-doc", "No se pudo enviar el correo: " + r.error.message, "err"); return; }
      decir("err-doc", "Listo. Te enviamos un correo a " + correo + " con el enlace para crear una contrase\u00f1a nueva. Si no lo ves, revis\u00e1 el correo no deseado.", "ok");
    },

    /* Guarda la contraseña nueva (cuando el usuario vuelve desde el correo) */
    async guardarNueva(e) {
      e.preventDefault();
      var p1 = g("np1").value, p2 = g("np2").value;
      if (p1.length < 8) { decir("err-nueva", "La contrase\u00f1a debe tener al menos 8 caracteres.", "err"); return; }
      if (p1 !== p2) { decir("err-nueva", "Las dos contrase\u00f1as no coinciden.", "err"); return; }
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
