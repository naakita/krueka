# Krueka

Plataforma escolar para las clases de Informática de 9.º grado.

## Qué hace

- El docente entra con usuario y contraseña.
- Elige el curso (9.º A, 9.º B o los que cree).
- Carga la lista de alumnos pegándola desde Excel o importando un CSV.
- Abre la clase y la plataforma genera un código de 4 dígitos.
- Ve el plan completo de la clase: capacidad, inicio, desarrollo, cierre, indicadores y Plan B.
- Toma asistencia.
- Libera el trabajo por etapas: Tema → Actividad → Entrega → Resultados.
- Los alumnos entran con el código, eligen su nombre y trabajan dentro de la plataforma.
- El docente corrige con nota de 0 a 100 y devolución escrita.

## Acceso inicial

- Usuario: `profe`
- Contraseña: `krueka2026`

Se cambian desde la pestaña **Ajustes**.

## Clases cargadas

1. Búsqueda segura y confiable de información
2. Imágenes libres y derechos de autor
3. Datos reales en Excel y gráficos
4. Correo electrónico educativo
5. Formularios y encuestas digitales
6. Proyecto final integrador

Cada clase dura 60 minutos (8 de inicio, 40 de desarrollo, 12 de cierre) y tiene su Plan B para trabajar sin internet o sin electricidad.

## Despliegue

Es un sitio estático de un solo archivo (`index.html`). No necesita servidor, base de datos ni instalación.

- **Vercel:** importar este repositorio en vercel.com/new y desplegar sin cambiar ninguna opción.
- **Uso local:** descargar `index.html` y abrirlo con doble clic en cualquier navegador.

## Estado de los datos

En esta versión los datos se guardan en el navegador de cada computadora (`localStorage`). Desde **Ajustes → Exportar datos** se obtiene un respaldo en JSON.

Próximo paso: base de datos central para que las entregas de todos los alumnos lleguen a un solo panel.
