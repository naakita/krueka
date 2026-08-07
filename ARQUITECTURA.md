# Arquitectura de Krueka

> Documento de referencia obligatoria antes de modificar el proyecto.
> Si cambiás módulos, dependencias, tablas o funciones de servidor, **actualizá este archivo en el mismo commit**.
>
> Última verificación contra el código: 07/08/2026 (rama `main`).

---

## 1. Qué es y cómo se sirve

Aplicación web **estática**, sin build ni bundler, publicada en GitHub Pages
(`naakita.github.io/krueka`) y con `vercel.json` para despliegue alternativo.
Toda la persistencia vive en **Supabase** (proyecto `janebfpnknapvntfqolf`, Canadá central).

No hay backend propio: el navegador habla directo con Supabase usando la clave
*publishable*. **Toda la seguridad real la dan las políticas RLS y las funciones
de servidor**, no el código del cliente.

## 2. Grafo de carga (dependencia real entre archivos)

`app.html` contiene las pantallas principales y carga `js/core.js` antes de los módulos de rol. No hay `import`/`export`: los módulos usan objetos globales. Todo dato insertado en HTML debe pasar por `esc()`.

Reglas:

- `core.js` siempre se carga primero.
- Los handlers generados en HTML deben apuntar a funciones globales existentes.
- Evitar nombres globales repetidos.
- Cambiar `?v=AAAAMMDD` al modificar JavaScript para romper caché.

## 3. Núcleo escolar

`core.js` contiene la marca, el cliente de Supabase, utilidades, estado global, autenticación, menús, asignaciones, Centinela y Kiosco. Los módulos `docente.js`, `direccion.js`, `admin.js`, `gestion.js`, `primaria.js`, `grado.js`, `alumno.js` y relacionados amplían ese núcleo.

RLS está activo en las tablas escolares. Docentes acceden solo a sus cursos; dirección y administración acceden dentro de su institución.

## 4. Zonas de riesgo

1. `core.js`, porque lo usa toda la plataforma.
2. La frontera entre el sistema escolar y el Club.
3. Funciones `SECURITY DEFINER`: deben validar rol, institución o credencial privada.
4. Cualquier contenido dinámico sin `esc()`.
5. Caché de GitHub Pages después de publicar.

## 5. Plan B

La plataforma requiere internet (Supabase y CDN). Toda clase debe conservar un Plan B en papel o archivo local.

## 6. Club privado B.E.I.

El Club es exclusivo de la institución `88c4af03-bdce-48e6-b548-b6904fe704bd`. `/club/` es `noindex` y redirige a `app.html?club=bei`; no publica grupos, horarios, cuotas ni formulario general. `club_grupos()` y `club_inscribir(jsonb)` no son ejecutables por `anon`.

### Cliente

- `js/club-juego.js`: cargador compatible.
- `js/club-juego-1.js` a `club-juego-4.js`: experiencia base.
- `js/club-mejoras.js`: integración B.E.I. y avatar.
- `js/club-entregas.js`: evidencias, revisión y equipos.
- `js/club-retos.js`: ordenar, respuesta abierta y decisión justificada.
- `js/club-pausas.js`: pausa lúdica cada diez minutos.
- `club/club-mejoras.css`: temas claros crema/tierra y azul-gris.

### Evidencias y colaboración

- `club_project_files`: hasta 3 archivos por misión, máximo 4 MB; JPEG, PNG, WebP, PDF o texto.
- `club_challenge_teams`: equipos por misión.
- `club_challenge_members`: integrantes y aporte individual.

Las tablas tienen RLS sin acceso directo. Estudiantes usan funciones validadas por código B.E.I.; revisión, descarga y calificación requieren sesión de dirección o administración.

Las 112 actividades se distribuyen en 28 de elección, 28 de ordenar, 28 de respuesta abierta y 28 de decisión justificada. El orden correcto no se envía al navegador.

## 7. Inscripción privada por invitación

La ruta `club/inscripcion.html` es `noindex`, no muestra información pública del Club y necesita un token largo en `?t=`. El token no se guarda en el repositorio: Supabase conserva únicamente su hash SHA-256 en `club_invite_links`.

- El enlace vigente vence el 31/12/2026 y admite hasta 100 solicitudes.
- `club_inscribir_bei(text,jsonb)` valida invitación, pertenencia declarada a B.E.I., edad de 7 a 17 años, datos mínimos y duplicados pendientes.
- El grupo se asigna en servidor según la edad; el cliente no recibe horarios, cuotas ni IDs de grupos.
- `club_invite_links` tiene RLS y todos los permisos directos revocados.
- Los datos se insertan en `club_requests` y siguen el flujo existente de aprobación por dirección.
- El formulario usa `no-referrer`, no persiste sesión y elimina el token de la barra después de enviar.
