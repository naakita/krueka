# Auditoría Krueka: plataforma educativa, creación e IA — 17/10/2026

## Alcance
Se inspeccionaron la portada pública y el código actual del repositorio: acceso por roles, información institucional, estado de ChatGPT, inicio de sesión escolar, Club, taller de personajes y buzones Word/Excel/PowerPoint. El buscador aún puede servir una versión antigua en caché. **No se accedió a cuentas docentes/alumnos reales:** el conector de navegador no estaba conectado. La auditoría no certifica los flujos privados, su seguridad o su accesibilidad completa.

## Diagnóstico
1. **Marca poco diferenciada:** el contenido de la portada principal presentaba servicios administrativos en tarjetas comunes, aunque el producto tiene videojuegos, personajes, animación, video y colaboración pedagógica.
2. **IA mal situada en el relato:** el visitante no distingue Ayuda local no generativa, proveedor generativo por API y conexión ChatGPT pendiente de autorización.
3. **Rutas fragmentadas:** los códigos del aula, del Club y de entrega cumplen propósitos distintos, pero el público necesita entenderlo antes de ingresar.
4. **Demasiada explicación en vez de producto:** la portada necesitaba un escenario visual. Las ilustraciones deben rotularse como ilustrativas; no representar falsas estadísticas «en vivo».
5. **Identidades incoherentes:** el Studio creativo usa estética oscura, la portada y las páginas públicas anteriores eran claras y el inicio de sesión escolar tenía otra apariencia.

## Cambios implementados en la fase pública
- **index.html:** portada de alto contraste centrada en educación, IA y proyectos; vista de proceso creativo claramente ilustrativa; productos principales con destinos funcionales, personas por rol, explicación clara de IA y propuesta pedagógica por capacidad/evidencia. No hay estadísticas inventadas, logos de socios ficticios ni acreditaciones.
- **accesos.html:** acceso intuitivo por docente/dirección, alumno de clase, estudiante del Club, y los tres buzones, explicando las diferencias de códigos.
- **informacion.html y chatgpt-integracion.html:** jerarquía, paleta, navegación y footer coherentes, sin cambiar la información crítica de privacidad y SIWC pendiente.
- **css/krueka-edu.css:** nuevo sistema visual dark tech con acentos lima y turquesa, escalas tipográficas fluidas, diseño responsive, focos visibles y soporte reduced-motion, sin fuentes ni dependencias de terceros.
- **app.html:** estilo de login restringido a #screen-login y #screen-nueva, aislado en css/krueka-acceso-escolar.css. No se modifica autenticación, códigos, roles, Turnstile, datos ni procesos privados.

## Próximos trabajos sugeridos

### Prioridad 0: revisar recorridos, privacidad y funcionamiento antes de promocionar
- Comprobar desde navegador real el recorrido docente -> curso -> actividad -> recepción -> revisión; y estudiante -> código de clase -> proyecto -> guardar -> recuperar en otra PC.
- Comprobar desde las PC de 32 bits del Club compatibilidad real: navegación, rendimiento de canvas y guardado. No afirmar compatibilidad universal.
- Auditar el Portal Familia: la arquitectura documenta una consulta por grado/nombre que no constituye por sí misma autenticación individual. No promocionar un panel privado hasta validar autorizaciones y privacidad de menores.
- Auditar las políticas del almacenamiento de evidencias y los datos de alumnos con revisión institucional; definir consentimiento, conservación y eliminación de datos.
- Mantener el estado SIWC como **pendiente**. Prohibido reutilizar tokens OpenCode o repartir la suscripción personal entre estudiantes.
- Probar en 320, 375, 768 y 1440 px y teclado real, incluyendo contraste y ampliación de texto. CI y verificación estática no sustituyen pruebas móviles.

### Prioridad 1: coherencia de producto
- Unificar pantallas de entregas Word/Excel/PowerPoint y su bandeja docente mediante CSS compartido, sin fusionar endpoints ni relajar RLS.
- Rediseñar las pantallas internas de docente, dirección y estudiante con el mismo sistema visual, después de inventariar sus flujos y sin mover o borrar datos.
- Capturar demostraciones reales con datos de prueba para sustituir algunos mockups ilustrativos. No publicar proyectos de menores sin autorización.
- Preparar dossier institucional para OpenAI y colegios: funciones reales, edades, permisos, pruebas verificables, proveedores y límites.

### Prioridad 2: excelencia educativa
- Vincular visualmente objetivos, capacidades, indicadores, actividad, evidencia y revisión docente.
- Crear modo accesible de bajo consumo para las máquinas débiles y no suponer que todos los navegadores ejecutan WebGL/edición de video.
- Documentar la ayuda IA generativa frente a la guía local no generativa en cada contexto del Studio.
- Revisar español paraguayo y futuras interfaces en guaraní con docentes.

## Regla de publicación
El material público debe describir capacidades verificadas, preservar privacidad, no prometer servicios aún no autorizados y distinguir los ejemplos ilustrativos de datos reales. La renovación pública es la fase 1, **no significa que todas las interfaces privadas ya estén rediseñadas**.