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
