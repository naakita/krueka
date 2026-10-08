# Krueka Studio: conexión de API

La infraestructura está preparada para usar el Chat y probar el juego en el mismo taller desde el navegador. No requiere instalar OpenCode ni alquilar una VPS adicional. Conserva los proyectos, hasta 40 mensajes y el borrador en la nube. Las bases, el editor y la revisión funcionan mientras la API está desconectada: Guardar idea conserva un pedido pendiente sin generar una respuesta de IA ni cambiar el código.

## Conexión del servidor

La función de servidor `krueka-studio-ai` usa OpenAI Responses con `gpt-6-luna`, fijo en el código. Los alumnos no pueden seleccionar modelos más caros ni necesitan una cuenta de OpenAI. La clave queda en los secretos del servidor, nunca en navegador, repositorio ni proyectos.

Para habilitar solicitudes deben existir `OPENAI_API_KEY` y `STUDIO_AI_ENABLED=true`. La ausencia de cualquiera mantiene generación desactivada. La conexión se habilitó y verificó con una solicitud real el 08/10/2026. Las tarifas estándar se comprobaron al activar; los límites de facturación de la cuenta se gestionan por separado.

## Consumo inicial

| Control | Valor |
|---|---|
| Presupuesto compartido | US$5 por mes calendario, zona America/Asuncion |
| Pedidos por alumno | 12 intentos al día |
| Espera entre pedidos | 10 segundos |
| Solicitudes simultáneas | Una por alumno; tres en todo el taller |
| Salida máxima por pedido | 6.000 tokens |
| Código enviado por pedido | Hasta 65.000 caracteres |
| Modelo | gpt-6-luna, sin alternativas automáticas |

El servidor reserva presupuesto antes de llamar a OpenAI y liquida con el uso informado. Si una interrupción deja costo desconocido, conserva la reserva para evitar exceder el presupuesto. Los intentos fallidos reservados también cuentan en el límite diario; los bloqueados antes de reservar no consumen pedidos.

La fórmula inicial usa US$0,10 por millón de tokens de entrada y US$0,50 por millón de salida; verificar precios vigentes al activar. Este control corresponde al Studio: otros usos de la misma clave, cambios de tarifa y cargos ajenos al Studio requieren controles de facturación propios. US$5 es un límite de uso configurado, no un cargo fijo mensual.

Las tablas privadas de contabilidad tienen RLS y no permiten acceso de alumnos ni clientes públicos. No almacenan prompts, código ni nombres. La función valida alumno y equipo antes de guardar o consultar; a OpenAI se envían instrucciones, código y mensajes recientes necesarios, sin incluir identificadores del alumno. Se rechazan patrones evidentes de datos personales antes de enviar, sin pretender detectar todos los casos.

## Cambios breves y recuperación

La IA devuelve fragmentos exactos para modificar archivos existentes, evitando copiar completo el motor 3D en cada respuesta. El servidor valida coincidencias únicas y aplica el conjunto de forma atómica; una respuesta incompleta o un fragmento ambiguo no modifica el juego. Ante pedidos amplios como «dame el mejor cambio del juego», el asistente elige una mejora pequeña y visible. Los comentarios preliminares del asistente no se interpretan como JSON: se lee el mensaje final y se unen sus fragmentos. Una negativa o una salida inválida conserva el proyecto y permite volver a escribir. Probar inicia la partida 3D y enfoca sus controles con un solo clic. No hay reintentos automáticos que generen cargos adicionales. Los errores también actualizan el contador de intentos.

## Recuperación ante errores de conexión y respuesta

Las solicitudes de IA tienen un tope de 88 segundos desde el navegador (75 segundos en el proveedor); guardar y cargar, 18 segundos. Ante un corte se desbloquea el chat y el texto queda listo para volver a enviar. La aplicación no interpreta una respuesta HTTP 200 sin `ok:true` como un éxito. El servidor devuelve 422 ante parches inválidos y protege de reemplazos completos los archivos existentes de más de 6.000 caracteres. El motor y los proyectos siguen guardables sin la IA; no hay reintentos automáticos con cobros adicionales.

## Comprobación antes de la clase

- Entrar al Club, abrir Studio y comprobar Chat junto a Tu juego.
- Guardar una idea y un borrador, salir y recuperarlos con el mismo proyecto.
- Elegir una base, personalizar reglas y probar teclado y controles táctiles.
- Abrir otro proyecto y comprobar su conversación independiente.
- Enviar al profe y revisar juego, código y conversación desde dirección/administración.
- Después de conectar la API: pedir un cambio pequeño, comprobar resultado, consumo y Deshacer. Probar también que un error conserve el código y permita reintentar el pedido.

Si se agota el cupo, se puede seguir con las bases, el editor y las ideas pendientes. Si falla una clave, la generación se pausa y se revisa la conexión sin perder el proyecto.

Documentación oficial: [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs) y [precios](https://openai.com/api/pricing/).
