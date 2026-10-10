# Arquitectura de Krueka

> Documento de referencia obligatoria antes de modificar el proyecto.
> Si cambiás módulos, dependencias, tablas o funciones de servidor, **actualizá este archivo en el mismo commit**.
>
> Última verificación contra el código: 08/09/2026 (rama `main`).

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
- `js/club-pc-lab.js`: simulador de armado, diagnóstico y encendido de computadora para Juniors.
- `js/guia-club.js`: guía local en el paso de construcción Junior. Da pistas sobre HTML, CSS y JavaScript a partir de la pregunta y del fragmento que pega el alumno. Es un diálogo de reglas preparadas, no IA generativa. El historial queda en memoria y se borra al cerrar; no usa servicios externos, claves, tablas ni RPC nuevas.
- `js/club-estudio.js`: estudio 2D de juegos para Junior en la fase Construir. Editor de casillas, personaje, tema, obstáculos, tesoros y meta; permite probar con teclado o controles táctiles. Guarda primero en `localStorage` y sincroniza por RPC con `club_creator_projects` en Supabase. En otro equipo recupera la copia de Krueka tras ingresar con el código personal y pasar el control del dispositivo del Club. Descargar/abrir JSON sigue disponible. Si la copia local difiere de la remota, el alumno elige cuál abrir.
- `js/club-diseno-3d.js`: taller de bloques por capas (8×8×4), paleta, borrador de columnas, giro de vista isométrica y pistas locales para pensar en formas, simetría y volumen. Disponible en la fase Construir del Club; guarda borrador local y proyectos `design` en Supabase mediante las RPC existentes, y permite enviar para revisión. Es un constructor inicial de bloques, no un editor CAD ni una integración de Tinkercad.
- `js/club-crea-revision.js`: dirección y administración ven los juegos y diseños privados enviados, sus vistas y el estado; pueden aprobar o pedir mejoras con observación. El botón está en `Club.vPanel()`.
- Reutiliza las RPC de la migración de Supabase `040_krueka_crea_foundation`: `club_crea_listar`, `club_crea_cargar`, `club_crea_guardar`, `club_crea_solicitar_revision`, `club_crea_revision` y `club_crea_revisar`. El contenido creativo incorpora `lesson_id` y `game` o `model`; el servidor controla alumno activo y dispositivo vinculado, y la revisión exige dirección o administración de la institución. Las tablas creativas conservan RLS sin lectura ni escritura directa del alumnado. La aprobación registra el estado, sin exhibir el proyecto a otros alumnos.
- `club/club-pc-lab.css`: interfaz clara, adaptable y táctil del taller de hardware.

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

## 8. Laboratorio de armado de PC para Juniors

- Disponible únicamente cuando `Club.alumno.nivel === 'mayores'`.
- Presenta 18 piezas separadas y un interruptor de fuente: gabinete, fuente, placa madre, CPU, disipador, RAM, SSD, cables ATX/CPU/SATA/PWR SW, monitor, video, energía y periféricos.
- Admite arrastrar y soltar o seleccionar y tocar; funciona también en pantallas táctiles.
- Las dependencias impiden montajes físicamente imposibles, pero el alumno puede intentar encender en cualquier momento.
- El diagnóstico de servidor distingue: sin energía, sin imagen, sin sistema de arranque, sin controles y encendido correcto.
- Cada pieza puede desconectarse; también existe **Desarmar todo** para comenzar de nuevo.
- El progreso, los intentos y el último armado se guardan en `club_pc_lab_progress`, con RLS y sin lectura directa.
- `club_pc_lab_estado(uuid)` y `club_pc_lab_probar(uuid,jsonb)` validan estudiante activo, institución B.E.I. y nivel Junior.
- Migraciones relacionadas: `038_laboratorio_armado_pc_juniors` y `039_laboratorio_pc_monitor_y_corriente`.

## 9. Portal Familia y Comunicados

- `js/familia.js` (carga última en `app.html`): tercer tab de login "Soy familia" (curso + nombre, sin contraseña), ficha del alumno (asistencia, promedio, conducta, comunicados, descarga en Word vía `KG.word`) y sección "Comunicados" en el menú de docente/director/admin.
- Reutiliza vistas y tablas existentes (`v_alumno_resumen`, `attendance`, `class_sessions`, `courses`, `enrollments`); no cambia el flujo de etapas ni el acceso del alumno.
- Tabla nueva `comunicados` (`supabase_familia.sql`, migración 040): `institution_id`, `autor_id`, `titulo`, `cuerpo`, `course_id` (nulo = toda la escuela). RLS activado; lectura pública (el Portal Familia usa clave anon sin sesión), escritura solo `docente`/`director`/`admin` autenticados.
- Sin la tabla, el módulo trabaja en modo demo (comunicados en `localStorage` de esa PC) y no rompe nada.

## 10. Oficina Krueka (Word/Excel/PowerPoint internos)

- `js/editor.js` (`Oficina`): Documento (contenteditable + execCommand: negrita/cursiva/subrayado, H1–H3, listas, 4 alineaciones, colores de letra y resaltado, 7 fuentes, 5 tamaños, imagen por URL, limpiar formato, contador de palabras), Planilla (A–J × 48, formatos, anchos/altos, % , ordenar A→Z, gráfico de barras A:B) y Diapositivas (nueva/duplicar/reordenar/borrar, tema de fondo, alineación, imagen por URL, modo presentación con teclado ←/→/Esc). Autoguardado 4 s + botón Guardar; panel "Tu tarea, paso a paso" con la consigna de la clase.
- Motor de fórmulas ES (coma decimal, `;` como separador): aritmética, `^`, referencias, `SUMA/PROMEDIO/MAX/MIN/CONTAR`, `CONTAR.SI`, `SI/Y/O` (anidados, devuelven número o texto), `REDONDEAR/POTENCIA/RAIZ`, antirrecursión por ciclos, `¡Error!` controlado. Sin `eval` de entrada cruda: tras sustituir funciones y referencias solo admite `0-9+-*/(). `.
- Persistencia en `student_docs` (JSONB) vía RPCs `guardar_doc` / `mis_docs` (validados por sesión y alumno; el alumno los ve en su entrega con `Oficina.resumen()` y el docente en `Docente.verTrabajo` / `panelTrabajos` de `js/trabajos.js`). Claves nuevas (`pc`, `img`, `fondo`, `al`, celdas I–J / filas 25–48) compatibles hacia atrás: documentos viejos se abren igual.

## 11. Home pública (tema claro)

- `index.html` + `css/home*.css`: landing estática (hero, cinta, bento plataforma, flujo, confianza, contacto). Estructura y textos intactos; `js/home.js` oculta `#clubes` y "Clubes internos" por privacidad del Club B.E.I. y carga el tema.
- `css/home-claro.css` (carga desde `home.js`, reemplaza a `home-soft.css`): paleta clara coherente con la app (`#F9F8F7`, tarjetas blancas, azul `#2783DE` / verde `#46A171`). El video oscuro del hero queda oculto por CSS (se muestra gradiente claro + tarjetas flotantes); la consola de clase del bento se deja oscura a propósito como mockup del producto.

## 12. Club: gestión de alumnos y finanzas

- `js/club-gestion.js` (`ClubG`, pestañas "👥 Alumnos club" y "💰 Finanzas club" solo admin/dirección): renombrar, mudar de grupo (usa `club_alumno_guardar(p_group)` existente), desactivar/reactivar, mini-cuenta de 12 meses por alumno, detector de duplicados (normaliza tildes/espacios), fusión de duplicados y eliminación definitiva con doble confirmación.
- Finanzas vía `club_finanzas(anio, mes)`: KPIs (activos, cobrado vs cuota, % , deudores, al día), deudores del mes actual y del anterior (con contacto), cobro por grupo, altas (creados en el mes), bajas (de `audit_log`), historial 6 meses y descarga a Excel (CSV `;`, vía `KG.bajar`).
- Migración 041 (`supabase_club_gestion.sql`): `club_alumno_eliminar` (borrado real, todo en CASCADE + auditoría con foto de pagos), `club_alumno_fusionar` (mueve pagos al que queda y borra el duplicado), `club_finanzas`. Mismas convenciones: `SECURITY DEFINER`, `search_path` fijo, control `is_admin()/is_direccion()`, auditoría.
- Migración 042 (`supabase_club_carga.sql`): `club_alumno_crear` (carga directa sin formulario público: crea inscripción aceptada + alumno con código, tutor/teléfono obligatorios).

## 13. Krueka Studio de creación para Juniors

- `js/club-studio-ai.js` expone `window.StudioIA`, cargado una sola vez al final de `app.html`, después de `js/club-studio-kits.js` (`window.StudioKits`). Usa el objeto global léxico `Club`. La entrada del mapa Junior abre el taller directamente, sin depender de una misión activa.
- `club/club-studio.css` adapta el taller a escritorio y celular. El Chat es la entrada principal: conversación y juego aparecen en el mismo taller, con el cuadro de escritura fijo y tarjetas para probar la versión actual. Las pestañas Bases y reglas y Mi clase conservan personalización visual y una actividad guiada de 60 minutos con capacidad e indicadores. La IA no es un requisito para usar las bases o el editor.
- `StudioKits` genera cuatro videojuegos completos (estrellas, carreras, plataformas, preguntas) y una página de portafolio, con HTML/CSS/JS estándar y sin dependencias externas. Las reglas de juego se editan en `game-config.js`; el motor queda accesible en `game.js`. Los juegos incluyen teclado y botones táctiles, reinicio, puntuación y final; los juegos de movimiento incluyen vidas y tiempo.
- El editor permite crear/eliminar archivos, deshacer hasta cinco operaciones visuales o de IA en la sesión, importar JSON/HTML como un proyecto nuevo y descargar JSON o la página HTML autónoma. El HTML exportado representa una página; para proyectos con varias páginas se conserva el conjunto completo en JSON. Se limita a 45 archivos, 120.000 caracteres por archivo y 220.000 por proyecto.
- La vista previa y la revisión usan `iframe sandbox="allow-scripts"`, sin acceso al origen de Krueka. Una CSP insertada antes de los scripts bloquea conexiones, dependencias externas y formularios. Un puente recibe errores y navegación local solamente desde el iframe del proyecto. Se pueden ver errores de ejecución y probar el ancho de celular.
- Servidor: Edge Function `krueka-studio-ai`, código en `supabase/functions/krueka-studio-ai/index.ts`. Recibe `studentId` y `deviceId`, y valida ambos mediante `club_crea_listar` / `club_crea_estudiante_valido` antes de cualquier acción. Conserva `verify_jwt=false` porque los alumnos usan el código del Club, sin sesión Supabase Auth; la clave pública viaja en `apikey`.
- Compatibilidad: el proyecto anterior sigue en el bucket privado `krueka-studio`, ruta `students/{studentId}/studio.json`, con identificador `legacy`. No se migra ni se elimina al crear proyectos nuevos. El servidor es el único que accede al bucket.
- Los nuevos proyectos usan las RPC existentes `club_crea_guardar`, `club_crea_cargar`, `club_crea_listar` y `club_crea_solicitar_revision`, tipo `web`, contenido `{studio:{version:3,files,history,draft}}`, en `club_creator_projects` y su historial `club_creator_versions`. Estas RPC validan alumno, equipo, propietario y el límite de 30 proyectos activos. No se modifican sus políticas ni permisos. La contabilidad de IA usa tablas privadas separadas, descritas abajo. Un proyecto antiguo enviado a revisión se copia a este formato, conservando el original.
- `js/club-crea-revision.js` incluye los proyectos del Studio en la revisión privada de dirección/administración. Pueden probar sus páginas, leer sus archivos, ver la conversación del proyecto y usar las opciones existentes de aprobar/pedir mejoras. El alumno ve las observaciones al volver a abrir el proyecto.
- La última selección se recuerda en `localStorage` solo como ID, con clave por alumno; los archivos y el historial se recuperan de la nube. Guardados en orden y bloqueo durante operaciones evitan cambiar de proyecto a mitad de una escritura. Una carga fallida no habilita edición ni sobrescribe la nube; una salida tras un guardado fallido pide conservar una copia.
- Cada proyecto conserva hasta 40 mensajes (alumno, asistente o sistema), pedidos pendientes, referencias a archivos cambiados y borrador de 1.200 caracteres. El JSON exportado también conserva la conversación. Sin API, Guardar idea registra un pedido pendiente y explica que no cambió código. Una respuesta incompleta o fallida conserva el juego y recupera el pedido en el cuadro de escritura.
- IA: OpenAI Responses API, modelo fijo `gpt-6-luna`, salida estructurada estricta `{summary,test,files:[{path,content}],patches:[{path,find,replace}]}`, sin herramientas ni alternativas automáticas. El cliente no elige modelo. Requiere dos secretos de servidor: `OPENAI_API_KEY` y `STUDIO_AI_ENABLED=true`. Una clave presente sin activación explícita no habilita solicitudes. Conexión habilitada y verificada con una solicitud real el 08/10/2026. Ver `docs/studio-configuracion.md`.
- Migración `supabase/migrations/20261008012102_studio_chat_ai_limits.sql`: tablas `club_studio_ai_months` y `club_studio_ai_requests`, RLS habilitado, sin acceso público. RPC de estado, reserva y liquidación ejecutables solo por `service_role`; estado y reserva validan alumno/equipo. No guardan conversaciones ni código en la contabilidad.
- Límites iniciales de servidor: US$5 por mes calendario (America/Asuncion) para todo el taller, 12 intentos diarios por alumno, 10 segundos entre intentos, una solicitud simultánea por alumno y tres globales; máximo 2.000 tokens de salida y 65.000 caracteres de archivos enviados. La reserva bloquea la fila mensual antes de consultar al proveedor, para que solicitudes simultáneas compartan el mismo presupuesto. Liquida según tokens consumidos; ante costo desconocido conserva la reserva. No sustituye los controles de facturación de la cuenta ni cubre otros usos de la misma clave.
- Cambios de IA: el servidor aplica fragmentos exactos y únicos sobre los archivos del pedido, en orden y de forma atómica; rechaza rutas inexistentes, coincidencias ambiguas, fragmentos inválidos y conflictos con archivos completos. El cliente recibe los archivos resultantes usando el contrato existente; no recibe ni ejecuta parches. Los pedidos amplios eligen una mejora pequeña; no regeneran el motor entero. Rechaza reemplazos completos de archivos existentes mayores a 6.000 caracteres y devuelve 422 para parches incompatibles. Los errores devuelven el estado de consumo actualizado sin otra consulta al proveedor.
- La lectura de Responses toma el mensaje final del asistente y une sus fragmentos de texto; ignora comentarios preliminares, razonamiento y herramientas. Las negativas y las salidas inválidas muestran mensajes legibles y conservan el proyecto.
- Probar (barra o tarjeta del chat) carga la vista previa y envía `krueka-preview-play` al terminar la carga: inicia Jugar en el motor 3D y enfoca el canvas. El puente acepta esta orden solo del padre; una carga normal sigue en edición. No cambia los archivos guardados del alumno.
- La aplicación limita solicitudes del chat a 88 segundos y guardados/cargas a 18 segundos. Rechaza respuestas HTTP 200 sin `ok:true` y recupera el pedido ante cortes; no aplica cambios parciales.
- La acción `status` y las cargas informan disponibilidad y pedidos diarios sin revelar claves. Si falta conexión o se agota el cupo, siguen disponibles ideas pendientes, bases y editor. El estado no prueba que la clave sea válida: la generación real debe probarse después de conectar la API.


## 14. Studio: mundos 3D editables

- `js/club-studio-3d.js` se carga entre StudioKits y StudioIA en `app.html`. Expone `Studio3D` y agrega la base Exploradores 3D al catálogo sin modificar las bases anteriores. Genera cinco archivos autónomos (HTML, CSS, configuración, motor y LEEME) que usan el mismo guardado, exportación y revisión privada del Studio.
- Motor propio de geometría 3D y cámara con perspectiva: WebGL 1 sin librerías, texturas ni CDN; si no hay contexto o se pierde, usa la misma geometría y proyección en Canvas 2D. Resolución limitada, modo liviano y dibujo a 30 FPS. La disponibilidad real de WebGL depende del navegador y la GPU; la alternativa conserva el juego y sus reglas. No se promete rendimiento idéntico en todas las PC.
- Juego de exploración: personaje de bloques, movimiento WASD/flechas, salto, colisiones, cristales, drones, vidas, tiempo y portal de llegada. Comienza en vista de edición, sin gastar tiempo; Jugar inicia la partida, Editar escena detiene el tiempo, Reiniciar conserva la configuración. Cámara arrastrable y controles táctiles.
- Inspector en Bases y reglas: estación, bosque o isla; tres iluminaciones; color del personaje, velocidad, tiempo, vidas, cámara y calidad. Hasta 32 objetos (cristal, bloque, columna, árbol, dron, baliza), con nombre, X/Z, tamaño, altura, color, duplicado y eliminación. `game-config.js` conserva los datos; los cambios son locales y guardables, sin consultas de IA.
- La selección desde el iframe usa `krueka-scene-select` y se acepta solo desde el iframe actual, para una ID existente en el proyecto 3D y fuera de operaciones pendientes. La selección desde la lista usa `krueka-scene-highlight`; el motor acepta mensajes solo del padre. Ningún mensaje permite ejecutar código en Krueka ni cambiar archivos arbitrarios.
- Se conserva sandbox, CSP, límites de archivos, código del alumno y validación de equipo. No hay tablas, RPC, políticas ni cambios del servidor nuevos. El chat distingue las ideas pendientes de una respuesta generativa; la API de OpenAI está habilitada con límites de consumo. La primera versión es un editor educativo de escenas y juegos propios, no una integración de Unity ni un editor completo de recursos de terceros.


## 15. NEON RIFT: videojuego completo de demostración

- `js/club-studio-showcase.js` se carga entre Studio3D y StudioIA en `app.html`; extiende `StudioKits.catalog`, `create` y `art` con `neon-rift`. Crea una copia independiente por alumno sin consumir API ni sobrescribir sus proyectos existentes.
- Base con HTML/CSS/JS estándar, configuración editable `game-config.js` y motor Canvas 2D `game.js`: tres oleadas, jefe final, disparos, enemigos, DASH, escudos, objetos de recuperación, mejoras de nave, sonidos opcionales WebAudio y controles teclado/ratón/táctiles. Sin conexión externa ni imágenes/paquetes descargados.
- `StudioShowcase.renderEditor` ofrece controles claros de velocidad, vidas, daño y oleadas, y `renderLesson` contiene una guía autónoma de 60 minutos con capacidad e indicadores. La IA del chat existente puede proponer cambios, respetando sus límites de consumo; los archivos se guardan con las RPC privadas ya existentes.
- `/ejemplos/neon-rift.html` deja jugar el ejemplo de forma pública en iframe aislado `sandbox=allow-scripts`, con CSP restrictiva y sin cuenta o acceso a datos de alumnos. No guarda estados ni recibe mensajes del proyecto escolar.
- No se modificaron tablas, RLS, funciones de servidor ni credenciales. Los archivos del juego se ajustan a los límites existentes del Studio.


## 16. HORIZON FORGE: videojuegos 3D desarrollados por etapas

- Nuevo `js/club-studio-forge.js`: registra la plantilla `cinematic3d` después de `Studio3D` y antes de `StudioIA`; no modifica ni sustituye las bases anteriores.
- Reutiliza los cinco archivos, la cámara, la geometría, la iluminación, los controles, las colisiones y la alternativa Canvas del motor 3D existente. Se añaden edificios y calles 3D, tres personajes adultos procedurales por segmentos, pasos y carrera, patrullas, gestos e interacción con subtítulos.
- En Bases y reglas, el editor divide la creación en cinco etapas: personajes (tres fichas configurables), ambiente (distrito, iluminación, clima y calidad), movimientos, acciones/voces, integración. `game-config.js` conserva y versiona la definición conjunta, mientras `game.js` incorpora el motor de forma autónoma; no hay recursos ni solicitudes externas en el juego.
- La voz se desactiva por defecto. El botón dentro del videojuego puede habilitar `speechSynthesis` local del navegador; cuando no existe esa API, el subtítulo sigue funcionando. No hay grabaciones, uso de micrófono ni voz generativa de pago.
- Los proyectos usan las mismas RPC del Studio, con las protecciones existentes de alumno y dispositivo. Crear la plantilla o cambiar parámetros no consulta OpenAI; usar el chat con IA conserva las cuotas y las protecciones existentes. No hay migraciones, tablas, RLS, edge functions ni secretos nuevos.
- El aspecto es un prototipo 3D procedural estilizado de escala humana, no fotorrealismo. Recursos GLB, esqueletos de animación avanzada, texturas PBR y voces narradas de calidad requieren fases posteriores y pruebas de rendimiento en hardware del Club.


## 17. Studio: misiones espaciales 3D

- `js/club-studio-missions.js` expone `StudioMissions`, se carga después de Studio3D y antes de StudioIA en `app.html`; agrega Misión espacial 3D al catálogo sin cambiar las bases anteriores. Crea cinco archivos autónomos, con motor y recursos geométricos propios.
- Estación de tres sectores con pasillo, paredes, techo, paneles, luces y cajas; cámara en primera persona o detrás del robot. WebGL 1 con luz direccional, cuatro puntos de luz y niebla; resolución y FPS limitados. Si WebGL no está disponible o se pierde el contexto, cambia a dibujo Canvas 2D con las mismas reglas. La velocidad real depende del equipo.
- Mecánicas: movimiento relativo a la cámara, giro al arrastrar/J/L/botones, salto, colisiones, pulsos de energía con línea de visión, drones con patrulla y escudo, celdas recolectables, paneles que se activan al acercarse y una salida que exige completar los objetivos. Incluye victoria, derrota, pausa, reinicio, controles de pantalla y sonidos sintetizados locales opcionales. No usa recursos ni servicios de Unity.
- En Bases y reglas se editan cuatro ambientes de iluminación, dos estilos de estación, cámara, calidad, color del pulso, velocidad, tiempo, escudo y dificultad de drones; hasta 24 objetos con tipo, posición, tamaño, altura y color. Permite seleccionar desde el iframe, agregar, duplicar, quitar y deshacer. Las posiciones se acotan al pasillo; el alumno debe probar que su recorrido se pueda terminar.
- Se crea desde Crear o desde el botón Misión espacial 3D del Chat como proyecto nuevo. El Chat y el editor ofrecen pedidos breves para modificar `game-config.js` mediante la API existente. Mi clase y LEEME incorporan una guía con tema, capacidad, indicadores y pruebas de la misión.
- Conserva guardado privado, importación/exportación, revisión del docente, sandbox, CSP y validación de origen de mensajes existentes. No agrega tablas, RPC, políticas, secretos, dependencias ni infraestructura de servidor. El modelo y los límites de IA permanecen en la función existente.


## 18. Hero Lab / Gestor de Héroes RPG — moldes y biblioteca por proyecto

- `js/club-studio-heroes.js`, cargado en `app.html` después de StudioKits y antes de StudioIA, expone `StudioHeroes` y agrega la base `hero-manager` sin alterar las demás. Cada alumno crea una copia independiente; no se introducen recursos remotos ni bibliotecas nuevas.
- Seis moldes originales (caballero, arquera, hechicero, guardián, asesino, tecnoguerrero) con armaduras, cuatro tipos de cabeza, capas, armas, paleta, roles, elementos, rarezas, cuatro atributos y cuatro habilidades. El arte de personaje es SVG vectorial modular; no es arte fotorrealista ni un modelo 3D.
- Galería autónoma en `index.html`, `style.css`, `game-config.js` y `hero.js`, con paneles de colección, retrato grande, estadísticas, habilidades e historia. Las vistas se ejecutan en el iframe aislado del Studio; nombres e historias se escapan y opciones/colores se validan. No requiere CDN, acceso a red ni API para combinar piezas.
- Bases y reglas integra editor de colección y equipamiento: hasta ocho héroes, duplicar, eliminar con confirmación, molde nuevo, preview inmediata, edición de estadísticas/habilidades, checkpoint y Deshacer. Cambiar la colección modifica únicamente `game-config.js`, integrado a guardado privado, exportación y revisión docente ya existentes.
- `Mi clase` incluye instrucciones de 60 minutos con capacidad e indicadores. El chat de OpenAI existente puede editar `game-config.js` con cambios limitados, sin cambiar costos, modelo ni presupuestos. Futuras fases: escenarios, habilidades y efectos, combate, historia/inventario.
- No se crean tablas, políticas RLS, RPC, edge functions, claves ni cambios de autenticación. Se mantiene la privacidad de las colecciones por proyecto conforme al Studio.


## 20. Render Pro: modelos CC0 + retratos HD privados

- `js/club-studio-render-pro.js` se carga después de `js/club-studio-game-builder.js` y ofrece una sección optativa Render Pro cuando se edita un héroe. Sin WebGL, internet o acceso al CDN se conserva el dibujo SVG original; la carga 3D requiere clic explícito y no bloquea el resto del proyecto.
- Motor optativo `@google/model-viewer` v4.1.0 Apache-2.0 (CDN público cdnjs): preview GLB, PBR, luz/exposición, giro, zoom, captura PNG si el navegador permite. Sólo usa URLs fijas de seis personajes Quaternius CC0 (warrior, ranger, wizard, rogue, cleric, monk) desde un commit concreto del catálogo abierto `Papyszoo/CC0-Public-Domain-Models`. No se envían nombres, datos escolares ni retratos al proveedor de modelos. Hay conexión saliente al descargar el motor/modelo. La licencia original y los detalles constan en `docs/render-pro-fuentes.md`.
- La representación 3D muestra un molde genérico estilizado por clase; no es un humanoide fotorealista ni todas las piezas del SVG afectan los materiales/geometría GLB. La elección `renderModel` (lista cerrada) persiste por personaje.
- La imagen personal PNG/JPG/WebP se convierte localmente en un WebP de datos de tamaño restringido (`data:image/webp;base64` max 40k caracteres), mediante un canvas que recorta/escala y reduce calidad; se valida el tamaño antes de modificar el proyecto con las reglas `StudioIA.validFiles`. Puede quitarse o revertirse. La imagen importada se incorpora en `game-config.js` y la galería exportada, y viaja exclusivamente con el proyecto al almacenamiento privado Studio existente. No se permite HTML, SVG, URLs externas, scripts ni webcam como retratos.
- `StudioHeroes.clean` conserva `world` y `combat` para que personalizar el héroe no borre mapa/misión. El editor Hero Lab mantiene el paso «Editar héroes» hasta volver al mapa; los proyectos previos sin `portrait` y `renderModel` conservan una vista anterior válida.
- No se modifican tablas, RLS, funciones de servidor, secretos, claves, cuotas de IA ni flujos de acceso de alumnos. Descargar modelos y cargar la librería es gratuito como software/contenido, pero requiere conexión a internet y depende de la disponibilidad de fuentes externas. Para personajes foto-realistas hay que aportar arte original externo; no se habilita generación de imágenes por API para menores.


## 21. Taller por código, disponible desde otro equipo

- `studio.html` es la entrada directa del Club por el código personal existente de seis caracteres, para Peques y Juniors. `app.html` enlaza esta entrada. `js/club-studio-access.js` arranca en ES5, comprueba funciones del navegador y Canvas 2D antes de cargar los módulos del Studio; usa XHR para las RPC, sin SDK, captcha ni cuenta adicional. No depende de que Windows o el procesador sean de 64 bits. Se requiere un navegador con las funciones comprobadas e internet para acceso y guardado; no se certifican sistemas operativos antiguos ni hardware no probado.
- La página abre el chat y la vista previa juntos. Para alumnos sin proyectos crea y guarda una base liviana Misión estelar, sin GPU. En un navegador sin selección recordada, `StudioIA.open` lista los proyectos privados y recupera el más reciente; conserva la carga de proyectos legacy. Un fallo de carga vuelve a la entrada sin habilitar edición sobre una nube no recuperada. Un fallo de guardado informa cambios pendientes.
- Migración `supabase/migrations/20261009235640_studio_browser_sessions.sql`: nuevas tablas privadas `club_studio_sessions` y `club_studio_login_attempts`, RLS habilitado y permisos de tabla/secuencia revocados a public/anon/authenticated. No tienen políticas públicas: se usan exclusivamente dentro de RPC SECURITY DEFINER con search_path vacío. La advertencia del asesor sobre ejecución anónima es intencional para el acceso por código; las RPC validan el código y el secreto de sesión.
- `club_studio_entrar` valida código/alumno activo de la institución del Club, limita intentos (12 por navegador y 180 globales en diez minutos, serializados), y devuelve datos mínimos y un secreto aleatorio de 256 bits. Guarda sólo hashes SHA-256 de token, código y navegador. El token vence en doce horas; un nuevo ingreso invalida las sesiones Studio previas del alumno. La huella del código invalida sesiones si se regenera el código. Los códigos no se guardan en esta página y el token queda sólo en sessionStorage, con alternativa en memoria si el navegador bloquea almacenamiento.
- `club_studio_salir` revoca el token al salir. `club_crea_estudiante_valido` conserva la validación histórica por dispositivo y admite además una sesión Studio válida, vinculada al alumno y al código vigente. No cambia `club_entrar`, no libera el dispositivo registrado y no altera permisos ni comprobaciones de propietario de las RPC de proyectos. La función de IA valida el mismo secreto mediante esas RPC; no necesita nuevos secretos.
- Migración `20261010001409_studio_project_index.sql`: RPC `club_studio_proyectos`, con la misma validación de alumno y secreto, devuelve sólo IDs de proyectos web propios que contienen `studio.files`. El módulo de clase filtra la lista existente con esos IDs, conserva legacy y evita abrir automáticamente otros trabajos web en el editor incorrecto.
- `js/club-studio-classroom.js` se carga después de Focus Chat en ambas páginas. Agrega Clase de hoy (60 minutos, capacidad, indicadores, prueba, explicación en LEEME y entrega privada) y un selector de IA del taller / Ayuda local. La ayuda local está rotulada sin IA generativa, reconoce reglas acotadas de las bases 2D y escenas 3D, modifica sólo `game-config.js`, conserva el motor y admite Deshacer. No evalúa texto, no genera código nuevo, no consulta al proveedor y no sustituye solicitudes no reconocidas por cambios automáticos. Continúa disponible cuando se agota el cupo de IA. No integra ni comparte cuentas ChatGPT.
- `club/club-studio-access.css` contiene estilos de entrada y controles de clase, con selectores que conservan los estilos del resto de la app. Las comprobaciones de compatibilidad no requieren WebGL. Render Pro y demás herramientas existentes conservan su carga optativa.
- El chat reintenta sólo respuestas de reserva `busy`/`cooldown`, con espera aleatoria y hasta siete reintentos; no duplica solicitudes al proveedor ante timeout, salida inválida o error de red. Los presupuestos y límites del servidor se conservan. Las pruebas incluyen comandos locales, diez clientes frente a un límite simulado de tres turnos y recorridos de navegador de acceso, guardado y recuperación, sin credenciales escolares en el repositorio.
- La función distingue los códigos 429 de saldo, límites de gasto/uso y velocidad del proveedor. Migración `20261010002500_studio_provider_pause.sql`: tabla `club_studio_ai_provider` de una sola fila, RLS, sin permisos de alumnos; sólo service_role puede leer/insertar/actualizar. Conserva únicamente categoría y vencimiento de pausa, sin mensajes, datos del proyecto ni claves. Una respuesta 429 pausa nuevos pedidos para todo el taller (20–120 segundos por velocidad, 60 por límite desconocido, cinco minutos por saldo/gasto/uso); no los reintenta al proveedor ni los cobra como generación. Las cargas informan la pausa y seleccionan Ayuda local. Revisar IA consulta estado sin generación; al vencer la pausa puede probarse la conexión nuevamente. La generación sigue requiriendo saldo y permisos de la cuenta OpenAI.
- El máximo de salida se reduce a 2.000 tokens, con instrucciones de entregar mejoras pequeñas mediante parches. Se mantienen el modelo fijo, presupuesto, liquidación, validaciones y rechazo atómico de respuestas incompletas. Se verifica con pruebas de proveedor simulado y con una petición real cuyo diagnóstico se muestra explícitamente; la configuración por sí sola no garantiza saldo del proveedor.
