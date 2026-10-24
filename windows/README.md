# Inicio de actividades de Krueka en computadoras del aula

**Pagina principal del alumno:** https://www.krueka.com/actividades-clase.html

Este paquete aplica ajustes **locales** para Windows 10/11. No cambia permisos de usuario, no desinstala Office, no elimina la lista de URL bloqueadas ni cambia automaticamente las maquinas remotas.

## Instalacion
1. Descargar esta carpeta (o los dos archivos `INSTALAR-COMO-ADMINISTRADOR.cmd` y `Configurar-Krueka-Alumnos.ps1` juntos).
2. En cada PC autorizada: clic derecho en `INSTALAR-COMO-ADMINISTRADOR.cmd` → **Ejecutar como administrador**.
3. Cerrar Edge y reiniciar la sesion de Windows.
4. Abrir `edge://policy` en Edge y pulsar **Recargar directivas**. Verificar URLAllowlist, RestoreOnStartup y RestoreOnStartupURLs.
5. Con un codigo de clase real, comprobar apertura de la actividad, PDF y envio de un documento. No modificar el bloqueo de Office.

## Que hace
- Permite `www.krueka.com`, `krueka.com` y **solo** el backend de Supabase usado por las actividades `janebfpnknapvntfqolf.supabase.co`.
- Permite la carga de `cdn.jsdelivr.net` (cliente de Supabase) y `challenges.cloudflare.com` (verificacion de acceso docente).
- Agrega estos sitios a `HKLM\SOFTWARE\Policies\Microsoft\Edge\URLAllowlist` **sin borrar entradas existentes ni modificar URLBlocklist**.
- Configura inicio y pagina principal de Edge con `https://www.krueka.com/actividades-clase.html`.
- Crea acceso directo en el escritorio publico y en Inicio de todos los usuarios para abrir esa pagina al ingresar en Windows.
- Respalda politicas anteriores bajo `C:\ProgramData\Krueka\Respaldo-Politicas` si ya existian.

## Advertencias y diagnostico
- El cambio en GitHub **no se instala solo** en las computadoras que ya tienen el control remoto de Krueka. Debe ejecutarse localmente o distribuirse desde el panel de administracion existente.
- Si el filtro usa directivas de dominio, MDM, otras politicas de Edge, firewall, DNS, proxy, o un agente de Krueka, se necesita actualizar **esa** fuente central; una excepcion local puede ser sobrescrita.
- Edge `RestoreOnStartupURLs` es una politica sujeta a requisitos de administracion del equipo. El acceso directo de Inicio sirve como alternativa cuando la politica no se aplica.
- No se modifica Windows Assigned Access (modo quiosco). Si la PC solo admite ciertas aplicaciones, habilitar Edge y Office tambien en su configuracion del kiosco.
- El PDF se representa en un iframe; se genera desde un blob en el navegador. Comprobar que las restricciones de descargas y la configuracion de visualizacion de PDF no lo impidan.
- El alumno escribe el codigo generado por el profesor; el codigo se valida desde el servicio de Krueka, no en el script de Windows.
- Para deshacer cambios de directivas, estudiar y restaurar el respaldo REG creado **solo tras revisar sus efectos**, y eliminar los dos accesos directos creados.

Documentacion:
- https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/urlallowlist
- https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/restoreonstartupurls

Actualizado: 21/10/2026.


## Brave: comprobación real y bloqueo de Internet (octubre de 2026)

El panel de Krueka muestra `agent_version=0.5` pero **el número de versión NO certifica que Brave esté bloqueado**. La sincronización de `aula-control` reporta estado de quiosco y modo Ofimática, pero no inspecciona las directivas ni el firewall de Brave. Por tanto, **no es posible saber desde el panel cuál PC conserva Internet en Brave**.

Para reparar únicamente una PC autorizada:

1. Guardá estos **tres archivos juntos en la misma carpeta**:
   - `Bloquear-Brave-Krueka.ps1`
   - `COMPROBAR-BRAVE.cmd`
   - `APLICAR-BLOQUEO-BRAVE-COMO-ADMIN.cmd`
2. En la PC problemática, abrí `COMPROBAR-BRAVE.cmd`. Muestra rutas detectadas, directiva y reglas de salida, **sin modificar nada**.
3. Con la cuenta del administrador de Windows, clic derecho en `APLICAR-BLOQUEO-BRAVE-COMO-ADMIN.cmd` → **Ejecutar como administrador**. Si ya fue instalada la regla, se mantiene: es idempotente.
4. Cerrá **por completo** Brave, volvé a abrirlo e intentá acceder a **una página nueva no almacenada en caché**. El resultado esperado es **sin conexión**. Si abre páginas, la reparación NO está confirmada: revisar firewall/perfil administrado, otros procesos/túneles y rutas alternativas del ejecutable.
5. Abrí Krueka desde **Microsoft Edge** y verificá que puedan verse las actividades, Word/Excel/PowerPoint y subir entregas. Abrí `COMPROBAR-BRAVE.cmd` para comprobar los cambios. Repetí únicamente en otros equipos donde también falle.

¿Qué aplica? Agrega `URLBlocklist=*` a la **clave de Brave**, preservando los valores existentes. Instala reglas explícitas de **salida bloqueada** en Firewall de Windows **solo para rutas de `brave.exe` detectadas** (instalaciones comunes por equipo, por usuario y procesos activos). No desinstala Brave, no elimina reglas de otras aplicaciones, no cambia Office, Edge, los códigos ni tokens de Krueka. Si ya existe una clave de Brave crea un respaldo `.reg` en `C:\ProgramData\Krueka\Respaldo-Politicas` antes de alterarla.

Limitaciones: se necesita ejecución local como Administrador, el firewall debe estar activo y la política local debe ser aplicada por Windows. **No se instala de forma remota desde GitHub**, tampoco reporta resultados al panel. Una copia portable de Brave no ejecutada y guardada fuera de las carpetas comunes puede requerir localizar su ruta y repetir el script con Brave abierto; GPO/MDM pueden prevalecer. Una pestaña en caché no es prueba de conectividad. No se debe presentar el estado de las 8 PCs como verificado si no se probó localmente. El programa no sustituye el control de permisos de una cuenta de alumno sin privilegios de administrador.

Referencias técnicas: [Directivas Brave](https://support.brave.app/hc/en-us/articles/360039248271-Group-Policy) y [Firewall Windows](https://learn.microsoft.com/en-us/powershell/module/netsecurity/new-netfirewallrule).


## Seguridad de sesiones: impedir evasión al cambiar de usuario (21/10/2026)

**Problema:** Assigned Access/Quiosco de Windows se configura para una cuenta o grupo. Cerrar sesión e iniciar otra cuenta sin estas restricciones evade el bloqueo; ocultar «Cambiar usuario» por sí solo NO impide iniciar otra sesión. El modo quiosco web de `js/kiosco.js` es cliente y tampoco es una barrera de Windows.

**Herramientas nuevas:**

- `Blindar-Sesiones-Krueka.ps1` (modo `Comprobar` por defecto y `Aplicar` explícito).
- `COMPROBAR-SESIONES-KRUEKA.cmd` (diagnóstico sin cambios).
- `APLICAR-SEGURIDAD-SESIONES-COMO-ADMIN.cmd` (requiere administrador de Windows).
- `Bloquear-Brave-Krueka.ps1` (debe permanecer **en la misma carpeta**).

**Orden recomendado en una sola PC piloto antes de distribuir a las 8:**

1. Confirmar que el profesor conserve acceso a **una cuenta administradora con contraseña privada** (no conocida por alumnos). El script **no crea, borra, deshabilita cuentas ni cambia contraseñas**, tampoco elimina quioscos existentes. Anotar el nombre de la cuenta estándar usada por los alumnos y las cuentas sobrantes. No compartir credenciales de administración.
2. Abrir `COMPROBAR-SESIONES-KRUEKA.cmd`: ver lista de cuentas locales habilitadas, cuáles son administradoras, configuración de inicio automático, políticas de Edge/Chrome y reglas de navegadores alternativos.
3. Si se dispone de la cuenta administradora, clic derecho en `APLICAR-SEGURIDAD-SESIONES-COMO-ADMIN.cmd` → **Ejecutar como administrador**. Respaldará políticas de sistema, Edge y Chrome en `C:\ProgramData\Krueka\Respaldo-Politicas` antes de modificarlas.
4. Aplica **HKLM** `HideFastUserSwitching=1` y URLBlocklist `*` + URLAllowlist para los seis patrones necesarios en **Edge y Chrome para todas las cuentas**. Conserva las URL previas autorizadas: el administrador debe revisar excepciones anteriores para que no permitan sitios no deseados. Aplica el bloqueo del script de Brave por políticas y firewall, y reglas por ruta detectada para Firefox, Opera y Vivaldi (incluye navegadores en perfiles locales y procesos activos). No desinstala programas, no altera Office ni el agente ni desbloquea Internet.
5. Reiniciar Windows, abrir Edge y comprobar que las actividades y PDF de Krueka carguen y se puedan entregar archivos. Comprobar que Edge/Chrome rechazan webs no autorizadas y Brave y demás navegadores detectados no puedan abrir una página **nueva, no cacheada**.
6. **Cerrar sesión e iniciar otra cuenta estándar** que siga habilitada: repetir las pruebas. Si hay una cuenta admin conocida por alumnos, otras cuentas sobrantes habilitadas, navegador portable no detectado, Windows Home sin AppLocker, GPO/MDM contradictoria o firewall apagado, **no declarar protegido el equipo**. En `Configuración > Cuentas > Otros usuarios`, administrar cuentas sobrantes de forma individual y planificada (sin borrar datos de alumnos). Para protección realmente resistente a apps portables, aplicar un perfil multi-app de **Assigned Access** a todas las cuentas/grupo de alumnos, con solo Edge y Office como apps permitidas, en ediciones compatibles Pro/Education/Enterprise; o usar AppLocker/WDAC en una edición compatible.
7. Repetir en otras PCs **solo tras validar** que el profesor pueda entrar como administrador y que Word, Excel, PowerPoint, Krueka, actividad PDF y las entregas funcionan.

**Limitaciones importantes:** las políticas de navegador aplicadas a toda la máquina también afectan a la navegación de cuentas de profesor/admin hasta que éste las cambie con sus credenciales. Ocultar cambio rápido no impide cerrar sesión. Un alumno con credenciales de administrador, con arranque externo sin protección o con aplicaciones portables no controladas aún puede saltar medidas. Revisar firmware/arranque y BitLocker según la política del centro; no aplicar cambios automatizados de BIOS, usuarios ni cifrado sin intervención. Se requiere instalación **local** en Windows; publicar código en GitHub no ejecuta comandos en las PCs ni confirma cambios remotamente en Krueka.

Guías oficiales: https://learn.microsoft.com/windows/configuration/kiosk/ y https://learn.microsoft.com/en-us/windows/client-management/mdm/policy-csp-windowslogon


## PC 02 BEI: Office autorizado pero sin confirmación (22/10/2026)

**Hallazgo:** la PC02 tiene `desktop_mode=office` y `desktop_mode_observed=null`; su último contacto con Supabase fue el 21/10/2026 a las 08:06 de Paraguay. El panel recibió nuevas solicitudes de Office el 22/10, pero ninguna ha sido confirmada por el agente porque no ha sincronizado. En otras PCs el agente 0.5 sí informó `desktop_mode_observed=office`. La versión del agente, por sí sola, no prueba que Office esté habilitado.

### Diagnóstico y recuperación segura

1. En **la PC02**, con un administrador responsable presente, copiar juntos `Diagnosticar-Office-Krueka.ps1`, `COMPROBAR-OFFICE-KRUEKA.cmd` y `REINICIAR-AGENTE-KRUEKA-ADMIN.cmd`.
2. Ejecutar `COMPROBAR-OFFICE-KRUEKA.cmd`. El modo predeterminado `Comprobar` es de solo lectura. Busca servicios/tareas Krueka (sin mostrar tokens ni contraseñas), detecta rutas habituales de Word, Excel y PowerPoint, prueba HTTPS al backend, consulta `Get-AssignedAccess` cuando está disponible y muestra errores recientes de quiosco Windows.
3. Si existe un servicio/tarea **identificado expresamente como Krueka**, cerrar documentos abiertos y ejecutar `REINICIAR-AGENTE-KRUEKA-ADMIN.cmd` con clic derecho → **Ejecutar como administrador**. Solamente reinicia esos servicios/tareas identificados; no desinstala componentes ni crea tokens nuevos. Si no detecta ninguno, localizar el instalador original del agente y su configuración; no reinstalar a ciegas ni volver a registrar el equipo.
4. Desde el panel del docente, pulsar **Actualizar** y esperar a ver **PC: Ofimática** junto con **Conectada**. Si sigue sin contacto, comprobar la conexión HTTPS, estado de tareas y credenciales de servicio local. Si ya está conectada pero Office no funciona, revisar en Windows (cuenta administradora) si el alumno tiene quiosco **de una sola aplicación Edge**, que no permite iniciar aplicaciones Word, Excel o PowerPoint. Para Office debe usarse una **experiencia restringida multiaplicación** de Assigned Access compatible con la edición Windows, y conceder explícitamente las aplicaciones de Office y Edge; no quitar todas las restricciones del equipo.
5. Verificar con la cuenta estándar del alumno: abrir Word, Excel, PowerPoint y Krueka, completar una actividad y cargar el archivo. Probar que Brave u otros navegadores no puedan salir a Internet sin permiso. Conservar cuenta administradora de rescate.

**Precaución:** el programa de la PC podría usar un nombre de servicio/tarea distinto a «Krueka». Si no se detecta, el resultado es **inconcluso**, no una confirmación de desinstalación. Los scripts no reescriben la configuración del quiosco, no cambian los permisos del sistema ni pueden ejecutar reparaciones remotas por sí solos. No prometer que el problema esté resuelto hasta observar una sincronización nueva con `desktop_mode_observed=office` y una prueba real con el usuario del alumno.

Documentación oficial de Windows: https://learn.microsoft.com/en-us/windows/configuration/kiosk/


## Autorizaciones educativas de BEI: EdClub y Code.org — 24/10/2026

El docente autorizó para las 8 PCs registradas de BEI:
- **Mecanografía:** `https://betesda-educacion.edclub.com/` y todas sus rutas. EdClub requiere además subdominios de `edclub.com`, `edclub.dev`, `edclub.app`, `typingclub.com`, `static.typingclub.com` y Google Fonts.
- **Programación:** `https://studio.code.org/` y rutas, subdominios `code.org`, vídeos propios `videos.code.org` y `contentful-videos.code.org`, herramientas Web Lab y Python Lab (`codeprojects.org`, `codeaiprojects.org`, `downloads.computinginthecore.org`) y simulación en Pusher cuando se use. Se restringe `www.google.com` a `/recaptcha/` en las directivas locales, sin permitir búsquedas de Google.
- No se autoriza YouTube general; Code.org ofrece reproductor propio de respaldo. Algunas actividades que requieran integración externa opcional podrían necesitar excepciones adicionales tras prueba supervisada.

**Estado:** la actualización de `aula_devices.allowed` ya quedó registrada en Supabase para las ocho PCs BEI, conservando las autorizaciones previas. El agente solicita la lista en su próxima sincronización, pero Krueka no recibe un reporte de carga de cada URL. Una PC offline seguirá con permisos antiguos hasta reconectar.

**Para comprobar o aplicar localmente en Windows:**
1. Guardá juntos `Autorizar-EdClub-CodeOrg-Krueka.ps1`, `COMPROBAR-PAGINAS-EDUCATIVAS.cmd` y `AUTORIZAR-PAGINAS-EDUCATIVAS-ADMIN.cmd`.
2. Primero ejecutá el CMD de comprobación, que solo lee el registro de Edge y Chrome.
3. Solo si faltan entradas o las bloquea otra directiva, ejecutá `AUTORIZAR-PAGINAS-EDUCATIVAS-ADMIN.cmd` como administrador. Agrega las excepciones HKLM y crea respaldo de las políticas existentes; **no** modifica `URLBlocklist`, quiosco, usuarios, Office ni firewall.
4. En el perfil del alumno, cerrá/reabrí Edge, visitá `edge://policy` y pulsá Recargar directivas. Después probá **una lección real** de cada plataforma: abrir una lección posterior, imágenes, fuentes y avance de nivel; Code.org video y Blockly.
5. Si el agente o una directiva de dominio/MDM vuelve a imponer otra lista, la fuente central deberá incluir estos permisos. Las políticas `Configurar-Krueka-Alumnos.ps1` y `Blindar-Sesiones-Krueka.ps1` ya los incorporan para futuras instalaciones.

**Nota técnica:** según Microsoft Edge, en `URLAllowlist` el patrón `https://code.org` cubre las rutas y subdominios del host sin punto inicial, igual que `https://edclub.com`. `https://www.google.com/recaptcha/` solo exceptúa ese prefijo de rutas. Los servidores del agente reciben dominios exactos de Supabase, por lo que las rutas de clase quedan incluidas y subdominios nuevos no registrados aún requieren verificación.

Referencias:
- https://school.edclub.com/help/user-guide/introduction/technical-requirements.html
- https://code.org/en-US/about/it-requirements
- https://learn.microsoft.com/en-us/deployedge/edge-learnmmore-url-list-filter-format


## Sincronización permanente de permisos web — 24/10/2026

**Objetivo:** el docente autoriza o quita dominios desde el panel de Krueka; Windows actualiza las políticas administradas de Edge y Chrome automáticamente sin repetir un instalador por cada cambio. El agente `KruekaAula.exe` 0.5 actual informa la lista deseada, pero no confirma que Windows haya aplicado `URLAllowlist`/`URLBlocklist`. Esta integración usa un sincronizador de políticas separado de su ejecutable original para no interrumpir Office/quiosco.

### Una sola instalación por PC

1. Entrar a `https://www.krueka.com/app.html` con cuenta docente o administración y abrir **Control de computadoras**.
2. Para la PC correspondiente, pulsar **Instalar sincronizador web**; el panel genera **una credencial diferente del token del agente principal**. Los datos se muestran una vez. Guardarlos fuera del alcance de alumnos y nunca enviarlos en capturas o chats.
3. Descargar `Krueka-PolicySync.ps1` e `INSTALAR-SINCRONIZACION-WEB-ADMIN.cmd` desde la carpeta `windows` y mantener ambos en la misma carpeta local. En esa PC, ejecutar el CMD haciendo clic derecho → **Ejecutar como administrador**. Introducir el ID y la credencial al ser solicitados. La credencial no figura en parámetros del proceso ni en la tarea programada; queda cifrada mediante DPAPI de la máquina y resguardada por ACL para SYSTEM y administradores en `C:\ProgramData\Krueka\PolicySync`.
4. La instalación crea la tarea de Windows `Krueka-PolicySync`, que se ejecuta como **SYSTEM cada minuto**, sin exigir que el alumno inicie sesión ni que el profesor abra el navegador. La primera ejecución se solicita de inmediato. No se modifican credenciales del agente anterior, cuentas de Windows, Assigned Access/quiosco, Office ni el firewall.
5. En el panel, presionar **Actualizar** y comprobar la línea **Sincronización de páginas: Permisos aplicados en Windows · Versión N/N**. La confirmación significa que la tarea validó las entradas del Registro; no es un test de apertura real. Ejecutar `COMPROBAR-SINCRONIZACION-WEB.cmd` (o `Krueka-PolicySync.ps1 -Mode Status`) en Windows con cuenta administradora para ver fecha/versión y errores. Si el equipo está desconectado el último estado se conserva y se reintenta al recuperar Internet.

### Cambios diarios desde el profesor

- **+ Autorizar web / Quitar** en cada PC: solo modifica esa computadora.
- **Autorizar página a todas las PCs** y **Quitar página de todas**: actualiza los equipos de la institución con una operación administrativa; el servidor incrementa la versión de permisos donde hay cambios.
- **Restringir Internet en todas** y **Liberar Internet en todas**: afectan el bloqueo general de las PCs; usar liberar solo cuando esté realmente autorizado. El sistema no altera automáticamente los valores actuales de `enabled`.
- El sincronizador consulta `aula-control` por `policy_pull` y aplica listas limpias de dominios en `HKLM:\SOFTWARE\Policies\Microsoft\Edge\URLAllowlist` y `...\Google\Chrome\URLAllowlist`. Con navegación restringida instala `URLBlocklist=['*']`. Con navegación liberada retira las entradas de `URLBlocklist`. Incluye Krueka, Supabase, el acceso local `127.0.0.1:47821` y `www.google.com/recaptcha/`. **El servidor es la fuente de verdad**: revocar un dominio elimina las excepciones antiguas previamente instaladas por scripts.
- Antes de cualquier escritura crea copias de seguridad `.reg` en `C:\ProgramData\Krueka\PolicySync\Backups`. Si el servidor no responde o envía una política inválida, conserva la última configuración local y reintenta en el ciclo siguiente.
- `policy_report` comunica versión aplicada, hora y error acotado. El panel diferencia **sin instalar**, **desconectado**, **pendiente**, **con error** y **registrado por Windows**. El secreto de sincronización nunca se muestra en los estados ni se incorpora al repositorio.

### Seguridad y límites

- El sincronizador de Windows debe instalarse **una sola vez por PC** con permisos de administrador. No se puede hacerlo de forma remota mediante el repositorio web porque el antiguo agente no implementa ejecución remota de instaladores. No rotar su token actual.
- Las directivas de Edge/Chrome admiten actualización dinámica, aunque una directiva de dominio/MDM puede sobreponerse. Para diagnóstico, consultar `edge://policy` → **Recargar directivas** y probar una lección real.
- La sincronización **solo gestiona Edge y Chrome**. Brave permanece sometido a los controles específicos establecidos por el administrador (por ejemplo, bloqueo por firewall). No elimina esas reglas ni intenta abrir Brave.
- Un alumno con contraseñas de administrador, otro navegador portable o arranque externo todavía puede eludir protecciones si Windows no tiene control de aplicaciones y cuentas correcto; continuar con Assigned Access multiapp y cuentas estándar.
- Cambiar la **clave del sincronizador** desde el panel invalida exclusivamente esa credencial (NO el token del agente original) y requiere volver a introducir la nueva clave en esa PC una vez; no hacerlo para cambios cotidianos de páginas.
- La sincronización de sitios no cambia el modo Office ni repara agentes desconectados. Si una PC no logra comunicarse con el servidor, seguirá aplicando su última política conocida. No declarar protegidas todas las PCs sin comprobarlas localmente.
