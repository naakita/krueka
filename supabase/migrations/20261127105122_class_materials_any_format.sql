-- Los materiales docentes de cualquier formato se conservan como archivos
-- descargables; sólo los formatos reconocidos reciben un MIME de vista previa.
-- Conserva el bucket privado, el tamaño máximo y todos los tipos existentes.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/octet-stream')
where id = 'krueka-actividades-clase'
  and allowed_mime_types is not null
  and not ('application/octet-stream' = any(allowed_mime_types));
