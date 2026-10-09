# Fuentes gratuitas incorporadas al Render Pro

## Motor 3D

- Google `<model-viewer>` 4.1.0, licencia **Apache-2.0** (software de código abierto). Motor de render PBR/glTF con controles de cámara y materiales, usa Three.js internamente. Repositorio: https://github.com/google/model-viewer; documentación: https://modelviewer.dev/; CDN: https://cdnjs.cloudflare.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js. Se descarga **solo cuando el alumno pulsa Activar Render 3D**, no durante el inicio de sesión.

## Biblioteca de modelos de personajes

- Autor original: **Quaternius**, «RPG Character Pack», licencia **CC0 1.0** (dominio público), seis personajes animados, estilizados, bajos en polígonos. Pack original: https://quaternius.com/packs/rpgcharacters.html.
- Espejo técnico con modelos convertidos a GLB: https://github.com/Papyszoo/CC0-Public-Domain-Models, paquete `packs/quaternius-rpg-characters`. Reutilizamos únicamente los GLB: `warrior`, `ranger`, `wizard`, `rogue`, `cleric`, `monk`. Repositorio congelado en commit `77343cac874f06b73d16ad0063339df7c9ca254c` para no mezclar versiones. Se descargan 3D desde raw.githubusercontent.com sin transmitir información personal ni archivos del usuario. El paquete confirma licencia CC0 en `pack.json`.
- Uso educativo y comercial permitido. Son diseños 3D de fantasía estilizados; **no tienen la apariencia ultradetallada de una ilustración/render fotorrealista**. El botón «Retrato HD» permite a los alumnos utilizar ilustraciones propias o autorizadas para esa presentación.

## Herramienta gratuita opcional para modelar

- **Blockbench** (https://web.blockbench.net/), editor 3D web, código abierto GPL-3.0. Se abre externamente mediante enlace explícito, sin integrar su código GPL al software público de Krueka. Puede exportar modelos para usar en otros motores, pero esta fase de Render Pro sólo incluye seis modelos curados, **todavía no importa archivos GLB personales**.

## Costos, privacidad y limitaciones

- No se añade ningún generador de imágenes mediante API ni cuota/credenciales nuevas. No hay garantía de generación de ilustraciones HD gratuita e ilimitada.
- La exportación HD del archivo original al retrato comprimido ocurre localmente dentro del navegador y se añade al proyecto **privado del alumno** mediante guardado habitual; cuando el alumno pulsa Guardar, se envía a la infraestructura privada existente de Krueka, no al CDN externo.
- Límite de 220.000 caracteres por proyecto y 120.000 por archivo; demasiados retratos pueden alcanzar esos límites. Si ocurre, Krueka rechaza el nuevo retrato sin sobrescribir el juego.
- GPU limitada/Windows 32 bits: el modo de alta calidad puede funcionar más lento o no abrir; la vista SVG sigue funcionando.
- Para una biblioteca de armaduras 3D verdaderamente modulares en versiones siguientes: https://quaternius.com/packs/modularcharacteroutfitsfantasy.html (12 conjuntos/62 piezas CC0; versión gratuita «Standard» es un subconjunto). No se ha instalado todavía ese pack pesado (~280 MB).
