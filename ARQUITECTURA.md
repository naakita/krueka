# Arquitectura de Krueka

> Documento de referencia obligatoria antes de modificar el proyecto.
> Si cambiás módulos, dependencias, tablas o funciones de servidor, **actualizá este archivo en el mismo commit**.
>
> Última verificación contra el código: 06/08/2026 (rama `main`).

---

## 1. Qué es y cómo se sirve

Aplicación web **estática**, sin build ni bundler, publicada en GitHub Pages
(`naakita.github.io/krueka`) y con `vercel.json` para despliegue alternativo.
Toda la persistencia vive en **Supabase** (proyecto `janebfpnknapvntfqolf`, Canadá central).

No hay backend propio: el navegador habla directo con Supabase usando la clave
*publishable*. **Toda la seguridad real la dan las políticas RLS y las funciones
de servidor**, no el código del cliente.

## 2. Grafo de carga (dependencia real entre archivos)

`app.html` contiene el HTML, todo el CSS y los tres contenedores de pantalla
(`#screen-login`, `#screen-app`, `#screen-alu`), y carga los scripts en este
orden base:

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
  **Al modificar cualquier JS hay que cambiar esa versión**, si no los
  navegadores del aula siguen con el archivo viejo.

## 3. Qué contiene `core.js` (nada se toca sin leer esto)

| Bloque | Responsabilidad |
| --- | --- |
| `LOGO`, `#favicon` | marca, se aplica a todo `img.marca` |
| `SUPABASE_URL`, `SUPABASE_KEY`, `db` | único cliente Supabase de toda la app |
| `ETAPAS` | las 4 etapas de la clase: tema → actividad → entrega → resultado |
| `esc()`, `$()`, `hoy()`, `aviso()` | utilidades. `esc()` es la **única** defensa contra XSS en el HTML generado |
| `St` | estado global: user, perfil, asignaciones, csActual, planes, sesion, alumnos, asis, tab |
| `Auth` | login por correo/contraseña, carga de perfil, `ultimo_acceso`, logout |
| `UI` | menús por rol y `UI.ir()` con la tabla de despacho hacia los módulos |
| `cargarAsignaciones()`, `selectorCurso()`, `cargarAlumnos()`, `asignacionActual()` | datos compartidos entre módulos |
| `deviceId()` | identificador de PC guardado en `localStorage` |
| `Centinela` | telemetría de foco del alumno |
| `Kiosco` | pantalla completa forzada, bloqueo de teclas y pedido de permiso |

### Menús por rol

- **docente:** clase, planificación, alumnos, centinela, entregas, registro anecdótico, taller, mis cursos
- **director:** control docente, alumnos, planificaciones
- **admin:** control docente, usuarios y roles, cursos y materias

Agregar una entrada de menú exige la tupla y la entrada correspondiente en la
tabla de despacho de `UI.ir()`.

## 4. Dependencias hacia la base de datos

Tablas leídas o escritas desde `core.js`:

- `profiles` (id, nombre, role, ultimo_acceso)
- `course_subjects` con relación a `courses` y `subjects`
- `enrollments` con relación a `students`

Funciones de servidor compartidas:

- `registrar_evento_foco(p_codigo, p_student_id, p_tipo, p_detalle, p_segundos)`
- `pedir_salida(p_codigo, p_student_id, p_motivo)`
- `estado_kiosco(p_codigo, p_student_id)`

**RLS activado en todas las tablas.** Cada docente ve solo sus cursos; dirección
y administración ven toda la institución. Un cambio de consulta que no funciona
suele ser una política o un permiso, no un bug de JavaScript.

## 5. Zonas de riesgo

1. **`core.js`** — lo usa todo.
2. **Archivos globales grandes** — leerlos completos antes de editar.
3. **Frontera escolar ↔ Club** — verificar siempre que asistencia, planificaciones y entregas normales sigan funcionando.
4. **Nombres globales** — colisión silenciosa entre archivos.
5. **Versión de caché** — actualizarla en cada despliegue.

## 6. Plan B y aula sin internet

La plataforma **requiere internet** (Supabase + CDN de supabase-js). Toda clase
planificada en Krueka necesita su Plan B en papel o en archivo local.

## 7. Club privado B.E.I. (06/08/2026)

El Club es exclusivo de la institución
`88c4af03-bdce-48e6-b548-b6904fe704bd` (B.E.I. — Betesda Educación Integral).
`/club/` no publica inscripción, grupos, horarios ni cuotas: es una página
`noindex` que redirige a `app.html?club=bei`. La home pública oculta el módulo.
`club_grupos()` y `club_inscribir(jsonb)` no son ejecutables por `anon`.

### Carga del cliente

`app.html` mantiene `js/club-juego.js` como punto compatible. Ese archivo carga,
con versión `20260806f`, los cuatro fragmentos del juego y luego:

- `js/club-mejoras.js`: integración B.E.I., normalización del avatar y tema.
- `js/club-entregas.js`: evidencia, revisión directiva y equipos.
- `js/club-retos.js`: ordenar, respuesta abierta y decisión justificada.
- `js/club-pausas.js`: pausa lúdica de memoria cada diez minutos.
- `club/club-mejoras.css`: temas crema/tierra y azul-gris, sin negro ni blanco intenso.

La home carga `css/home-soft.css` desde `js/home.js` y usa un azul pizarra medio.

### Datos nuevos

- `club_project_files`: hasta 3 archivos por misión, 4 MB cada uno; JPEG, PNG,
  WebP, PDF o texto. El contenido se almacena en `bytea`.
- `club_challenge_teams`: equipos de 2 a 4 por misión.
- `club_challenge_members`: membresía y aporte individual.

Las tres tablas tienen RLS sin políticas de acceso directo y permisos de tabla
revocados. Solo se accede mediante RPC con validación institucional.

### RPC nuevas y modificadas

Flujo del estudiante (rol anónimo por código personal B.E.I.):

- `club_entregar_archivo`
- `club_archivos_mision`
- `club_descargar_archivo`
- `club_equipo_estado`, `club_equipo_crear`, `club_equipo_unirse`, `club_equipo_aportar`
- `club_entrar`, `club_leccion`, `club_responder`, `club_entregar_proyecto`, `club_terminar`

Revisión solo para sesión autenticada con rol administración/dirección:

- `club_entregas_revision`
- `club_descargar_archivo_admin`
- `club_calificar_entrega`

Las 112 actividades se distribuyen ahora en 28 de elección, 28 de ordenar, 28
de respuesta abierta y 28 de decisión con justificación. `club_leccion` elimina
`correct_order` antes de responder al navegador; la validación ocurre en el servidor.
Una misión nueva no se completa sin archivo o enlace de evidencia. Los progresos
ya aprobados antes de la migración se conservan.
