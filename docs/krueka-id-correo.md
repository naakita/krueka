# Activación de Krueka ID · Correo educativo y plataformas externas

> Estado inicial (noviembre 2026): las direcciones de Krueka ID están **reservadas**, NO son buzones funcionales. No se han modificado MX/SPF/DKIM ni se ha registrado ningún menor en plataformas externas.

## Para el docente

1. Ingresar en `academia-ia.html` como docente y abrir **Krueka ID · Correos educativos**.
2. Inscribir previamente al alumno en la Academia. Acreditar y conservar por vía institucional la **autorización verificable del responsable**, sin subir documentos sensibles al repositorio.
3. Seleccionar al alumno, escribir un alias de 3 a 20 letras/números y confirmar la autorización. Krueka reserva la dirección elegida en el dominio; muestra **correo sin configurar**.
4. En **Identidades y plataformas** registrar manualmente cada solicitud. Antes de iniciar el registro verificar condiciones del proveedor, edades mínimas y autorizaciones. Para Classroom de niños, exigir la vía institucional de Google Workspace for Education o Nonprofits.
5. No introducir contraseñas externas en Krueka. Si se revoca autorización, dejar constancia en Krueka **y suspender además la cuenta desde el proveedor externo**; la primera acción no elimina la segunda automáticamente.

## Para el administrador del correo

1. Revisar los **registros MX actuales** de `krueka.com` y el proveedor de correo que utiliza el dominio. **No reemplazarlos automáticamente** ni interferir con los correos institucionales existentes.
2. Si `krueka.com` ya tiene proveedor, crear los alias/buzones bajo ese mismo servicio. Si no tiene y utiliza Cloudflare DNS, evaluar Cloudflare Email Routing (solo reenvío) o un proveedor de buzones: https://developers.cloudflare.com/email-service/get-started/route-emails/.
3. Verificar **antes** el buzón de destino administrado por adultos. Preferir reglas para direcciones concretas, no capturas globales que incluyan correspondencia ajena.
4. Enviar un correo de prueba **desde otra cuenta/dominio**, comprobar su llegada y revisar SPF/DKIM. No usar la dirección con servicios externos hasta que una prueba de recepción haya pasado.
5. Si hay incompatibilidad con MX del dominio principal, evaluar un subdominio **separado** para los alumnos; esto requiere revisar la política de generación de direcciones en el servidor antes de activarlo.
6. La función actual `academia_identity_manage` devuelve `mail_active=false` y estado `sin_configurar` deliberadamente. Una segunda fase debe integrar verificación de entrega realizada por el administrador y, en su caso, activar un estado validado. No falsear `mail_active` en la interfaz.

## Google Classroom y otros servicios

- **Un correo @krueka.com NO constituye por sí solo una cuenta Google ni da acceso a Classroom.** Para alumnos menores de 13 años, Google exige la vía adecuada de Workspace for Education o Workspace for Nonprofits. Fuente: https://support.google.com/edu/classroom/answer/7582372.
- Comprobar si la institución educativa cumple los requisitos de Workspace for Education, autorizar cuentas de alumnos y políticas de edad antes de iniciar altas. Una plataforma comercial/club independiente no califica automáticamente.
- El registro de estado en Krueka es **administrativo/manual**, no ejecuta APIs de Google, Scratch, Code.org ni Tinkercad, y no significa que la plataforma externa haya completado una inscripción.
- Nunca usar edad falsa, identidades de adultos compartidas, credenciales de terceros o mecanismos de elusión de verificaciones.
- No abrir bandejas personales de correo a menores en esta fase; el docente y la institución deben definir protección de datos, retención, supervisión y recuperaciones primero.

## Seguridad y arquitectura

- Tablas privadas con RLS activo y sin permisos directos a roles `anon` o `authenticated`: `academia_identities` y `academia_external_registry`.
- Única RPC `academia_identity_manage(text,jsonb)`, ejecutable exclusivamente desde `authenticated` y condicionada a `auth.uid()`, perfil activo `docente/admin` y propiedad de la matrícula.
- La autorización se registra con docente y fecha. No se almacenan contraseñas, códigos de terceros, documentos de identidad ni correos de responsables.
- Reservar una dirección o marcar una plataforma como «registrada manualmente» **no** significa haber creado una cuenta externa, ni garantiza recibir mensajes.
