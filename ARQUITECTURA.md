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
- La función distingue los códigos 429 de saldo, límites de gasto/uso y velocidad del proveedor. Migración `20261010002500_studio_provider_pause.sql`: tabla `club_studio_ai_provider` de una sola fila, RLS, sin permisos de alumnos; sólo service_role puede leer/insertar/actualizar. Conserva únicamente categoría y vencimiento de pausa, sin mensajes, datos del proyecto ni claves. Una respuesta 429 pausa nuevos pedidos para todo el taller (mínimo 20 segundos por velocidad, respetando Retry-After y el reinicio de contadores agotados aunque indiquen más tiempo; 60 por límite desconocido, cinco minutos por saldo/gasto/uso); no los reintenta al proveedor ni los cobra como generación. Las cargas informan la pausa y seleccionan Ayuda local. Revisar IA consulta estado sin generación; al vencer la pausa puede probarse la conexión nuevamente. La generación sigue requiriendo saldo y permisos de la cuenta OpenAI.
- El máximo de salida se reduce a 2.000 tokens, con instrucciones de entregar mejoras pequeñas mediante parches. Se mantienen el modelo fijo, presupuesto, liquidación, validaciones y rechazo atómico de respuestas incompletas. Se verifica con pruebas de proveedor simulado y con una petición real cuyo diagnóstico se muestra explícitamente; la configuración por sí sola no garantiza saldo del proveedor.
- Los pedidos sencillos de reglas, o dirigidos a `game-config.js`, y la planificación de bases con configuración pequeña envían sólo ese archivo y un historial reducido, con máximo de 512 tokens de salida. El servidor rechaza modificaciones fuera de esa configuración y conserva la comprobación de datos personales sobre todo el proyecto e historial reciente, aunque no se envíen. La planificación informa que no dispone del motor, diferencia reglas y mecánicas nuevas y no altera archivos. La construcción de nuevas mecánicas mantiene el contexto general. Para diagnosticar límites, los logs registran únicamente contadores numéricos del proveedor y tamaño del pedido, sin su mensaje ni identificadores de cuentas, alumnos, proyectos o claves.


## 17. Titanteo Decisions (piloto de clasificación explicable)

- Módulo js/decisions.js, cargado al final de app.html, después de las extensiones de navegación existentes. Añade el menú **Decisiones (piloto)** para docente, director y admin, solo tras iniciar sesión. No cambia el acceso de menores ni las funciones del Club.
- DecisionEngine.run(message, context) clasifica textos en categorías estructuradas por palabras y frases con un puntaje heurístico. **No es un modelo neuronal ni un porcentaje calibrado de exactitud**. Si no hay coincidencias o hay empate, se deriva a **Revisión manual**. No automatiza acciones ni escribe en tablas escolares existentes.
- Entrada manual y CSV con columnas mensaje, contexto opcional (comercio o educacion), lote máximo de 25 y límite de tamaño. Antes de importar requiere confirmación explícita. Se pide no usar datos personales durante el piloto.
- Tabla titanteo_decisions (mensajes, categorías, urgencia, evidencias y versión de reglas) y tabla titanteo_decision_reviews (correcciones/confirmaciones añadidas sin sobrescribir el registro original). Migración supabase/migrations/20261011165025_titanteo_decisions_pilot_20261011.sql.
- Ambas tablas tienen **RLS habilitado**. Solo authenticated puede leer/insertar: docentes ven sus registros propios; director y admin ven los de su institución. Las escrituras exigen perfil activo e institución coincidente. anon no tiene permisos. No existen políticas de actualización o borrado para el cliente.
- El cliente Supabase usa únicamente la clave publishable existente; no hay secretos nuevos, proveedor externo de IA, función Edge, servicio de pago ni consumo de tokens. Los textos guardados siguen almacenados en Supabase y son accesibles conforme a las políticas anteriores.
- Verificación automatizada básica: tests/decisions.test.cjs comprueba clasificación, ambigüedad y lectura CSV. Antes de usar datos reales, se requiere validación de precisión con un conjunto etiquetado, consentimiento institucional y revisión del tratamiento de datos.


## 22. Buzones de Excel por grado con códigos separados (octubre 2026)

- `entregas-excel.html`: página pública bajo dominio Krueka. El alumnado ingresa el código exclusivo de su grupo (12 caracteres), nombre, tema y archivo Excel `.xlsx` de hasta 10 MB. No hay sesión estudiantil, listado de carpetas, historial, descarga, visualización ni lectura de trabajos, propios o ajenos. Devuelve recibo de entrega.
- La vista `entregas-excel.html?docente=1` permite a un revisor ver/crear grados, obtener el código **una sola vez** al crearlo o rotarlo, cerrar y reabrir recepción, listar entregas de una carpeta, filtrar por nombre, descargar mediante URL firmada efímera de 90 segundos y registrar revisiones. Autenticación Supabase Auth con JWT y dirección de correo confirmada. Se admiten solamente revisores de una lista fija del servidor; la dirección del responsable accede al buzón **sin recibir privilegios globales**. OTP por email y contraseña usan Turnstile, conforme a las reglas actuales de Auth.
- Nueva Edge Function `supabase/functions/krueka-excel-grados/index.ts` (sin verificación JWT en pasarela para admitir cargas sin login, pero con verificación de JWT **dentro** de toda acción docente). Códigos generados usando `crypto.getRandomValues`, y el servidor almacena solamente `SHA-256` del código; nunca se exponen en listas ni documentos. El código da permiso estrictamente de **subida**, no se utiliza para leer archivos.
- Bucket `krueka-excel-por-grado` completamente privado con restricción de MIME y 10 MB. Cada Excel queda en ruta `<uuid-grupo>/<fecha>/<uuid-archivo>.xlsx`; contenido OOXML ZIP validado (firma PK, `[Content_Types].xml`, `xl/workbook.xml` y rechazo VBA), más extensión `.xlsx`, antes de usar service_role para escribir. Descarga solo con token verificado y URL firmada; no hay política pública del bucket.
- Migración `20261013185500_excel_grade_private_dropboxes.sql`: tablas `excel_grade_groups`, `excel_grade_submissions` y `excel_grade_upload_log`, RLS habilitado, permisos revocados a `anon` y `authenticated`. Service role es la única entidad que manipula datos. Función `excel_grade_reserve` limita envíos por IP (90/h), carpeta (140/h) y plataforma (800/24h), con locks transaccionales. Códigos pueden rotarse o deshabilitarse.
- La separación alumno/docente es **verificada por servidor**, no por ocultar botones. Un alumno con código no puede listar objetos de almacenamiento ni solicitar el listado de entregas de un grupo. No altera el buzón Word previo, las cuentas del Club, ni las reglas de otras materias. No guarda credenciales en cliente, salvo la clave publishable permitida; no contrata servicios nuevos.

## 23. Krueka Creativo: juegos, animación y edición de video

- `studio.html` conserva el acceso por código personal y abre un inicio de talleres: Videojuegos 3D, Animación, Edición de video y Juegos 2D y más. `js/club-studio-creative.js` se carga después de las extensiones del Studio; agrega Talleres, Mi creación y una bitácora breve en `mi-proceso.txt`. Crear un taller inicia una copia nueva y abre su editor visual. Los motores 3D, Héroes RPG, Render Pro, chat de juegos y proyectos anteriores se conservan.
- `js/club-studio-media.js` registra las bases `animation` y `video-edit` en StudioKits. Se carga después de StudioKits; en `app.html` puede cargarse después de StudioIA porque el catálogo se consulta al abrir el taller. Cada base conserva HTML, CSS, `game-config.js`, `media.js` y LEEME, con los límites existentes de 45 archivos, 120.000 caracteres por archivo y 220.000 por proyecto. Los motores son autónomos, Canvas 2D, sin CDN, cuentas adicionales, IA, micrófono ni cámara.
- Animación: hasta ocho personajes, doce poses por personaje, 2–30 segundos, posición, escala, giro, interpolación suave, lineal o por saltos, fondo, frase y formatos horizontal/vertical/cuadrado. El estado se normaliza como datos; nunca se evalúa código del alumno en Krueka.
- Video: hasta doce escenas y 90 segundos; títulos, subtítulos, fotos reducidas, clips locales con recorte inicial/duración, orden, duplicado, volumen, corte directo y fundido a negro. Las fotos JPG/PNG/WebP se reducen localmente a JPEG y se limitan a 18.000 caracteres por imagen antes de entrar al proyecto. Los videos MP4/WebM/Ogg admitidos (máximo 25 MB por original) quedan en memoria: **no se suben ni se guardan en la nube**. Al volver a abrir o cambiar de equipo, hay que seleccionar los originales con el mismo nombre y tamaño. El montaje, sus referencias, las fotos y los títulos sí se guardan en Krueka. La interfaz explica esta diferencia antes de importar.
- `js/club-studio-media-editor.js` proporciona los editores visuales y la exportación. Reutiliza el guardado privado y la revisión docente del Studio sin modificar tablas, RLS, RPC, claves ni Edge Functions. Se carga después de StudioIA y del módulo de clase, antes del inicio creativo. `club/club-studio-creative.css` añade estilos acotados al Studio en ambas páginas.
- La vista sigue en `iframe sandbox=allow-scripts` con la CSP existente (sin red, img/media data: y blob:). El padre envía únicamente los Blob de videos que seleccionó el usuario al iframe actual; el motor genera sus propias URLs Blob y las libera al cerrarse. Se vacían los originales al salir o cambiar de proyecto/alumno. No se guardan secretos ni archivos de video en localStorage.
- Exportación mediante Canvas captureStream y MediaRecorder cuando el navegador los admite, en tiempo real y con límite de 30 MB. Se negocia WebM/MP4 según disponibilidad, sin prometer MP4 universal. El sonido original se mezcla mediante WebAudio solo tras activación explícita dentro de la vista previa; sin esa activación se exporta sin audio. Las descargas requieren una solicitud pendiente del padre, con identificador de operación, iframe y proyecto coincidentes; no se concede permiso general de descarga al iframe. Cancelación, timeout, originales ausentes o códec no soportado muestran un estado legible y conservan el proyecto.
- En animación y video, el chat es una **guía de herramientas sin IA generativa** y no envía fotos ni videos al proveedor de IA. Los videojuegos conservan su chat de IA existente y sus límites. Las guías Mi clase de los nuevos talleres incluyen tema, capacidad, indicadores y una actividad de 60 minutos. La bitácora se guarda y llega al docente con los archivos del proyecto.
- Las páginas que cargan realmente el Studio son `app.html` y `studio.html`; los módulos y estilos nuevos llevan `?v=20261016a`. `index.html` continúa como portada pública sin cargar las herramientas privadas.


## 24. Solicitud de integración con plan ChatGPT para Krueka (octubre 2026)

- Página `chatgpt-integracion.html` (noindex) y documento `docs/chatgpt-plan-integracion.md` informan el **estado real**: Sign in with ChatGPT (SIWC) **no está conectado** a Krueka. La página informa la solicitud presentada y diferencia editores, Ayuda local y chat de API. El formulario y el texto de presentación se conservan en la documentación del equipo. No envía formularios ni agrega OAuth, tokens, claves ni backend.
- OpenCode utiliza un flujo SIWC permitido para aplicaciones compatibles. Krueka es un portal remoto y requiere habilitación apropiada antes de integrar el uso de planes. Los términos SIWC prohíben usar la suscripción de una persona para consultas realizadas por otra, agrupar cuota entre usuarios y compartir tokens.
- Los proyectos estudiantiles, código de acceso, RPC Supabase de Studio, API, límites, fallbacks locales y seguridad permanecen **sin cambios**. Los menores de 13 años no reciben acceso ChatGPT personal. Las futuras conexiones deberán ser individuales y consentidas, y solo con autorización del proveedor.
- Consultar las políticas y requisitos técnicos exactos en `docs/chatgpt-plan-integracion.md`. El equipo debe solicitar acceso y contar con credenciales válidas antes de introducir cualquier botón funcional de login con ChatGPT.


## 25. Presentación institucional y orientación pública (octubre de 2026)

- `index.html` conserva marca y tema claro, con propuesta pedagógica, herramientas existentes y acceso por tareas en `accesos.html`. El nuevo centro aclara la diferencia entre código de clase, código personal del Club y código de entrega del grado; todos enlazan los flujos previos sin modificar autenticación ni habilitar nuevos alumnos.
- Se retiran de la portada las métricas y estados ilustrativos presentados como datos en vivo, el marketing de clubes eliminado antes desde JavaScript y los 23 scripts decorativos de movimiento. Los archivos gráficos anteriores permanecen en el repositorio. Los ejemplos de secuencia se identifican como tales y no muestran códigos o nombres ficticios que parezcan accesos reales.
- `css/home-claro.css` se carga directamente en HTML; `css/institutional.css` ajusta jerarquía, contraste, navegación y páginas informativas sobre la identidad existente. `js/home.js?v=20261017a` solo controla menú, Escape, estado de barra y año: contenido y tema están visibles sin JavaScript. No se añaden frameworks, CDN, fuentes remotas ni infraestructura.
- `informacion.html` explica propósito educativo, datos usados, proveedores, IA, compatibilidad y ayuda. Es un resumen de funcionamiento, no una certificación legal: el responsable debe validar identidad jurídica, contratos, consentimiento y plazos de conservación antes de presentarlo como política institucional completa. No se inventan acreditaciones, cifras de adopción, resultados ni tiempos garantizados de soporte.
- Las entradas existentes y los tres buzones incorporan enlaces de orientación y privacidad; se corrigen textos de PowerPoint y referencias al panel técnico dentro del acceso del responsable. Se conservan IDs, manejadores, códigos, destinos de correo, controles de seguridad, límites y API de los buzones. El mapa del sitio usa el dominio `www` de CNAME y enlaza páginas públicas; la pantalla de acceso escolar recibe `noindex`.
- Sin tablas, migraciones, políticas RLS, RPC, claves, funciones de servidor ni gastos nuevos. El código de `Familia` entra por selección de curso y alumno, sin sesión individual propia. Se requiere validar los permisos reales en servidor antes de promocionarlo como portal privado; el centro público deriva las consultas familiares a la institución. Las vistas autenticadas y el tratamiento jurídico completo requieren una revisión específica posterior; esta revisión pública no los certifica.


## 26. Identidad pública de plataforma educativa IA-first — octubre de 2026

- La portada pública index.html, la orientación accesos.html, informacion.html y chatgpt-integracion.html comparten ahora el sistema visual css/krueka-edu.css: tema tecnológico oscuro, tipografía local sin CDN, componentes de navegación y footer, módulos por rol y secciones de IA transparente. El diseño no requiere JavaScript para mostrar contenido; js/home.js conserva únicamente el menú móvil y el año.
- El hero del inicio representa un **ejemplo ilustrativo**, no una sesión ni métricas reales. Las funciones del Club, taller y buzones enlazan a sus páginas auténticas. La portada diferencia explícitamente Ayuda local sin generación, API generativa limitada y conexión SIWC pendiente; no anuncia acceso a planes personales de otros usuarios.
- app.html carga adicionalmente css/krueka-acceso-escolar.css: todos los selectores están acotados a #screen-login y #screen-nueva. No se altera el CSS de la aplicación tras iniciar sesión, las funciones de Core, las rutas de aula/Club, el captcha, los roles ni las credenciales.
- La reestructuración estética no modifica tablas, políticas RLS, almacenamiento, RPC, Edge Functions, presupuestos de IA, modelos, proyectos, guardado ni funciones privadas. Documentación y pendientes de auditoría en docs/auditoria-krueka-educacion-ia-20261017.md.
- La siguiente fase corresponde a revisión específica de UX y privacidad de los paneles internos, entrega por grados y Portal Familia, con pruebas reales de los roles y consentimiento institucional. Esta fase no declara como auditados o renovados los flujos autenticados.

## 27. Identidad Light Future de Krueka — octubre de 2026

- Se descarta la identidad oscura anterior a petición del usuario. La nueva estética visual se inspira en tendencias futuristas claras de Canva, SuperHi y plantillas educativas Framer: blanco hielo, azul eléctrico, celeste y coral. La implementación es original, sin reutilizar CSS, imágenes protegidas ni plantillas comerciales.
- La portada index.html utiliza una ilustración SVG propia del mundo creativo alojada en assets/krueka-world-2026.svg, gráficos CSS ilustrativos, bloques de producto por servicio real y mensajes pedagógicos con IA transparentes. La ilustración no contiene proyectos reales ni datos de menores.
- css/krueka-edu.css?v=20261017b es el sistema de diseño único para index.html, accesos.html, informacion.html y chatgpt-integracion.html. Incluye navegación flotante, tamaños responsive, foco visible y reduced-motion. No agrega frameworks, CDNs, fuentes ni imágenes remotas.
- app.html carga css/krueka-acceso-escolar.css?v=20261017b: solo afecta la presentación de los formularios #screen-login y #screen-nueva. No se cambia lógica de autenticación, códigos, políticas, roles, datos ni vistas internas.
- Los enlaces conservan sus destinos funcionales originales, incluyendo app.html, studio.html, personajes.html y buzones Word/Excel/PowerPoint.
- SIWC sigue pendiente de aprobación. La ayuda local no se presenta como IA generativa, y las solicitudes remotas de IA siguen limitadas por la API que el sistema ya tiene.
- Las pruebas incluyen rutas, activos, estados de IA y Chromium en móvil/escritorio. No se considera QA real de sesiones privadas, PC de 32 bits ni datos escolares.

## 28. Hero centrado con escena 3D real IA/educación — octubre de 2026

- Reorganizado el primer bloque de index.html: titular, descripción, botones y sellos centrados verticalmente sobre una escena 3D grande. Eliminada del DOM la ilustración SVG isométrica anterior y sus tarjetas flotantes; el SVG histórico se mantiene como recurso no utilizado para evitar borrar otros contenidos sin auditoría.
- js/krueka-hero-3d.js?v=20261017c es un renderizador WebGL1 autocontenido con geometría 3D real: núcleo, anillos de conexión iluminados, nodos orbitales y bloques educativos; interacción suave con el puntero. No usa iframes, URL Spline ficticias, CDN, dependencias de pago ni datos de alumnos.
- En navegadores sin WebGL la misma zona muestra una composición CSS de geometría/orbitas en movimiento. El contenido HTML central y los botones permanecen siempre utilizables aun sin JavaScript.
- Rendimiento y accesibilidad: devicePixelRatio limitado, powerPreference low-power, carga con requestIdleCallback, IntersectionObserver para detener el dibujo fuera de pantalla, pausa si la pestaña está oculta y respeto por prefers-reduced-motion. El canvas decorativo tiene aria-hidden y su contenedor dispone de descripción accesible. Los efectos no son parte de ningún examen o actividad.
- Los cambios de CSS de portada se añaden a css/krueka-edu.css?v=20261017c; no modifican los módulos del Club, formularios del docente, políticas RLS, backend ni los sistemas de entrega.
- Pruebas en Chromium móvil y escritorio deben confirmar centrado, sin desbordamiento y WebGL real si el navegador devuelve un contexto válido, o fallback si no.

## 29. Corrección inmediata de la portada: demostración educativa de producto (octubre 2026)

- El usuario rechazó explícitamente la esfera, anillos y cubos abstractos WebGL del hero por tener poco vínculo con educación. Se retiró completamente su contenido y script del `index.html`, reemplazado por una demostración de las experiencias reales de la plataforma: `Crear` (un mundo ilustrado con personaje educativo), `Aprender con IA` (ejemplo de guía pedagógica) y `Entregar` (buzones Word/Excel/PowerPoint).
- La demostración es ilustrativa, no un editor ni una conversación activa; lo indica visiblemente y enlaza a las funciones reales. Su interfaz no trata datos de alumnos, claves, códigos, sesiones ni archivos.
- Nuevo `css/krueka-hero-showcase.css?v=20261017d`: diseño propio pastel, interfaz editorial de alta fidelidad y animaciones CSS accesibles, sin WebGL ni dependencias externas. `js/krueka-hero-showcase.js?v=20261017d` habilita los tres botones con teclado, `aria-pressed` y contenido real separado por panel.
- Se conserva el contenido en la portada aunque falle JavaScript: por defecto se muestra `Crear`. Reduce motion desactiva animaciones; el tamaño móvil se prueba en Chromium y los accesos al Studio y entregas se mantienen.
- El motor `js/krueka-hero-3d.js` queda como archivo histórico no ejecutado para evitar borrar recursos no auditados, pero no se presenta ni carga desde la portada pública.

## 30. Krueka Product-First: sitio educativo con demostraciones funcionales (octubre 2026)

- Después de varias iteraciones estéticas rechazadas por el usuario (esfera WebGL, robot ilustrado, formas CSS infantiles), la portada `index.html` se rehízo sobre el principio **mostrar producto, no dibujos de tecnología**. Interfaz editorial con tipografía centrada, contraste profesional, navegación por roles y demostración embebida.
- Las funciones de demostración son auténticamente interactivas pero usan exclusivamente ejemplos locales, sin datos reales:
  - **Taller:** tablero de 8 × 7 casillas en `js/krueka-platform-2026.js`; el explorador se controla con flechas de teclado o botones, detecta colisiones con obstáculos, cuenta pasos y valida llegada a la meta. El algoritmo es local y no guarda actividad estudiantil.
  - **Aula:** capacidad y tres indicadores de ejemplo; cambiar checkboxes actualiza el contador y la barra de progreso mediante `aria-valuenow`. No escribe calificaciones en el servidor.
  - **Entregas:** accesos directos a los servicios privados Word/Excel/PowerPoint reales; no ofrece un falso formulario ni altera políticas de almacenamiento.
- Nueva identidad profesional en `css/krueka-platform-2026.css`, portada `index.html` y `accesos.html` con `css/krueka-access-2026.css`: paleta blanco/azul marino/azul eléctrico, sin gráficos de robots o animación 3D, sin CDN ni fuentes externas, diseño móvil y soporte reduced-motion. La experiencia está utilizable en navegadores que no pueden ejecutar WebGL.
- Se conservan `app.html`, `studio.html`, `personajes.html`, los buzones y sus permisos. No se modifica Supabase, Edge Functions, roles, códigos, IA remota, almacenamiento ni proyectos. SIWC permanece **pendiente de autorización**, sin prometer uso gratis ilimitado.
- Las pruebas automáticas verifican enlaces locales, ausencia de scripts remotos, acciones reales del juego y rúbrica, navegación móvil, ausencia de desbordamiento y compatibilidad de la web con la suite del Studio. La captura visual Chromium complementa, no reemplaza, las pruebas con usuarios reales.
- Los CSS/JS antiguos de portada permanecen en el repositorio como recursos históricos **no importados**; su retirada definitiva debe hacerse tras auditoría de dependencias.

## Actividades temporales con código docente — octubre de 2026

- Página `actividades-clase.html` para alumnos: código único de 12 caracteres, consigna completa por tema/grado/materia, subida privada de una evidencia `.docx`, `.xlsx`, `.pptx` o `.pdf` de hasta 10 MB, recibo visible. Los estudiantes no necesitan cuenta ni pueden enumerar entregas, carpetas o usuarios.
- Página `actividades-clase.html?docente=1` para el profesorado: autenticación de Supabase con correo verificado y perfil `docente`, `director` o `admin` activo; acceso central permitido para la cuenta administrativa verificada. Cada docente solo administra las actividades que creó mediante `teacher_id`, aunque otros docentes estén autorizados.
- El docente puede crear consignas, generar y copiar el código de 12 caracteres, renovarlo mientras la clase está abierta (invalidando el anterior), consultar sus entregas y corregirlas, o cerrar definitivamente la clase. El código solamente se devuelve una vez al crearlo o renovarlo; en la base se guarda únicamente SHA-256.
- Edge Function `krueka-actividades-clase`: admite solicitudes de alumnos sin JWT, pero **toda** acción docente verifica por servidor el JWT, correo confirmado, rol y pertenencia de la actividad. Un código público solo habilita la consulta de la consigna mientras esté abierta y la subida de un archivo; no da derecho a listados ni descarga.
- Migración `20261020194500_temporary_class_activities.sql`: tablas `krueka_live_activities`, `krueka_live_submissions`, `krueka_live_upload_limiter` con RLS y permisos revocados a `anon` y `authenticated`; bucket de Storage `krueka-actividades-clase` no público. Los revisores descargan mediante URL firmada de 90 segundos.
- **Cierre sin carreras:** dos RPC security-definer exclusivamente para `service_role`, `krueka_live_reserve` y `krueka_live_finalize`, bloquean la fila de la clase con `FOR UPDATE`. El cambio a `accepting=false` impide nuevas consultas/cargas y la finalización de una carga previamente iniciada si cerró antes de registrarse. Se elimina de Storage cualquier objeto que no pueda finalizarse.
- Verifica firmas de archivos y marcadores OOXML, rechaza macros visibles en OOXML y limita cantidad de envíos por IP/grupo/global para reducir abusos. La comprobación de archivos no equivale a análisis antivirus; docente debe tratar adjuntos con precaución y mantener Office actualizado.
- **Guía PDF por código (ampliación):** el docente puede elegir un PDF al crear la actividad o añadir/reemplazarlo posteriormente desde «Mis clases», mientras permanezca abierta. Los archivos se almacenan en el bucket privado existente bajo `guides/{activity_id}/{uuid}.pdf`, y los campos `pdf_path` y `pdf_name` de `krueka_live_activities` vinculan la guía a la clase. Migración `20261020213000_class_pdf_guides.sql` mantiene RLS y las revocaciones existentes.
- La Edge Function añade `upload-guide` (FormData, JWT docente confirmado, verificación de autoría y clase abierta) y `guide` (POST con código válido, devuelve el PDF binario solamente si la clase continúa abierta). No emite URL pública ni enlace firmado permanente para alumnos; consulta nuevamente el código y el estado antes de responder. El navegador crea un enlace local Blob para visor/descarga de la guía y lo revoca al cambiar de código. No se puede revocar a distancia un PDF ya descargado por el alumno; el cierre impide nuevas solicitudes.
- Se conserva la consigna textual: si el profesor solo adjunta PDF, se registra una instrucción corta para que los alumnos sepan que deben abrirlo y subir su trabajo. La subida de trabajos sigue siendo independiente y solamente acepta el código de la clase activa. La guía se limita a 10 MB y se comprueba su firma PDF y marca de cierre, sin prometer análisis antivirus.
- Los códigos anteriores de Excel por grado, Word/PowerPoint y el acceso de clase tradicional en `app.html` no se modifican: este nuevo código se utiliza únicamente en `actividades-clase.html`.
- Pruebas: `tests/krueka-live-class.test.cjs`, `tests/krueka-live-class-browser.test.cjs`, además de verificación SQL de cierre/fin de envío dentro de una transacción revertida y prueba HTTP de rechazo anónimo. Para cerrar la validación real del profesor, probar inicio de sesión y envío de archivo válido desde navegador con una cuenta docente autorizada.

## 31. Baja no destructiva del Club y asistencia escolar por grado — octubre de 2026

- **Club:** la migración `20261021090100_club_salida_compatibilidad.sql` corrige `club_alumno_guardar(uuid,text,uuid,boolean,text)` haciendo opcional `p_nombre`: «Desactivar» manda solo `p_student` y `p_activo`, sin error de firma de PostgREST. La nueva columna `club_students.salio_at` y la RPC autenticada `club_alumno_salida(uuid,boolean)` distinguen «Salió» de «Inactivo». Ambas opciones bloquean el acceso del Club; «Salió» anota la fecha de salida, y «Reincorporar» la limpia. Se conservan pagos, trabajos, proyectos, progresos y el ID, sin eliminar al alumno. El servidor valida actor activo con rol admin/director, institución y pertenencia del grupo; deja auditoría del cambio. `js/club-gestion.js` presenta filtros «Ver inactivos» y «Ver los que salieron».
- **Asistencia escolar:** la migración `20261021090200_asistencia_por_grado_fecha.sql` crea `asistencia_grado` con clave única `(course_id,fecha,student_id)`, estado, observación, `registrado_por` y `registrado_at`. Esta planilla es **independiente** de `class_sessions` y de la asistencia por materia: no exige abrir una clase ni modifica los registros históricos de `attendance`.
- **Seguridad:** `asistencia_grado` tiene RLS activo y permisos directos revocados. Las RPC `asistencia_grado_cursos()`, `asistencia_grado_lista(course,date)` y `asistencia_grado_guardar(course,date,jsonb)` están habilitadas solo para usuarios autenticados. Verifican perfil activo, institución, grado y asignación docente (o rol admin/director), matrícula vigente para registros nuevos y tope de 250 registros por operación. No publican listas ni usan `service_role` en navegador.
- **Interfaz:** `js/asistencia-grado.js` añade «Asistencia por grado» a docentes, dirección y administración de `app.html`. Permite cambiar grado y fecha, marcar Presente/Ausente/Tarde/Justificado, guardar cambios explícitamente, consultar registros históricos, ver quién registró cada asistencia y exportar `.xlsx` real o imprimir la planilla A4 horizontal. El XLSX se construye localmente como OOXML/ZIP sin dependencia nueva y solo incluye información del grado/fecha visible para el docente. El formato de impresión se limita a esa vista.
- **Verificación:** `tests/asistencia-grado.test.cjs` comprueba firmas RPC, seguridad de migraciones, estado «Salió» y estructura del XLSX, junto con `node --check`. Faltan pruebas de punta a punta con dos cuentas institucionales reales para certificar autorizaciones en vivo, y revisar la impresión desde Windows antes de uso masivo.


## 32. Inicio de clase en PCs administradas — 21/10/2026

- `accesos.html` envía la tarjeta **Alumnos del aula** directamente a `actividades-clase.html`: ingresar el código temporal, leer el PDF y entregar un archivo. No se modifica la identificación de alumnos ni los permisos de docentes.
- `supabase/functions/aula-control/index.ts` agrega a `CORE_DOMAINS` cinco dominios necesarios: `krueka.com`, `www.krueka.com`, el backend privado de la aplicación `janebfpnknapvntfqolf.supabase.co`, `cdn.jsdelivr.net` y `challenges.cloudflare.com`. Los retorna en `sync` del agente (aprox. cada 30 segundos) y en la lista del panel, sin eliminar dominios previamente autorizados. El servidor impide retirar los cinco dominios base.
- `js/aula-control.js` presenta los cinco sitios como protegidos (sin botón de quitar). `app.html` actualiza el parámetro de versión. El código del agente Windows existente es ajeno a este repositorio; su aplicación real de `allowlist` debe comprobarse en una PC.
- `windows/Configurar-Krueka-Alumnos.ps1` y su lanzador CMD son una configuración local opcional que agrega excepciones a Edge, página de inicio y accesos directos públicos para abrir automáticamente `https://www.krueka.com/actividades-clase.html` al iniciar sesión en Windows. Respalda directivas existentes, no elimina los bloqueos de web ni la habilitación de Office; requiere administrador para aplicarse en cada equipo o distribuirse mediante el agente con permisos apropiados. No se instala remotamente por subir el archivo a GitHub.
- No se han modificado tablas, RLS, credenciales, tokens de dispositivos, programas de escritorio ni el formato de `sync` preexistente. La ampliación del JSON de la lista docente es compatible hacia atrás.
- Verificación pendiente en PC real: sincronización del agente, apertura automática de Edge, carga de actividad/PDF y entrega del alumno mientras usa Office. Si un filtro de Windows, DNS, MDM o quiosco ajeno a la directiva Edge bloquea el sitio, se debe modificar ese filtro también.


## 33. Refuerzo de sesiones Windows en PCs BEI — 21/10/2026

- Riesgo: la configuración actual de quiosco/Assigned Access pertenece a la cuenta o perfil configurado. Cerrar sesión e ingresar con otra cuenta estándar sin políticas equivalentes puede liberar navegación. El agente `aula-control` solo informa modo Office/quiosco y versión del agente; no demuestra que las cuentas alternativas estén restringidas. La UI de Krueka `js/kiosco.js` no equivale a una política de Windows.
- Nuevo `windows/Blindar-Sesiones-Krueka.ps1`: dos modos `Comprobar` (no cambia Windows) y `Aplicar` (administrador). `Aplicar` crea respaldos `.reg` antes de tocar políticas y agrega `HideFastUserSwitching=1` y `URLBlocklist=["*"]` + URLAllowlist de los sitios de clase a políticas HKLM de Edge/Chrome para **todas las sesiones**; mantiene URLAllowlist anteriores y advierte que deben revisarse. Ejecuta el bloqueador Brave por políticas/firewall y agrega reglas de salida específicas por ruta para Firefox/Opera/Vivaldi detectados. No modifica grupos/contraseñas/cuentas, ni Office, ni las reglas de quiosco existentes. Ocultar el botón de cambiar usuario no bloquea iniciar otra cuenta desde la pantalla de acceso.
- `windows/COMPROBAR-SESIONES-KRUEKA.cmd` y `APLICAR-SEGURIDAD-SESIONES-COMO-ADMIN.cmd`: diagnóstico y aplicación local con los dos PS1 juntos. El diagnóstico enumera usuarios locales activos/administradores, alerta sobre inicio automático, listas del navegador y firewall; no registra contraseñas ni tokens. El reporte **no** se sincroniza con Supabase ni implica que un aula completa esté protegida.
- Seguridad operativa: el profesor debe preservar una cuenta administradora con contraseña privada, alumnos deben ser cuentas estándar, cuentas sobrantes deben tratarse explícitamente con dirección. Para impedir usar apps portables o administrar varias cuentas estándar se requiere un perfil multi-app de Assigned Access para el conjunto de cuentas estudiantiles, o control de aplicaciones AppLocker/WDAC según edición de Windows. Instalación piloto y validación real de Krueka/Office/entregas/otras cuentas obligatoria antes de extender a ocho equipos. Una contraseña administrativa conocida, GPO externa o arranque externo siguen siendo vectores de evasión.
- El panel `js/aula-control.js` muestra «Seguridad al cambiar de cuenta: sin comprobar en Windows» y enlaza el diagnóstico local, en vez de afirmar protección verificada. Las pruebas `tests/aula-windows-sessions.test.cjs` y la comprobación de sintaxis PowerShell validan que se expongan las advertencias y que no haya modificaciones automáticas de cuentas.


## 34. Diagnóstico de equipos sin confirmación del modo Office — 22/10/2026

- Krueka almacena por equipo el modo solicitado (`aula_devices.desktop_mode`), la confirmación que envió Windows (`desktop_mode_observed`), el error del quiosco (`kiosk_error`) y la fecha `last_seen`. La solicitud no equivale a habilitación efectiva. La **PC 02 BEI** mantiene `desktop_mode=office` y `desktop_mode_observed=null`, sin contacto desde el 21/10/2026 a las 08:06 PY; existen solicitudes del 22/10 sin confirmación del agente.
- `js/aula-control.js` ahora presenta alerta explícita cuando `last_seen` es anterior a 125 segundos o falta: «PC sin conexión» y enlace a diagnóstico local. Inhabilita reintentos innecesarios de Ofimática hasta que el agente vuelva a sincronizar. No modifica el estado del servidor ni permisos de otras PCs.
- `windows/Diagnosticar-Office-Krueka.ps1` incorpora `Comprobar` (solo lectura) y `ReiniciarAgente` (administrador). Comprueba servicios/tareas con nombre o ruta Krueka sin revelar tokens, Office instalado, HTTPS de Supabase, Assigned Access y errores de quiosco; solo inicia/reinicia servicios/tareas asociados con Krueka. Los lanzadores son `COMPROBAR-OFFICE-KRUEKA.cmd` y `REINICIAR-AGENTE-KRUEKA-ADMIN.cmd`. Si el agente tiene otro nombre, el diagnóstico local puede no detectarlo, sin intentar desinstalarlo.
- La activación de Word/Excel/PowerPoint requiere verificar la experiencia de Windows usada por alumnos. Un quiosco single-app de Edge no habilita las aplicaciones Office; se requiere una configuración multi-app compatible con la edición Windows y autorizaciones específicas. Se exige prueba presencial después de volver a sincronizar: cuentas estándar, Word/Excel/PowerPoint, actividad PDF, entrega y restricciones de Internet. El cambio de GitHub no instala el diagnóstico en ninguna PC ni es reparación remota.


## 35. Recuperación de actualización Brave interrumpida en PC02 — 22/10/2026

- Evidencia local: el ejecutable original `Krueka-Aula-Control-Actualizador-Brave-v05.exe` falla con `exit status 1` porque existe `C:\Program Files (x86)\KruekaAula\KruekaAula.exe.pre-brave-05.bak`. Este error se encuentra en el actualizador ejecutado localmente (no en Supabase). La PC conserva acceso a Internet pero el agente no ha confirmado el modo Office.
- `windows/Recuperar-Actualizador-Brave-v05.ps1` expone `Comprobar` (solo lectura) y `PrepararReintento` (administrador). Solo actúa sobre la carpeta instalada de KruekaAula; verifica tamaño, cabecera PE `MZ` y SHA256. Si no existe el ejecutable del agente, restaura una copia desde el respaldo comprobado. Si existe un ejecutable aparentemente válido, lo conserva. Mueve el respaldo antiguo a `ProgramData\Krueka\Respaldo-Actualizadores`, verificando su hash, para que el actualizador original pueda crear un nuevo respaldo. Si hay múltiples instalaciones o archivos corruptos, se detiene en lugar de sobrescribir.
- `windows/COMPROBAR-ACTUALIZADOR-BRAVE.cmd` y `windows/RECUPERAR-ACTUALIZADOR-BRAVE-ADMIN.cmd` son lanzadores locales. El administrador debe **volver a ejecutar manualmente** su actualizador original tras la recuperación. No se envía comando de ejecución al agente remoto y no se altera `aula_devices`, tokens, cuentas, permisos Office, modo quiosco ni firewall.
- Validación restante: se requiere comprobar que el agente vuelva a reportar `last_seen` reciente y `desktop_mode_observed=office`, y que Word/Excel/PowerPoint puedan abrirse en sesión estándar del alumno. Un respaldo resuelto no equivale a resolver Assigned Access de Windows.
