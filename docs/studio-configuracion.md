# Activar la IA del Studio

El taller, las bases, el editor, el guardado y la revisión funcionan sin un proveedor de IA. Para activar generación, el docente configura una cuenta de proveedor en el servidor. Los alumnos conservan su código del Club.

## Cloudflare Workers AI

1. En la cuenta del docente, abrir Workers AI → Use REST API.
2. Crear un token específico de Workers AI con permisos Read/Edit y copiar el Account ID.
3. En Supabase → proyecto Krueka → Edge Functions → Secrets, guardar `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN`.
4. El modelo inicial es `@cf/qwen/qwen2.5-coder-32b-instruct`. Opcionalmente cambiar `CLOUDFLARE_AI_MODEL` por otro modelo compatible de texto.
5. Mantener el plan gratuito si se desea que el proveedor corte al agotar la cuota en lugar de cobrar excedentes. El cupo es compartido, no por alumno.

Documentación oficial: https://developers.cloudflare.com/workers-ai/get-started/rest-api/

## Groq como alternativa

1. Crear una clave en la cuenta del docente.
2. Guardar `GROQ_API_KEY` en los secretos de Supabase. No pegar claves en el chat del alumno ni en archivos del repositorio.
3. El modelo inicial es `openai/gpt-oss-20b`. La variable opcional `GROQ_MODEL` admite otro modelo compatible con chat y JSON.
4. Comprobar las cuotas de la cuenta. Si ambos proveedores están configurados, el servidor intenta Groq cuando Cloudflare no completa la respuesta.

Documentación oficial: https://console.groq.com/docs/openai

## Comprobación antes de la clase

- Abrir el Club con el alumno de prueba y entrar al Studio.
- Abrir una base, cambiar una regla, guardar, salir y recuperar el mismo proyecto.
- En IA, pedir un cambio pequeño. Revisar el resultado y usar Deshacer si hace falta.
- Probar el juego con teclado y controles táctiles.
- Enviar al profe y revisar desde una cuenta de dirección/administración de la institución.

`status` informa configuración presente, no una prueba de validez. Un error de clave exige revisar el secreto/permisos; un error de cupo permite continuar con el editor y las bases. No usar Gemini API para esta integración dirigida a menores ni reutilizar el acceso gratuito de OpenCode fuera de OpenCode.
