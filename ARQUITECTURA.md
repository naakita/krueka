# Arquitectura de Krueka

> Documento de referencia obligatoria antes de modificar el proyecto.
> Si cambiás módulos, dependencias, tablas o funciones de servidor, **actualizá este archivo en el mismo commit**.
>
> Última verificación contra el código: 07/08/2026 (rama `main`).

---

## 1. Qué es y cómo se sirve

Aplicación web **estática**, sin build ni bundler, publicada en GitHub Pages (`naakita.github.io/krueka`) y con `vercel.json` para despliegue alternativo. Toda la persistencia vive en **Supabase** (proyecto `janebfpnknapvntfqolf`, Canadá central).

No hay backend propio: el navegador habla directo con Supabase usando la clave *publishable*. **Toda la seguridad real la dan las políticas RLS y las funciones de servidor**, no el código del cliente.

## 2. Grafo de carga

`app.html` contiene las pantallas principales y carga `js/core.js` antes de los módulos de rol. No hay `import`/`export`: los módulos usan objetos globales. Todo dato insertado en HTML debe pasar por `esc()`.

- `core.js` siempre se carga primero.
- Los handlers generados deben apuntar a funciones globales existentes.
- Evitar nombres globales repetidos.
- Cambiar `?v=AAAAMMDD` al modificar JavaScript.

## 3. Núcleo escolar

`core.js` contiene marca, Supabase, utilidades, estado, autenticación, menús, asignaciones, Centinela y Kiosco. Los módulos de docente, dirección, administración, gestión, primaria, grado y alumno amplían ese núcleo. RLS limita el acceso según rol e institución.

## 4. Zonas de riesgo

1. `core.js`.
2. La frontera entre sistema escolar y Club.
3. Funciones `SECURITY DEFINER`: deben validar rol, institución o credencial privada.
4. Contenido dinámico sin `esc()`.
5. Caché de GitHub Pages.

## 5. Club privado B.E.I.

El Club es exclusivo de la institución `88c4af03-bdce-48e6-b548-b6904fe704bd`. `/club/` es `noindex` y redirige a `app.html?club=bei`; no publica grupos, horarios, cuotas ni formulario general. `club_grupos()` y `club_inscribir(jsonb)` no son ejecutables por `anon`.

### Cliente

- `js/club-juego.js` y fragmentos `club-juego-1.js` a `club-juego-4.js`.
- `js/club-mejoras.js`: integración y avatar.
- `js/club-entregas.js`: evidencias, revisión y equipos.
- `js/club-retos.js`: ordenar, respuesta abierta y decisión justificada.
- `js/club-pausas.js`: pausa cada diez minutos.
- `js/club-auditoria.js`: dispositivos, accesos y regeneración de código.

### Evidencias y colaboración

- `club_project_files`: hasta 3 archivos por misión, máximo 4 MB.
- `club_challenge_teams` y `club_challenge_members`: equipos y aportes.

Las tablas tienen RLS sin acceso directo. Las 112 actividades se distribuyen en 28 de elección, 28 de ordenar, 28 de respuesta abierta y 28 de decisión justificada.

## 6. Inscripción privada por invitación

`club/inscripcion.html` es `noindex` y necesita un token largo. Supabase conserva solo su hash SHA-256 en `club_invite_links`. `club_inscribir_bei(text,jsonb)` valida invitación, B.E.I., edad, datos mínimos y duplicados. El enlace vigente vence el 31/12/2026 y admite hasta 100 solicitudes.

## 7. Regeneración de acceso del Club

- `club_regenerar_codigo(uuid)` solo funciona para administración o dirección autenticada y únicamente sobre estudiantes de su institución.
- Genera un código personal nuevo de seis caracteres, invalida el anterior y libera el equipo vinculado.
- No crea otro alumno ni cambia su ID: conserva misiones, puntos, respuestas, equipos y evidencias.
- `club_liberar_dispositivo(uuid)` también valida la institución y permite conservar el mismo código.
- En **Auditoría club**, cada alumno activo tiene las opciones **liberar equipo** y **nuevo código**. El nuevo código se muestra y puede copiarse.
- Toda regeneración queda registrada en la auditoría sin guardar el código nuevo dentro del detalle del registro.
