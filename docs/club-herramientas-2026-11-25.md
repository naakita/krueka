# Club Krueka: comparación y mejoras de herramientas

**Revisión: 25 de noviembre de 2026.** Comparación funcional de las 14 categorías actuales del Club con documentación oficial de editores conocidos. Las referencias sirven para identificar herramientas útiles; no implican que esas funciones sean exclusivamente de pago ni que Krueka integre esos productos o reproduzca sus suites completas.

## Cambios compartidos

Los talleres reciben distribución ajustable entre edición y vista previa, inversión de lados, ampliación de cada panel y restauración. En pantallas pequeñas se cambia el orden vertical. Solo proporciones y orden se recuerdan en el navegador; mover paneles no modifica la obra ni recrea el iframe.

El historial general permite deshacer y rehacer hasta 30 pasos de la sesión, con un límite adicional de 5 millones de caracteres por pila. Se separa por alumno/proyecto y no sustituye el historial privado del servidor. Los controles de código se incorporan donde existe un editor de código; no todos los talleres necesitan mostrarlo.

## Matriz de las 14 categorías

| Taller | Referencia oficial y función comparada | Mejora incorporada en Krueka | Límite concreto |
|---|---|---|---|
| **Videojuegos** — incluye bases 2D, 3D y Python | [VS Code: edición][vscode], búsqueda y sangría | Espacio ajustable, historial general y herramientas de código: buscar/reemplazar, duplicar línea, sangría, tamaño de letra y ajuste de líneas en los editores disponibles. | Los motores, reglas y bibliotecas 3D existentes conservan su alcance. Esta entrega no agrega un nuevo motor 3D, importación universal de modelos ni herramientas de poses a todos los juegos. |
| **Programación por bloques** | [Scratch: duplicar una pila][scratch-blocks] | Duplicar un bloque con ID propio, copiar un evento y pegarlo en otro, historial y escenario ajustable. | Hasta 35 bloques por evento. El portapapeles es de la sesión y del proyecto; no importa archivos de Scratch. |
| **Páginas web** | [VS Code: edición][vscode] | Selector de todos los archivos, búsqueda/reemplazo literal, duplicar línea, sangrar/quitar sangría, ajuste de líneas y posición del cursor. | La búsqueda actúa sobre el archivo abierto; no hay búsqueda global, extensiones, depurador completo ni instalación de VS Code. |
| **Aplicaciones web** | [VS Code: edición][vscode] | Las mismas herramientas de archivos/código, historial y distribución del editor web, conservando la vista previa aislada. | Las herramientas no agregan automáticamente cuentas de usuarios, bases de datos o servicios para la app creada. |
| **Blogs** | [Google Docs: formato][docs-format], tipografía y párrafos | Tamaños de texto/título, interlineado, alineación, recuentos, buscar/reemplazar, TXT e impresión/PDF; ArteLab sigue disponible para la portada. | La composición se aplica a los datos de la obra. La búsqueda de texto actúa sobre la parte visible; no hay coedición simultánea. |
| **Historietas** | [Google Docs: formato][docs-format] y [Photopea: transformar][photopea] | Columnas y separación de viñetas; lado y colores del globo, tamaño del personaje y grosor del marco por escena; herramientas editoriales compartidas. | No se incorpora un editor libre de curvas para globos ni maquetación arbitraria de cada viñeta. Los personajes de estas escenas conservan los recursos existentes. |
| **Cuentos** | [Google Docs: formato][docs-format] | Tipografía, interlineado, alineación, búsqueda/reemplazo, contador, descarga TXT e impresión/PDF, conservando las partes y el lector. | No hay revisión gramatical generativa ni historial colaborativo añadido. La impresión genera una vista de lectura, no un archivo editable de Word. |
| **Libros** | [Google Docs: formato][docs-format] | Los mismos controles sobre el manuscrito continuo, con ilustraciones, recuento de palabras y exportación de texto/impresión. | Se conservan hasta 8 imágenes comprimidas del libro y las cuotas del proyecto. PDF depende del diálogo de impresión del navegador. |
| **Dramas** | [Google Docs: formato][docs-format] | Tipografía y composición del guion, búsqueda/reemplazo, texto descargable, impresión e historial. | No se añade generación de voces, grabación de actores ni edición de audio. |
| **Anime original** | [Krita: línea de tiempo][krita-time], control del tiempo | Duración y movimiento por escena, opción de heredar el tiempo general, tamaño del personaje y colores/posición del diálogo. | Este taller conserva sus escenas animadas HTML; no se convierte en animación de dibujo cuadro a cuadro ni recibe las pistas del editor `animation`. |
| **Flyers y afiches** | [Google Docs: formato][docs-format] y [Photopea: transformar][photopea] | Tamaño de texto y título, alineación, interlineado y formatos A4 vertical/horizontal, Oficio y Cuadrado; ilustración con ArteLab e impresión. | No hay exportación CMYK, sangrado de imprenta, plantillas comerciales importadas ni garantía de equivalencia con un programa de preimpresión. |
| **Dibujos** | [Krita: cubeta][krita-fill], [Photopea: transformar][photopea] y [Scratch: formas vectoriales][scratch-vector] | Cubeta real para regiones entre trazos libres, tolerancia, rellenos persistentes, nueve figuras con paletas por componentes, dimensiones visibles fieles, proporción opcional, giro/reflejo, partes deformables, polígonos de 3–16 puntos, zoom/Mano, ocultar/bloquear y PNG. | Dos capas de trazos; lienzo de 600 × 320 y PNG de 1800 × 960. La cubeta no implementa cierre automático de huecos ni expansión adaptativa del borde. Emojis y fotografías no se convierten en componentes vectoriales. |
| **Animaciones** | [Krita: línea de tiempo][krita-time], poses y navegación temporal | **En la base `animation`**: pistas de personajes, cursor exacto, reproducir/pausar, avance de 1/24 s, copiar/pegar poses, arrastrar personajes en pausa, poses vecinas, orden, opacidad, reflejo y bloqueo. | Hasta 8 personajes, 12 poses por personaje y 2–30 s. Estas herramientas pertenecen al editor de poses `animation`; el cortometraje **`pabellon-cine`** conserva su editor de planos y solo recibe las mejoras compartidas de espacio/historial. |
| **Videos** | [Clipchamp: edición][clipchamp], recorte, división y propiedades | Línea de tiempo, cursor exacto, división de escenas, inicio/final del original, velocidad, volumen/silencio, encuadre, fundidos a negro/blanco y reproducción sincronizada. | Hasta 12 escenas, 0,5–15 s por escena y 90 s de montaje. No hay varias pistas independientes de audio/video, chroma, subtítulos automáticos ni exportación MP4 universal. |

## Guardado, exportación y límites que siguen vigentes

- **Cuotas del proyecto:** 45 archivos, 120.000 caracteres por archivo y 220.000 en total. Se retiró el recorte silencioso de dibujo a 55 trazos/30 objetos; cuando una nueva operación excede la cuota, se rechaza y conserva el contenido anterior. Un relleno muy fragmentado puede consumir mucho más espacio que una región uniforme.
- **Dibujo editable:** los rellenos libres se guardan como rectángulos de la región seleccionada; las figuras conservan sus componentes y transformaciones. Las medidas se calculan sobre sus límites visibles, incluido el borde. Hasta 6 imágenes WebP comprimidas de 12.000 caracteres. El relleno puede mostrar un halo fino de antialias al ampliarse.
- **Video local:** los originales seleccionados, de hasta 25 MB cada uno, quedan en memoria. En la nube se guardan montaje, referencias, títulos y fotos reducidas, pero **no los originales de video**. Al reabrir o cambiar de proyecto/equipo hay que elegirlos nuevamente; la vinculación usa nombre y tamaño.
- **Exportación audiovisual:** Canvas/MediaRecorder, en tiempo real, máximo 30 MB y formato según soporte del navegador. El sonido requiere activación en la vista previa. No se incorpora un servicio remoto de renderizado.
- **PDF:** el botón abre una vista de impresión; el alumno elige imprimir o guardar PDF en su navegador. Se conserva la publicación mediante revisión docente, sin publicar automáticamente por descargar o exportar.

## Pruebas y evidencia

La cobertura está en el repositorio, con login y backend simulados para los recorridos de interfaz:

| Área | Pruebas | Comprobaciones relevantes |
|---|---|---|
| Distribución | `tests/club-studio-layout.test.cjs`, `tests/club-studio-layout-browser.test.cjs` | Proporciones, inversión, teclado, restauración, paneles especializados y preferencias sin contenido. |
| Dibujo | `tests/club-dibujos.test.cjs`, `tests/club-dibujos-browser.test.cjs` | Cubeta, divisiones/tolerancia, reapertura, paleta, dimensiones, componentes, bloqueo, zoom, contraste y conservación de obras amplias. |
| Texto/código/bloques | `tests/club-studio-suite.test.cjs`, `tests/club-studio-suite-browser.test.cjs` | Reemplazo literal/Unicode, deshacer/rehacer, límites del historial, impresión, duración por escena, archivos, duplicado/copia de bloques y separación entre alumnos. |
| Animación/video | `tests/studio-media-tools.test.cjs`, `tests/studio-creative.test.cjs`, `tests/club-premium-media-browser.test.cjs` | Poses, bloqueos, división y recortes exactos, velocidad, reproducción, audio, compatibilidad de datos y motores personalizados; exportación donde el navegador la admite. |

En la revisión de dibujo se ejecutaron **17 pruebas unitarias**, se contrastaron **500 selecciones de cubeta** contra un recorrido BFS independiente y se rasterizó Canvas/SVG: un robot configurado a **220 × 160 px** ocupó exactamente **220 × 160 píxeles visibles**, incluso tras deformar una parte. Un proyecto anterior de lámina, trazos y figuras 3D conservó idéntica representación al compararlo con la versión previa.

Las pruebas simuladas y la inspección del navegador ayudan a detectar fallos funcionales y visuales; no certifican por sí solas las autorizaciones de producción ni todos los códecs, impresoras y equipos físicos del Club. El mapa de módulos y persistencia está en [ARQUITECTURA.md](../ARQUITECTURA.md), sección del 25/11/2026.

## Fuentes oficiales consultadas

- [Krita — Fill Tool][krita-fill]: regiones contiguas, tolerancia y opciones adicionales de bordes.
- [Krita — Animation Timeline][krita-time]: cursor, capas, fotogramas clave y duplicado.
- [Photopea — Free Transform][photopea]: ancho/alto, proporción, giro y reflejo.
- [Microsoft — How to edit a video in Clipchamp][clipchamp]: recortar/dividir, encuadre, fundidos, volumen y velocidad.
- [Scratch Foundation — Create an Original Sprite][scratch-vector]: relleno, contorno, transformación y edición de puntos. El enlace del recurso puede redirigir a la biblioteca de aprendizaje de Scratch; también está la [colección oficial de tutoriales](https://scratch.mit.edu/help/videos/).
- [Scratch — Move your sprite with arrow keys][scratch-blocks]: duplicación de una pila de bloques.
- [Visual Studio Code — Basic editing][vscode]: búsqueda/reemplazo y edición del código.
- [Google Docs — Change how paragraphs & fonts look][docs-format]: tamaños de letra, alineación e interlineado.

[krita-fill]: https://docs.krita.org/en/reference_manual/tools/fill.html
[krita-time]: https://docs.krita.org/en/reference_manual/dockers/animation_timeline.html
[photopea]: https://www.photopea.com/learn/free-transform
[clipchamp]: https://support.microsoft.com/en-us/clipchamp/how-to-edit-a-video-in-clipchamp
[scratch-vector]: https://resources.scratch.mit.edu/www/guides/en/ScratchLearningResource_CreateOriginalSprite.pdf
[scratch-blocks]: https://scratch.mit.edu/help/studio/tips/howto/move-with-arrow-keys
[vscode]: https://code.visualstudio.com/docs/editing/codebasics
[docs-format]: https://support.google.com/docs/answer/1663349?hl=en
