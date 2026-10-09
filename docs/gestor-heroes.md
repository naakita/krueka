# Krueka Hero Lab — primera fase del estudio de juegos RPG

**Demo pública:** https://www.krueka.com/ejemplos/gestor-heroes.html

**Creación privada en Club Junior:** https://www.krueka.com/app.html?club=bei → ingresar con código de alumno → Studio IA → ＋ Crear → Gestor de Héroes · RPG Studio → Bases y reglas.

Hay seis moldes originales listos: caballero, arquera, hechicero, guardián, asesino y tecnoguerrero. Cada personaje permite combinar armadura, capucha/casco/cabello/corona, capa, arma, colores, rol, elemento, rareza, estadísticas, historia y cuatro habilidades. Máximo ocho héroes por colección/proyecto. Guardar héroe cambia solo game-config.js; Guardar (barra superior) confirma en nube. Mis proyectos recupera el proyecto, la colección y el chat.

**Chat:** modo Planear para definir personaje. En Construir pedir un cambio pequeño a game-config.js, sin regenerar hero.js. La IA está sujeta a los límites del taller, pero los moldes no gastan tokens.

**Clase autónoma de 60 min:** 5 min ingresar; 10 min elegir molde; 15 min editar cuatro piezas; 10 min historia/habilidades; 10 min chat y comprobar; 10 min guardar y recuperar.

**Capacidad:** Diseña personajes originales con moldes y elementos combinables asistidos por IA.
**Indicadores:** elige molde, combina cuatro piezas, completa ficha, prueba vista, guarda y recupera.

**Alcance real:** SVG vectorial estilizado e interfaz de colección con aspecto de juego RPG; no renderiza modelos 3D hiperrealistas ni genera imágenes IA. Próximas fases: escenarios, animaciones y efectos, combate, historia e inventario. No modifica datos existentes, RLS ni la API.


## Render Pro — mejorar la presentación de los héroes

1. Studio IA → + Crear → Gestor de Héroes → Bases y reglas → Editar héroes.
2. Seleccionar el héroe. Debajo de la vista de sus piezas aparece «Render Pro · Arte y 3D».
3. Elegir uno de los seis moldes 3D y la iluminación. Presionar «Activar Render 3D» para descargar bajo demanda el motor gratuito y el modelo CC0. Arrastrar para girar, usar la rueda para zoom y tomar una captura si el navegador lo permite.
4. Para obtener una ficha que se acerque a una ilustración de fantasía HD, seleccionar una imagen original propia/autorizada. Krueka la convierte a WebP reducido y guarda la imagen en el proyecto sin enviar el archivo a ningún servicio de generación. El retrato aparece en el héroe de la galería y en su preview. Guardar desde el botón superior.
5. Volver al mundo con el botón correspondiente. Deshacer y Mis proyectos conservan los datos, sujeto al guardado exitoso de la nube.
6. Si no carga 3D por WebGL, red o GPU, usar la vista vectorial. Quaternius es estilo 3D de videojuego estilizado: no promete el aspecto de la foto enviada por el docente.

Guía de licencias y dependencias: `docs/render-pro-fuentes.md`.


### Acceso rápido a Render Pro desde Game Studio (9/10/2026)

Cuando estés en Bases y reglas y veas el mapa y la biblioteca de objetos, **no busques Render Pro en la galería de la derecha**: la nueva barra superior del editor del mapa muestra directamente `⚔ Personajes · Render Pro`. Pulsá ese botón. El editor de héroes abre al principio, con `✦ Abrir Render Pro 3D` y `← Volver al mundo` en la cabecera; Render Pro aparece antes de los moldes y de los controles avanzados. Si el navegador muestra la versión anterior, refrescá con Ctrl + F5. Los proyectos guardados siguen intactos.

## Trabajo cuando el proveedor de IA alcanza sus límites

En **Chat** aparece «Otras formas de avanzar»: **Guía sin IA** (instrucciones según la base elegida), **Copiar mi pedido** y **ChatGPT personal (13+)**. Estas ayudas no usan API de OpenAI.

- El chat y los archivos del alumno se siguen almacenando en **su proyecto privado de Krueka**, no se mezclan con otros alumnos ni se exportan automáticamente a ChatGPT.
- El botón de ChatGPT externo sólo abre **https://chatgpt.com/** en otra pestaña, tras confirmar los requisitos de edad; cada alumno que lo use debe contar con **su propia cuenta**, y si es menor de 18, consentimiento de su padre, madre o tutor. Menores de 13 no deben usar ChatGPT; usan la guía visual de Krueka.
- La solicitud se copia al portapapeles **sólo al pulsar Copiar**; no envía mensajes ni archivos del proyecto a terceros. Si un estudiante decide pegarla en ChatGPT, debe evitar información personal. Las respuestas se evalúan y aplican manualmente dentro de Krueka, no hay sincronización automática.
- No se permite insertar una URL privada como `https://chatgpt.com/c/…` ni compartir la sesión del docente, ni usar la suscripción Plus como si fuese el crédito de la API. Los enlaces a conversaciones no autorizan integración, y los términos de OpenAI prohíben compartir credenciales.
- El uso externo no modifica el presupuesto diario de la API ni soluciona directamente un error 429 del proveedor; simplemente permite seguir trabajando con el editor y, a quienes son elegibles, con una cuenta propia fuera de Krueka.
- Más adelante puede solicitarse acceso como socio de «Sign in with ChatGPT»; hoy no está disponible como integración de Krueka y no debe simularse.
