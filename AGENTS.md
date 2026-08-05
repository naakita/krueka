# Reglas para asistentes de IA (Codex, Claude y similares)

Este repositorio es un sistema **en producción** usado por una escuela real:
docentes, dirección, alumnos y el Club de informática. Un error no es un bug de
demo, es una clase perdida o datos de alumnos dañados.

## Flujo obligatorio antes de modificar

1. Leer `ARQUITECTURA.md` completo. Es el mapa de módulos, dependencias y tablas.
2. Identificar los archivos afectados **y** las tablas, políticas RLS y funciones de servidor involucradas.
3. Escribir un plan corto y mostrarlo antes de tocar código.
4. Leer completos los archivos que vas a editar. No editar por fragmentos adivinados.
5. Implementar el cambio mínimo. Nada de refactors no pedidos.
6. Si tocaste algún `js/*.js`, actualizar el parámetro `?v=AAAAMMDD` de ese script en `index.html`.
7. Si cambió la arquitectura (módulo nuevo, tabla nueva, RPC nueva, dependencia nueva), actualizar `ARQUITECTURA.md` en el mismo commit.
8. Probar el recorrido completo del rol afectado: login → vista → guardado → lectura desde otro rol.

## Reglas duras de seguridad

- **Nunca** poner en este repositorio la clave `service_role` de Supabase, un token de GitHub, credenciales OAuth de YouTube ni ninguna clave secreta. Este repo es **público** y se sirve tal cual al navegador. La única clave admitida acá es la *publishable*.
- No desactivar RLS ni crear políticas públicas de escritura para «que funcione más rápido». Si una consulta falla por permisos, corregir la política, no abrirla.
- No agregar contraseñas, correos institucionales, nombres de alumnos ni datos de menores al código, a los commits, a los comentarios ni a los archivos de ejemplo.
- Todo dato que venga de la base y se inserte en HTML pasa por `esc()`. La app arma HTML con plantillas de texto: omitir `esc()` es una vulnerabilidad de XSS directa.
- No cambiar el flujo de entrada del alumno (código de 6 caracteres, sin contraseña) sin pedirlo explícitamente: es el punto de acceso de menores de edad.
- `Centinela` y `Kiosco` son **medidas disuasivas del lado del cliente**, no seguridad real: un alumno con conocimientos las evade. No presentarlas como control infalible ni construir decisiones críticas sobre ellas.
- No borrar ni migrar datos de producción sin respaldo previo y confirmación explícita.

## Reglas de estilo del proyecto

- Español de Paraguay en la interfaz, textos claros para docentes sin formación técnica.
- Sin frameworks, sin build, sin dependencias nuevas por CDN salvo pedido expreso.
- Objetos globales por módulo (`Docente`, `Direccion`, `Admin`, `Alumno`, …). Antes de crear un nombre global nuevo, verificar que no exista en otro archivo.
- Archivos nuevos se agregan a `index.html` **después** de `js/core.js`.

## Sobre herramientas de grafo de dependencias

Si se usa una herramienta que genera un grafo del proyecto (Graphify u otra),
vale como complemento, **no** como reemplazo de `ARQUITECTURA.md`: esas
herramientas analizan código y este proyecto tiene la mitad de sus dependencias
en Supabase (tablas, políticas RLS y funciones de servidor), que ningún grafo de
archivos detecta. Además, al no haber `import`/`export`, el grafo automático ve
los archivos como independientes cuando en realidad todos dependen de
`js/core.js` y del orden de carga de `index.html`.
