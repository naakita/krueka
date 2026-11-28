# Borrado de borradores de Krueka Studio

**Mis proyectos** permite borrar un borrador propio después de una confirmación separada. Muestra la fecha del último cambio y señala el proyecto abierto para distinguir proyectos con el mismo título.

La RPC `club_studio_borrar_borrador` exige una sesión vigente de Studio, vinculada al alumno activo y su código actual, no un dispositivo recordado. Valida dentro de PostgreSQL propietario, institución, formato Studio, estado borrador y revisión que confirmó el alumno. La fila queda bloqueada durante la operación. Excluye obras en revisión o aprobadas, proyectos de otro editor, proyectos antiguos del bucket y proyectos con archivos vinculados por separado. Las versiones del borrador se eliminan mediante la relación existente con borrado en cascada. No cambia políticas, autenticación ni los permisos de acceso directo a tablas.

El cliente espera que termine cualquier escritura pendiente del proyecto activo, comprueba el resultado de la RPC y nunca lo recrea tras un borrado exitoso. El botón no borra automáticamente ningún proyecto. No se hizo una limpieza de datos en la migración.
