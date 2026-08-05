# Arquitectura de Krueka

> Documento de referencia obligatoria antes de modificar el proyecto.
> Si cambiás módulos, dependencias, tablas o funciones de servidor, **actualizá este archivo en el mismo commit**.
>
> Última verificación contra el código: 04/08/2026 (rama `main`).

---

## 1. Qué es y cómo se sirve

Aplicación web **estática**, sin build ni bundler, publicada en GitHub Pages
(`naakita.github.io/krueka`) y con `vercel.json` para despliegue alternativo.
Toda la persistencia vive en **Supabase** (proyecto `janebfpnknapvntfqolf`, Canadá central).

No hay backend propio: el navegador habla directo con Supabase usando la clave
*publishable*. **Toda la seguridad real la dan las políticas RLS y las funciones
de servidor**, no el código del cliente.

## 2. Grafo de carga (dependencia real entre archivos)

`index.html` contiene el HTML, todo el CSS y los tres contenedores de pantalla
(`#screen-login`, `#screen-app`, `#screen-alu`), y carga los scripts en este
orden exacto:

```
supabase-js@2 (CDN)
  └── js/core.js          ← base: db, estado, Auth, UI, Centinela, Kiosco
        ├── js/docente.js       (Docente.*)
        ├── js/direccion.js     (Direccion.*)
        ├── js/admin.js         (Admin.*)
        ├── js/taller.js
        ├── js/editor.js
        ├── js/trabajos.js
        ├── js/inclusion.js
        ├── js/gestion.js
        ├── js/primaria.js
        ├── js/grado.js
        ├── js/club.js
        └── js/alumno.js        (Alumno.*)
```

Reglas que se derivan del grafo:

- **No hay `import`/`export`.** Todo son objetos globales (`St`, `Auth`, `UI`,
  `Docente`, `Direccion`, `Admin`, `Alumno`, `Centinela`, `Kiosco`, …).
  Un nombre repetido en dos archivos se sobreescribe silenciosamente.
- `core.js` debe cargarse primero. Cualquier archivo nuevo va **después** de él.
- Los handlers están en `onclick="..."` dentro del HTML generado, así que toda
  función invocada desde la vista tiene que ser global. Renombrar un método
  rompe la vista sin error de compilación.
- Los `<script>` llevan `?v=AAAAMMDD` para romper caché.
  **Al modificar cualquier JS hay que subir esa versión en `index.html`**, si no
  los navegadores del aula siguen con el archivo viejo.

## 3. Qué contiene `core.js` (nada se toca sin leer esto)

| Bloque | Responsabilidad |
| --- | --- |
| `LOGO`, `#favicon` | marca, se aplica a todo `img.marca` |
| `SUPABASE_URL`, `SUPABASE_KEY`, `db` | único cliente Supabase de toda la app |
| `ETAPAS` | las 4 etapas de la clase: tema → actividad → entrega → resultado |
| `esc()`, `$()`, `hoy()`, `aviso()` | utilidades. `esc()` es la **única** defensa contra XSS en el HTML generado |
| `St` | estado global: user, perfil, asignaciones, csActual, planes, sesion, alumnos, asis, tab |
| `Auth` | login por correo/contraseña, carga de perfil, `ultimo_acceso`, logout |
| `UI` | menús por rol y `UI.ir()` con la **tabla de despacho** hacia `Docente.*`, `Direccion.*`, `Admin.*` |
| `cargarAsignaciones()`, `selectorCurso()`, `cargarAlumnos()`, `asignacionActual()` | datos compartidos entre módulos |
| `deviceId()` | identificador de PC guardado en `localStorage` |
| `Centinela` | telemetría de foco del alumno (salió, volvió, pegó texto, inactivo, rompió bloqueo) |
| `Kiosco` | pantalla completa forzada, bloqueo de teclas, cortina y pedido de permiso |

### Menús por rol (definidos en `UI.menus()`)

- **docente:** clase, planificación, alumnos, centinela, entregas, registro anecdótico, taller, mis cursos
- **director:** control docente, alumnos, planificaciones
- **admin:** control docente, usuarios y roles, cursos y materias

Agregar una entrada de menú exige **dos** cambios: la tupla en `UI.menus()` y la
entrada correspondiente en la tabla de despacho de `UI.ir()`. Si falta la
segunda, la pestaña queda en «Cargando…» para siempre.

## 4. Dependencias hacia la base de datos

Esto es lo que **ningún analizador de código detecta** y lo que más rompe la app.

Tablas leídas o escritas desde `core.js`:

- `profiles` (id, nombre, role, ultimo_acceso)
- `course_subjects` (id, horas_semanales, teacher_id) con relación a `courses` y `subjects`
- `enrollments` (course_id, activo, numero_lista) con relación a `students`

Funciones de servidor (RPC) invocadas desde `core.js`:

- `registrar_evento_foco(p_codigo, p_student_id, p_tipo, p_detalle, p_segundos)`
- `pedir_salida(p_codigo, p_student_id, p_motivo)`
- `estado_kiosco(p_codigo, p_student_id)` → `{ abierta, kiosco, liberado, liberado_hasta }`

Además, el esquema completo tiene 15 tablas (instituciones, perfiles, materias,
cursos, asignaciones, alumnos, matrículas, planificaciones, indicadores,
sesiones de clase, asistencia, registro anecdótico, entregas, puntajes por
indicador y auditoría), 2 vistas de control y las funciones para abrir clase,
entrar con código, entregar trabajo y consultar resultado. El Club de
informática (`js/club.js`) tiene su propio registro, **separado del sistema
escolar**: no mezclar sus tablas con matrículas ni asistencia.

**RLS activado en todas las tablas.** Cada docente ve solo sus cursos; dirección
y administración ven toda la institución. Un cambio de consulta que «no anda»
casi siempre es una política RLS, no un bug de JavaScript.

## 5. Zonas de riesgo (ordenadas por impacto)

1. **`core.js`** — lo usa todo. Un error acá tira la plataforma completa.
2. **`gestion.js` (40 KB), `docente.js` (33 KB), `editor.js` (28 KB), `club.js` (28 KB), `primaria.js` (26 KB)** — los archivos más grandes; conviene leerlos completos antes de editarlos.
3. **Frontera escolar ↔ club** — el club se desplegó encima del sistema escolar. Al tocar el club, verificar que asistencia, planificaciones y entregas sigan funcionando.
4. **Nombres globales** — colisión silenciosa entre archivos.
5. **Versión de caché** en `index.html`.

## 6. Plan B y aula sin internet

La plataforma **requiere internet** (Supabase + CDN de supabase-js). Toda clase
planificada en Krueka necesita su Plan B en papel o en archivo local.
