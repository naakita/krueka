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
