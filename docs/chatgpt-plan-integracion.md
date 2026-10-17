# Integración de ChatGPT en Krueka: requisitos oficiales

Fecha: octubre de 2026.

## Qué permite OpenCode

La función oficial Sign in with ChatGPT permite a ciertas aplicaciones y herramientas de código abierto utilizar cuota elegible del titular de ChatGPT mediante permisos OAuth, sin proporcionar una clave personal de API. OpenCode es una herramienta compatible. El plan NO garantiza uso ilimitado y la API facturada por separado sigue teniendo su propio saldo y límite.

## Restricciones aplicables a Krueka

Krueka es una aplicación web alojada remotamente. Para aplicaciones alojadas, OpenAI indica que debe solicitarse la habilitación del programa SIWC; el flujo dinámico de registro para open source cubre los casos locales/autoalojados. La condición de proyecto gratuito o con repositorio público no autoriza a utilizar las credenciales de otro software.

Se prohíbe compartir, agrupar, transferir o reutilizar el token o la suscripción del profesor para ejecutar solicitudes de los estudiantes. Cada titular elegible necesita consentir el uso de su propia cuenta; la cuenta personal de ChatGPT no se puede poner a disposición de diez alumnos.

Fuentes:
- https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites
- https://developers.openai.com/siwc/quickstart
- https://developers.openai.com/siwc/token-sharing-open-source
- https://openai.com/policies/sign-in-with-chatgpt-terms/
- https://openai.com/es-419/form/sign-in-with-chatgpt-interest/
- https://openai.com/es-419/policies/terms-of-use/

## Plan de implementación cuando OpenAI autorice el producto

1. Obtener la autorización para el producto Krueka, la modalidad web alojada, client ID y callback; confirmar qué condiciones de uso/almacenamiento de tokens serán válidas.
2. Implementar OAuth2/OIDC con PKCE, state, nonce, validación criptográfica JWKS de ID token y scopes de identidad e inferencia separados. Almacenar credenciales SIWC únicamente como permitan los términos; jamás en HTML público ni compartidas entre estudiantes.
3. Aplicar autorización, sesiones y cuotas por titular, nunca a través del plan del profesor cuando la solicitud provenga de otra persona. Conservar el aislamiento de los proyectos de Krueka por alumno.
4. Añadir la opción elegible de conexión al Studio únicamente después de tener una autorización funcional. No mostrar falsos botones ni declarar un proveedor activo sin haberlo probado.
5. Para 13-17 años, revisar consentimiento de tutor y acuerdos aplicables. Para menores de 13 años no crear cuentas personales de ChatGPT; explorar acceso institucional supervisado y/o continuar con el modo local sin IA.
6. Mantener como alternativa separada la API actual de Studio, con sus costos y límites reales. Validar parches de cambios antes de aplicarlos y comprobar historial/guardado individuales.

## Trabajo ya preparado

- Página de estado pública sin indexar: chatgpt-integracion.html. Explica qué falta y contiene el texto de solicitud para copiar.
- No se agregó ninguna autenticación, token, clave, límite ni API nuevos. No se alteró la experiencia actual de los alumnos.
- Estado real: aún no hay client ID de Krueka ni aprobación oficial para uso de plan desde el sitio web.

La presentación de la solicitud debe realizarla quien representa a Krueka. No puede asegurarse su aprobación o plazo.