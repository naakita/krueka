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
