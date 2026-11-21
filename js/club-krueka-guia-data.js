/* Rutas originales del Club Krueka. Instrucciones de práctica; referencias oficiales enlazadas. */
(function(){'use strict';
const references={
 scratch:'https://scratch.mit.edu/help/studio/tips/home/',
 scratchIdeas:'https://scratch.mit.edu/help/starter_projects/',
 scratchEditor:'https://scratch.mit.edu/projects/editor/',
 roblox:'https://create.roblox.com/docs/tutorials/curriculums/studio',
 robloxBuild:'https://create.roblox.com/docs/tutorials/curriculums/building',
 robloxScript:'https://create.roblox.com/docs/scripting',
 robloxRemote:'https://create.roblox.com/docs/scripting/events/remote',
 robloxData:'https://create.roblox.com/docs/cloud-services/data-stores'
};
function lesson(id,title,goal,steps,code,check,challenge,tip,reference){return {id,title,goal,steps,code,check,challenge,tip,reference};}
const scratch={id:'scratch',name:'Scratch',icon:'🐱',subtitle:'Imaginá, programá y compartí juegos 2D',age:'Sugerido: Exploradores 7–11 y Juniors',tool:'Funciona en el navegador. No requiere instalar Scratch.',action:'Abrir editor de Scratch',actionUrl:references.scratchEditor,
 levels:[
 {id:'s1',name:'1 · Primeros pasos',detail:'Conocé el escenario y hacé que algo se mueva.',lessons:[
 lesson('s01','Tu primer proyecto','Entender escenario, objeto y bandera verde.',[
 'Entrá al editor de Scratch y elegí Crear. Identificá el escenario blanco, el gato y las categorías de bloques.',
 'En Eventos, arrastrá «al hacer clic en la bandera verde» al área de código.',
 'En Movimiento, encajá debajo «mover (10) pasos». Cambiá 10 por 30.',
 'Pulsá la bandera verde tres veces y observá cómo avanza el gato.',
 'Cambiale el nombre al proyecto por «Mi primer movimiento» en la parte superior.'
 ],'al hacer clic en bandera verde\nmover (30) pasos','El gato se desplaza 30 pasos cada vez que pulsás la bandera.','Agregá «girar (15) grados» después de mover y observá qué cambia.','Si no se mueve, comprobá que los dos bloques estén encajados y que seleccionaste el gato.','scratch'),
 lesson('s02','Coordenadas y direcciones','Ubicar un personaje con X, Y y giros.',[
 'Elegí el gato. En Movimiento, buscá «ir a x: (0) y: (0)» y colocá ese bloque después de la bandera verde.',
 'Agregá «apuntar en dirección (90)» y «mover (50) pasos». Pulsá la bandera.',
 'Cambiá la dirección a 0 y repetí. Después probá -90 y 180.',
 'En el panel del personaje, mirá cómo cambian los valores X e Y.',
 'Dejá el gato en x: 0, y: 0 y explicá qué dirección apunta a la derecha.'
 ],'al hacer clic en bandera verde\nir a x: (0) y: (0)\napuntar en dirección (90)\nmover (50) pasos','Con 90 se mueve hacia la derecha; con 0, hacia arriba.','Creá cuatro bloques seguidos que formen un recorrido en cuadrado.','X cambia horizontalmente y Y verticalmente; los giros no cambian la posición por sí solos.','scratch'),
 lesson('s03','Personajes, disfraces y fondos','Diseñar un mundo de dos personajes.',[
 'Hacé clic en Elegir un objeto y agregá un segundo personaje.',
 'Seleccioná el escenario y elegí un fondo de la biblioteca.',
 'En Disfraces del primer objeto, elegí o dibujá dos expresiones distintas.',
 'Programá en Apariencia «siguiente disfraz» después de la bandera verde.',
 'Renombrá los personajes «Héroe» y «Amigo» y dejalos en lugares distintos.'
 ],'al hacer clic en bandera verde\nsiguiente disfraz\ndecir [¡Hola!] por (2) segundos','Aparecen dos objetos, un fondo y un cambio visible de disfraz.','Dibujá un disfraz de sorpresa y hacé que aparezca después de un mensaje.','El código se agrega al objeto seleccionado; un objeto no controla automáticamente a los demás.','scratch'),
 lesson('s04','Eventos y diálogos','Crear una escena que responda al usuario.',[
 'En el Héroe, agregá «al hacer clic en este objeto» desde Eventos.',
 'Conectá «decir [¡Empecemos!] por (2) segundos».',
 'En el Amigo, creá un guion con «al presionar tecla [espacio]».',
 'Debajo colocá «decir [Te estaba esperando] por (2) segundos».',
 'Probá hacer clic en el Héroe y después presionar espacio.'
 ],'al hacer clic en este objeto\ndecir [¡Empecemos!] por (2) segundos\n\nal presionar tecla [espacio]\ndecir [Te esperaba] por (2) segundos','Cada acción produce una respuesta distinta.','Agregá un sonido al hacer clic y cambiá el tiempo de los diálogos.','Asegurate de tener un guion para cada objeto y de probar la escena con la bandera verde.','scratch')
 ]},
 {id:'s2',name:'2 · Juegos iniciales',detail:'Controles, monedas, puntaje y tiempo.',lessons:[
 lesson('s05','Controlá al protagonista','Mover al personaje con las flechas.',[
 'Creá un proyecto nuevo con Héroe y un fondo de juego.',
 'En Eventos agregá «al presionar tecla [flecha derecha]» y debajo «cambiar x por (10)».',
 'Duplicá el guion y elegí flecha izquierda; cambiá el valor por -10.',
 'Creá dos guiones más: flecha arriba con «cambiar y por (10)» y flecha abajo con -10.',
 'Probá las cuatro flechas y aumentá o disminuí la velocidad.'
 ],'al presionar tecla [flecha derecha]\ncambiar x por (10)\n\nal presionar tecla [flecha izquierda]\ncambiar x por (-10)','El héroe puede moverse en cuatro direcciones.','Agregá «si toca un borde, rebotar» y compará su comportamiento.','Cada tecla tiene su propio evento; no uses «mover pasos» para las cuatro direcciones si no ajustás la orientación.','scratch'),
 lesson('s06','Atrapá una moneda','Detectar contacto entre objetos.',[
 'Agregá un objeto llamado Moneda y ponelo en una esquina.',
 'En Moneda, creá «al hacer clic en bandera verde» y «por siempre».',
 'Dentro del bucle colocá «si <tocando [Héroe]?> entonces».',
 'Dentro del si, agregá «ir a posición aleatoria» y «esperar (0.2) segundos».',
 'Mové el héroe hasta la moneda varias veces.'
 ],'al hacer clic en bandera verde\npor siempre\n  si <tocando [Héroe]?> entonces\n    ir a posición aleatoria\n    esperar (0.2) segundos','La moneda aparece en otra posición cuando el héroe la toca.','Agregá un sonido breve al recogerla.','Si la moneda desaparece demasiado rápido, agregá la espera para evitar varios contactos seguidos.','scratchIdeas'),
 lesson('s07','Puntos y meta','Construir un contador que gane al llegar a cinco.',[
 'En Variables, creá una variable «Puntos» para todos los objetos.',
 'En un guion de bandera verde, poné «fijar [Puntos] a (0)».',
 'En la Moneda, dentro del «si tocando Héroe», agregá «cambiar [Puntos] por (1)».',
 'Después de sumar, agregá «si <(Puntos) = (5)> entonces» y «decir [¡Ganaste!] por (2) segundos».',
 'Probá desde cero y comprobá que el juego anuncia la meta.'
 ],'al hacer clic en bandera verde\nfijar [Puntos] a (0)\n\nsi <tocando [Héroe]?> entonces\n  cambiar [Puntos] por (1)\n  si <(Puntos) = (5)> entonces\n    decir [¡Ganaste!] por (2) segundos','El marcador comienza en 0 y muestra la victoria al sumar cinco.','Cambiá la meta a 10 y agregá una segunda clase de moneda que valga dos puntos.','Usá «=» con cuidado: si algunos premios suman 2, puede convenir «Puntos > 4».','scratchIdeas'),
 lesson('s08','Carrera contra el reloj','Agregar un límite de tiempo y final del juego.',[
 'En Variables, creá «Tiempo». Al iniciar fijá Tiempo a 30 y Puntos a 0.',
 'En un guion aparte, después de la bandera verde, poné «repetir (30)».',
 'Dentro: «esperar (1) segundos» y «cambiar [Tiempo] por (-1)».',
 'Cuando termine el repetir, agregá «enviar [Fin]»; creá ese mensaje en Eventos.',
 'En el Héroe, usá «al recibir [Fin]» → «decir [Se acabó el tiempo]» → «detener [todos]».'
 ],'al hacer clic en bandera verde\nfijar [Tiempo] a (30)\nrepetir (30)\n  esperar (1) segundos\n  cambiar [Tiempo] por (-1)\nenviar [Fin]','La cuenta baja a cero y todos los guiones terminan.','Mostrá «¡Ganaste!» solo si Puntos es mayor o igual a 5 al terminar.','Un contador con esperar es aproximado; probalo con cronómetro y revisá si otro guion detiene el juego antes.','scratch')
 ]},
 {id:'s3',name:'3 · Lógica y comunicación',detail:'Condiciones, mensajes y estados del juego.',lessons:[
 lesson('s09','Decisiones con condiciones','Usar si, si no y comparaciones.',[
 'Creá la variable «Vida» y fijala a 3 al comenzar.',
 'Colocá un enemigo sencillo. Cuando toque al Héroe, restá 1 a Vida y esperá 1 segundo.',
 'Usá «si <(Vida) < (1)> entonces» y dentro «enviar [Perder]».',
 'Creá «al recibir [Perder]» con un mensaje de derrota y «detener todos».',
 'Probá que se pierda exactamente después de tres impactos.'
 ],'si <tocando [Enemigo]?> entonces\n  cambiar [Vida] por (-1)\n  esperar (1) segundos\n  si <(Vida) < (1)> entonces\n    enviar [Perder]','Tres golpes producen derrota; antes de eso se puede continuar.','Agregá una poción que recupere una vida sin superar 3.','El tiempo de espera evita que un contacto reste muchas vidas por segundo.','scratch'),
 lesson('s10','Mensajes entre personajes','Sincronizar una escena con «enviar».',[
 'Creá un Héroe, un Guardián y dos fondos llamados Bosque y Castillo.',
 'En Héroe, cuando toque al Guardián, ejecutá «enviar [Abrir puerta]».',
 'En el Escenario, hacé «al recibir [Abrir puerta]» → «cambiar fondo a [Castillo]».',
 'En Guardián, hacé «al recibir [Abrir puerta]» → «decir [Adelante] por (2) segundos».',
 'Probá que las dos reacciones ocurran con un solo contacto.'
 ],'si <tocando [Guardián]?> entonces\n  enviar [Abrir puerta]\n\nal recibir [Abrir puerta]\ncambiar fondo a [Castillo]','El fondo y el diálogo responden a un mismo mensaje.','Después de recibir el mensaje, cambiá la posición del héroe al centro del castillo.','El mensaje debe tener el mismo nombre en todos los guiones.','scratch'),
 lesson('s11','Bucles inteligentes','Repetir movimientos hasta cumplir una condición.',[
 'Seleccioná un enemigo y fijá su posición inicial en x: -200, y: 0.',
 'Agregá «repetir hasta que <tocando borde?>».',
 'Dentro colocá «mover (5) pasos» y «esperar (0.05) segundos».',
 'Al terminar, agregá «apuntar en dirección (-90)» y otro recorrido hacia el borde contrario.',
 'Probá distintas velocidades sin que salga del escenario.'
 ],'al hacer clic en bandera verde\nir a x: (-200) y: (0)\napuntar en dirección (90)\nrepetir hasta que <tocando borde?>\n  mover (5) pasos','El enemigo se mueve solo hasta el borde.','Transformá el recorrido en una patrulla de ida y vuelta.','Un bucle sin espera puede verse muy rápido; usá pausas pequeñas para observarlo.','scratch'),
 lesson('s12','Estados del videojuego','Separar menú, jugando, victoria y derrota.',[
 'Creá la variable «Estado» con los valores 0=menú, 1=jugando, 2=ganó y 3=perdió.',
 'Al presionar bandera verde fijá Estado a 0 y mostrá «Pulsa espacio».',
 'Al presionar espacio fijá Estado a 1 y enviá el mensaje [Inicio].',
 'En los guiones de mover y sumar puntos, agregá la condición «si <Estado = 1>».',
 'Al ganar fijá Estado a 2; al perder fijá Estado a 3. Probá que el héroe se quede quieto fuera de partida.'
 ],'al hacer clic en bandera verde\nfijar [Estado] a (0)\nal presionar tecla [espacio]\nfijar [Estado] a (1)\nenviar [Inicio]','Los controles funcionan solo durante la partida.','Dibujá un botón de Reiniciar que devuelva Estado a 0.','Si los controles siguen activos en el menú, revisá dónde colocaste la condición Estado=1.','scratch')
 ]},
 {id:'s4',name:'4 · Mundos y niveles',detail:'Laberintos, plataformas e historias interactivas.',lessons:[
 lesson('s13','Laberinto con paredes','Programar choques y un objetivo final.',[
 'Dibujá un fondo con caminos blancos y paredes negras, y añadí un objeto Meta.',
 'Colocá el héroe en el inicio y programá movimiento con las flechas.',
 'Después de cada movimiento, usá «si <tocando color [negro]?> entonces» para deshacer ese paso.',
 'En un bucle por siempre comprobá «tocando [Meta]»; si ocurre enviá [Ganaste].',
 'Probá que no pueda atravesar una pared desde ninguna dirección.'
 ],'al presionar tecla [flecha derecha]\ncambiar x por (5)\nsi <tocando color [negro]?> entonces\n  cambiar x por (-5)','El héroe avanza por pasillos, rebota contra paredes y llega a la meta.','Agregá una llave necesaria para abrir la salida.','Al deshacer un movimiento, usá el mismo número con signo contrario.','scratchIdeas'),
 lesson('s14','Plataformas y gravedad','Crear saltos que suben y bajan.',[
 'Dibujá suelo y plataformas de un solo color. Creá «VelocidadY».',
 'Al iniciar fijá VelocidadY a 0, luego ejecutá un bucle por siempre.',
 'Dentro del bucle restá 1 a VelocidadY y cambiá y por VelocidadY.',
 'Si el héroe toca el suelo y VelocidadY es negativo, fijá VelocidadY a 0 y corregí su posición hasta quedar encima.',
 'Al presionar espacio, si el héroe toca suelo, fijá VelocidadY a 14. Probá el salto.'
 ],'por siempre\n  cambiar [VelocidadY] por (-1)\n  cambiar y por (VelocidadY)\n  si <tocando color [suelo]?> entonces\n    fijar [VelocidadY] a (0)\n\nal presionar tecla [espacio]\nsi <tocando color [suelo]?> entonces\n  fijar [VelocidadY] a (14)','El personaje salta y vuelve a caer; el piso lo detiene.','Agregá una plataforma elevada y ajustá la altura del salto.','La detección por color depende de los colores exactos. Si se hunde, corregí su y por pequeños pasos al tocar suelo.','scratchIdeas'),
 lesson('s15','Cambiar de nivel','Hacer dos escenarios con dificultad distinta.',[
 'Prepará dos fondos: Nivel1 y Nivel2. Creá la variable «Nivel» y fijala a 1 al comenzar.',
 'Cuando el héroe toque Meta, sumá 1 a Nivel y enviá [Nivel cambiado].',
 'En el escenario, al recibir el mensaje, usá si Nivel = 2 para cambiar al fondo Nivel2.',
 'Colocá la Meta en otra posición y mové el héroe al inicio del segundo nivel.',
 'Detené el juego con una pantalla de victoria cuando Nivel llegue a 3.'
 ],'si <tocando [Meta]?> entonces\n  cambiar [Nivel] por (1)\n  enviar [Nivel cambiado]','Se puede pasar de un nivel a otro y terminar al superar el último.','Añadí un tercer nivel con menos tiempo o más obstáculos.','El objeto Meta debe detectar una sola vez el contacto; usá espera o cambiá de nivel antes de repetir.','scratch'),
 lesson('s16','Historia interactiva','Permitir que una elección cambie el final.',[
 'Creá dos personajes y dos fondos de final diferente.',
 'Mostrá una pregunta con «preguntar [¿Bosque o mar?] y esperar».',
 'Guardá «respuesta» en una variable llamada Elección o comparala directamente.',
 'Si la respuesta es «bosque», cambiá al fondo Bosque; si no, al fondo Mar.',
 'Agregá dos diálogos distintos y comprobá que elegir otro camino cambia la historia.'
 ],'preguntar [¿Bosque o mar?] y esperar\nsi <(respuesta) = [bosque]> entonces\n  cambiar fondo a [Bosque]\nsi no\n  cambiar fondo a [Mar]','Las dos respuestas muestran escenarios diferentes.','Creá tres decisiones seguidas y diseñá cuatro finales posibles.','Avisá al jugador qué respuestas son válidas; considerá mayúsculas y espacios.','scratch')
 ]},
 {id:'s5',name:'5 · Programación avanzada',detail:'Clones, listas, bloques propios y físicas.',lessons:[
 lesson('s17','Clones que caen','Generar objetos sin duplicar personajes manualmente.',[
 'Creá un objeto Estrella y ocultá el original al comenzar.',
 'Agregá en ese objeto: «por siempre» → «crear clon de mí mismo» → «esperar (1) segundos».',
 'Usá «al comenzar como clon» → «ir a x aleatoria y: 170» → «mostrar».',
 'Repetí «cambiar y por (-5)» hasta tocar el borde inferior.',
 'Al recogerla o llegar abajo, ejecutá «eliminar este clon» para liberar recursos.'
 ],'al hacer clic en bandera verde\nesconder\npor siempre\n  crear clon de [mí mismo]\n  esperar (1) segundos\n\nal comenzar como clon\nmostrar\nrepetir hasta que <(posición y) < (-175)>\n  cambiar y por (-5)\neliminar este clon','Caen estrellas nuevas y las anteriores desaparecen al terminar.','Hacé que algunas estrellas resten puntos y otras sumen.','Sin «eliminar este clon», los objetos se acumulan y el juego se vuelve lento.','scratchIdeas'),
 lesson('s18','Listas e inventario','Guardar varios objetos recolectados.',[
 'En Variables elegí Crear una lista y llamala «Mochila».',
 'Al iniciar, ejecutá «borrar todo de [Mochila]».',
 'Al tocar la llave, usá «añadir [Llave] a [Mochila]».',
 'Para abrir la puerta, verificá «si <[Mochila] contiene [Llave]> entonces».',
 'Al abrirla, eliminá la llave de la lista y probá una segunda puerta.'
 ],'al hacer clic en bandera verde\nborrar todo de [Mochila]\n\nsi <tocando [Llave]?> entonces\n  añadir [Llave] a [Mochila]','La mochila registra objetos y una puerta exige tener la llave.','Añadí monedas, pociones y un contador de cuántos objetos tiene la mochila.','Evitá sumar la misma llave muchas veces: escondela o cambiale de posición después del contacto.','scratch'),
 lesson('s19','Mis propios bloques','Crear una función reutilizable.',[
 'En Mis bloques pulsá Crear un bloque y llamalo «celebrar».',
 'Debajo de «definir celebrar», colocá «tocar sonido», «decir [¡Bien!]» y «cambiar efecto color».',
 'En el guion de victoria, usá el bloque nuevo «celebrar».',
 'También llamá a «celebrar» al completar una misión secundaria.',
 'Cambiá el sonido dentro de la definición y comprobá que se actualizan ambos usos.'
 ],'definir celebrar\ntocar sonido [pop] hasta que termine\ndecir [¡Bien!] por (1) segundos\n\nal recibir [Ganaste]\ncelebrar','La misma función funciona en dos situaciones distintas.','Creá «aparecer en inicio (x) (y)» con parámetros para usarla en varios niveles.','Los bloques personalizados pertenecen al objeto donde se definen; otro objeto no los ve automáticamente.','scratch'),
 lesson('s20','Física con velocidad','Simular aceleración y fricción.',[
 'Creá dos variables: VelocidadX y VelocidadY para el héroe.',
 'Al iniciar fijá ambas a cero; en un bucle sumá o restá a VelocidadX cuando se presionen flechas.',
 'En cada vuelta, cambiá x por VelocidadX y fijá VelocidadX a VelocidadX multiplicada por 0.9.',
 'Para saltar, fijá VelocidadY a 14 y restale 1 en cada vuelta hasta tocar el suelo.',
 'Probá que el personaje tarda un momento en detenerse y que no atraviesa plataformas.'
 ],'por siempre\n  si <tecla [flecha derecha] presionada?> entonces\n    cambiar [VelocidadX] por (1)\n  cambiar x por (VelocidadX)\n  fijar [VelocidadX] a ((VelocidadX) * (0.9))','El personaje acelera y desacelera gradualmente.','Hacé que en el hielo la fricción sea 0.98 y en el pasto 0.7.','Si se mueve demasiado rápido, limitá VelocidadX entre -10 y 10.','scratch')
 ]},
 {id:'s6',name:'6 · Creador experto',detail:'Sistemas completos y proyecto final.',lessons:[
 lesson('s21','Enemigos que persiguen','Crear una inteligencia sencilla con distancia.',[
 'Agregá un objeto Enemigo y un guion de bandera verde con «por siempre».',
 'Usá «apuntar hacia [Héroe]» y «mover (2) pasos» cuando la distancia sea menor a 180.',
 'Si la distancia es mayor, girá lentamente o mantenelo en patrulla.',
 'Cuando toque al Héroe, quitá una vida y reposicioná al enemigo.',
 'Probá velocidades 1, 2 y 4 y anotá cuál resulta justa.'
 ],'por siempre\n  si <(distancia a [Héroe]) < (180)> entonces\n    apuntar hacia [Héroe]\n    mover (2) pasos\n  si no\n    girar (3) grados','El enemigo detecta al jugador y se acerca dentro de cierto radio.','Agregá dos enemigos: uno rápido con poca visión y otro lento con mucha visión.','Evitá que los enemigos se muevan sin descanso si el juego está en menú o terminó.','scratch'),
 lesson('s22','Dificultad progresiva','Hacer que el desafío aumente sin volverse imposible.',[
 'Creá una variable «Dificultad» y fijala a 1 al inicio.',
 'Cada vez que Puntos llegue a 5, 10, 15... incrementá Dificultad.',
 'En el generador de clones, usá «esperar ((2) / (Dificultad)) segundos» con un límite mínimo de 0.3.',
 'Hacé que la velocidad de enemigos sea 1 + Dificultad, con máximo 6.',
 'Probá cinco minutos y ajustá los máximos según los intentos reales.'
 ],'fijar [Dificultad] a (1)\nsi <((Puntos) mod (5)) = (0)> entonces\n  cambiar [Dificultad] por (1)','El juego se vuelve más desafiante cada cinco puntos sin acelerar infinitamente.','Agregá un modo Fácil, Normal y Experto desde el menú.','Para no aumentar muchas veces cuando Puntos sigue en 5, recordá la última meta procesada.','scratch'),
 lesson('s23','Pulir sonido, menú y ayuda','Dejar un juego preparado para otros alumnos.',[
 'Agregá una pantalla inicial con nombre del juego, cómo mover, objetivo y botón Jugar.',
 'Creá estados Menú, Jugando y Final; usá mensajes para cambiar de pantalla.',
 'Añadí efectos breves al saltar, perder una vida y ganar. Regulá el volumen.',
 'Creá un botón Reiniciar que ponga todas las variables en sus valores iniciales.',
 'Pedile a otro compañero que pruebe sin explicarle nada y anotá tres dificultades.'
 ],'al recibir [Reiniciar]\nfijar [Puntos] a (0)\nfijar [Vida] a (3)\nfijar [Estado] a (1)\nenviar [Inicio]','Un compañero entiende y completa el juego sin ayuda verbal.','Incluí un apartado de créditos con un alias y sin datos personales.','Revisá que los sonidos no sean molestos y que todos los botones respondan al reiniciar.','scratchIdeas'),
 lesson('s24','Proyecto final Scratch','Crear y presentar un videojuego original terminado.',[
 'Escribí el diseño en cinco líneas: nombre, historia, objetivo, controles y condición de victoria.',
 'Combiná al menos dos niveles, marcador, vidas, un enemigo, un mensaje y un bloque propio.',
 'Agregá sonido, pantalla inicial, pausa o reinicio y un final de victoria y derrota.',
 'Realizá diez partidas de prueba. Corregí al menos tres errores y anotá qué cambiaste.',
 'Mostrá el proyecto a tu docente. Para compartirlo en Scratch, seguí las reglas de la institución y no publiques datos personales.'
 ],'Lista de control:\n✓ Controles claros\n✓ Dos niveles\n✓ Puntos o vidas\n✓ Función propia\n✓ Victoria y derrota\n✓ Pruebas registradas','El juego se puede completar de principio a fin y otra persona sabe usarlo.','Prepará una versión 2 con un nivel secreto y opciones de accesibilidad.','Guardar el proyecto en Scratch requiere la sesión adecuada; antes de cerrar comprobá que quedó guardado.','scratchIdeas')
 ]}
 ]};
const roblox={id:'roblox',name:'Roblox Studio',icon:'◈',subtitle:'Construí mundos 3D y programá con Luau',age:'Sugerido: Juniors 12–17, con acompañamiento docente',tool:'Requiere instalar Roblox Studio en Windows o Mac. No funciona dentro del navegador.',action:'Abrir guía oficial de instalación',actionUrl:references.roblox,
 levels:[
 {id:'r1',name:'1 · Conocer Studio',detail:'Interfaz, piezas y primera prueba 3D.',lessons:[
 lesson('r01','Preparar Roblox Studio','Instalar y abrir el editor de forma segura.',[
 'Pedile al docente o responsable que compruebe que la PC es Windows o Mac y que autorice la instalación.',
 'Entrá únicamente desde el sitio oficial de Roblox Creator Hub. No uses instaladores de otras páginas.',
 'Con una cuenta permitida por las normas de edad y supervisión, abrí Roblox Studio.',
 'Elegí la plantilla Baseplate para iniciar un mundo vacío.',
 'Ubicá las ventanas Explorer, Properties y Output. Guardá una primera copia del proyecto.'
 ],'Inicio recomendado:\nPlantilla: Baseplate\nPaneles: Explorer / Properties / Output\nGuardar: File → Save to File o guardar en Roblox según la cuenta','Studio abre un mundo vacío y podés reconocer las tres ventanas.','Explorá la cámara con el mouse y anotá cómo acercar, girar y desplazar la vista.','Si el kiosco escolar bloquea las instalaciones, trabajá esta guía y practicá mundos 3D en Krueka hasta que un administrador configure Studio.','roblox'),
 lesson('r02','Mover la cámara y entender Explorer','Navegar por el mundo y encontrar objetos.',[
 'En Baseplate, mové la cámara con los controles de navegación de Studio y enfocá la base.',
 'En Explorer, desplegá Workspace y seleccioná Baseplate.',
 'En Properties, buscá Anchored, Size y Position. No cambies aún la base.',
 'En la pestaña Home identificá Select, Move, Scale y Rotate.',
 'Agregá una Part y seleccionála tanto desde la escena como desde Explorer.'
 ],'Explorer → Workspace → Baseplate\nHome → Part → Block\nHome → Select / Move / Scale / Rotate','Podés encontrar un objeto y seleccionar sus propiedades.','Creá tres piezas y renombrálas Piso, Torre y Meta.','Si Properties no aparece, activalo desde la pestaña View.','roblox'),
 lesson('r03','Construir con Parts','Crear una habitación con suelo, paredes y techo.',[
 'Insertá una Part llamada Piso y fijá Size a 40, 1, 40 y Anchored en true.',
 'Insertá cuatro Parts más y escalalas como paredes alrededor del piso.',
 'Anclá todas las paredes; elegí materiales y colores diferentes desde Properties.',
 'Creá una puerta dejando un espacio entre dos partes.',
 'Agrupá las piezas en un Model llamado MiCasa y guardá el lugar.'
 ],'Piso: Size = 40, 1, 40\nPared: Anchored = true\nModel: MiCasa','La casa mantiene su forma al pulsar Play.','Agregá ventanas, escalera y patio usando solo Parts.','Si las paredes caen al jugar, verificá Anchored=true en cada pieza.','robloxBuild'),
 lesson('r04','Probar y corregir','Usar Play, Stop y Output antes de seguir.',[
 'Pulsá Play para aparecer como jugador dentro del mundo.',
 'Caminá por la casa y comprobá que el piso soporte al personaje.',
 'Pulsá Stop y ajustá la altura del piso si el personaje cae.',
 'Abrí Output para identificar mensajes y futuros errores de scripts.',
 'Guardá una versión con el nombre «Casa probada».'
 ],'Home → Play\nHome → Stop\nView → Output','Podés caminar sin caer y distinguir edición de ejecución.','Pedile a un compañero que encuentre un lugar donde el personaje se atasque.','Los cambios hechos solo durante Play pueden no conservarse al detenerlo; editá fuera de la prueba.','robloxBuild')
 ]},
 {id:'r2',name:'2 · Crear un mundo jugable',detail:'Obstáculos, trampas, puntos de control y ambiente.',lessons:[
 lesson('r05','Tu primer obby','Construir un circuito de saltos completo.',[
 'Insertá cinco plataformas de Parts entre el inicio y una meta distante.',
 'Poné Anchored=true en cada plataforma y dejá pequeñas separaciones para saltar.',
 'Usá Scale y Move para que las dos primeras sean fáciles y las últimas más difíciles.',
 'Colocá un SpawnLocation al principio y una Part verde al final llamada Meta.',
 'Entrá en Play, completá el recorrido y ajustá las separaciones según los saltos.'
 ],'Objetos mínimos:\nSpawnLocation → Plataforma1 → Plataforma2 → Plataforma3 → Plataforma4 → Meta','El circuito se puede completar sin volar ni atravesar objetos.','Construí un segundo camino alternativo más difícil.','Las plataformas no deben moverse por gravedad: anclalas antes de probar.','robloxBuild'),
 lesson('r06','Lava que reinicia','Agregar una trampa con el evento Touched.',[
 'Insertá una Part bajo el circuito, nombrala Lava, poné Anchored=true y color naranja.',
 'En Explorer, hacé clic en + de Lava e insertá Script (no LocalScript).',
 'Borrá el código inicial y escribí el ejemplo de abajo.',
 'Pulsá Play y tocá la lava con el personaje; comprobá que vuelve al punto de inicio.',
 'Poné lava en más zonas copiando la Part con su Script.'
 ],`local lava = script.Parent
lava.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.Health = 0
    end
end)`, 'Al tocar Lava, el personaje pierde la vida y reaparece.','Probá dos trampas con colores distintos y modificá su tamaño.','El script va dentro de Lava; si la lava no hace nada, revisá Output por errores de escritura.','robloxScript'),
 lesson('r07','Guardar puntos de control','Reaparecer cerca del último obstáculo superado.',[
 'Insertá dos SpawnLocations en distintos puntos del obby. Renombrálos Check1 y Check2.',
 'En cada uno activá Neutral y fijá Anchored=true.',
 'Insertá un Script dentro de Check1 y copiá el código.',
 'Duplicá la lógica en Check2. Probá tocar Check2, morir en lava y reaparecer allí.',
 'Añadí un texto que indique al jugador cuándo activó un punto de control.'
 ],`local checkpoint = script.Parent
checkpoint.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then
        player.RespawnLocation = checkpoint
    end
end)`, 'Después de activar Check2, el jugador reaparece en ese lugar.','Agregá tres checkpoints y comprobá el orden en que se activan.','RespawnLocation necesita un SpawnLocation; una Part común no sirve para este ejemplo.','robloxScript'),
 lesson('r08','Terreno, materiales y luz','Crear un paisaje 3D claro y con identidad.',[
 'Desde Terrain Editor añadí una zona de colinas y otra de agua alrededor del obby.',
 'Usá materiales distintos para senderos, roca y vegetación, sin sobrecargar el escenario.',
 'En Lighting ajustá ClockTime y Brightness hasta que se distinga bien el camino.',
 'Ubicá algunos árboles o construcciones hechos por vos. Revisá su anclaje.',
 'Probá el mapa con calidad gráfica más baja para detectar lugares oscuros o pesados.'
 ],'Terrain Editor → Generate / Edit\nLighting → ClockTime y Brightness\nParts → Material','Las plataformas se distinguen con claridad del fondo.','Creá una zona de día y otra de noche separadas por un túnel.','No insertes modelos con scripts desconocidos de Toolbox; revisalos con el docente antes de usarlos.','robloxBuild')
 ]},
 {id:'r3',name:'3 · Programar con Luau',detail:'Variables, eventos, condiciones, funciones y módulos.',lessons:[
 lesson('r09','Tu primer Script y Output','Entender qué hace una instrucción.',[
 'En Explorer seleccioná ServerScriptService y agregá un Script.',
 'Escribí print("Hola, Club Krueka") y pulsá Play.',
 'Abrí Output y comprobá que se muestra el mensaje.',
 'Creá una variable local llamada velocidad con valor 16 y mostrá su valor.',
 'Cambiá velocidad a 24 y compará las dos ejecuciones.'
 ],`local velocidad = 16
print("Hola, Club Krueka")
print("Velocidad elegida:", velocidad)`, 'Output muestra el mensaje y el número 16 o 24.','Agregá las variables nombreDelJuego y nivel y mostrá sus valores.','Un Script de servidor se ejecuta durante Play; no esperes ver print solo al editar.','robloxScript'),
 lesson('r10','Eventos y funciones','Responder cuando alguien toca una pieza.',[
 'Creá una Part llamada Boton y anclala. Insertá un Script dentro.',
 'Escribí una función llamada activar y conectala a Boton.Touched.',
 'Dentro comprobá si hit.Parent tiene un Humanoid antes de activar.',
 'Al activarse, cambiá el color de la Part a verde.',
 'Probá tocarla con el personaje y con una pieza suelta; solo el personaje debe activarla.'
 ],`local boton = script.Parent
local function activar(hit)
    local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end
    boton.Color = Color3.fromRGB(46, 169, 107)
end
boton.Touched:Connect(activar)`, 'El botón cambia de color al tocarlo un personaje.','Hacé que al activarse se encienda una luz.','El evento Touched puede ejecutarse varias veces; para premios usá control de repeticiones.','robloxScript'),
 lesson('r11','Condiciones y bucles','Crear una cuenta regresiva y una decisión.',[
 'Agregá un Script en ServerScriptService.',
 'Definí segundos=10 y usá un bucle while para repetir mientras queden segundos.',
 'Mostrá cada segundo en Output y esperá task.wait(1) entre números.',
 'Al terminar, usá if para comprobar que el valor llegó a cero.',
 'Probá con 5 y con 20 segundos y explicá la diferencia.'
 ],`local segundos = 10
while segundos > 0 do
    print("Restan", segundos)
    task.wait(1)
    segundos -= 1
end
if segundos == 0 then
    print("Restan", segundos)
    print("Cuenta terminada")
end`, 'Output cuenta de 10 a 0 una vez por segundo.','Creá una cuenta que termine antes si se activa una variable victoria.','Usá task.wait() en bucles que se repiten; un bucle infinito sin esperas puede bloquear la experiencia.','robloxScript'),
 lesson('r12','Módulos reutilizables','Separar reglas del juego en un ModuleScript.',[
 'En ReplicatedStorage creá un ModuleScript llamado Reglas.',
 'Dejá una tabla con meta=5 y funcion sumarPuntos; terminá con return Reglas.',
 'En un Script de ServerScriptService usá require para cargar el módulo.',
 'Imprimí Reglas.meta y llamá Reglas.sumarPuntos(3).',
 'Cambiá la meta en un solo lugar y verificá el nuevo resultado.'
 ],`-- ReplicatedStorage/Reglas (ModuleScript)
local Reglas = {meta = 5}
function Reglas.sumarPuntos(cantidad)
    return math.max(0, cantidad)
end
return Reglas

-- En ServerScriptService (Script separado)
local Reglas = require(game.ReplicatedStorage.Reglas)
print(Reglas.meta, Reglas.sumarPuntos(3))`, 'El Script obtiene la configuración del ModuleScript sin copiar los valores.','Creá una función que calcule el puntaje necesario para el siguiente nivel.','Un ModuleScript necesita return para entregar su tabla a require.','robloxScript')
 ]},
 {id:'r4',name:'4 · Sistemas de juego',detail:'Puntajes, monedas, puertas y HUD.',lessons:[
 lesson('r13','Puntaje en la tabla','Mostrar Coins para cada jugador.',[
 'En ServerScriptService insertá un Script llamado Leaderboard.',
 'Conectá Players.PlayerAdded; dentro creá una Folder llamada exactamente leaderstats.',
 'Creá dentro un IntValue llamado Coins con Value=0.',
 'Pulsá Play y verificá que aparece Coins en la tabla de jugadores.',
 'En Output asegurate de que cada jugador tenga su propio valor.'
 ],`local Players = game:GetService("Players")
Players.PlayerAdded:Connect(function(player)
    local board = Instance.new("Folder")
    board.Name = "leaderstats"
    board.Parent = player
    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = board
end)`, 'Cada jugador empieza con Coins=0.','Agregá una variable Level que comience en 1.','La carpeta debe llamarse leaderstats en minúscula; de lo contrario no aparece en la tabla.','robloxScript'),
 lesson('r14','Monedas recolectables','Sumar una moneda una sola vez por contacto.',[
 'Creá una Part esférica llamada Moneda, Anchored=true y CanCollide=false.',
 'Confirmá que existe el Script Leaderboard de la lección anterior.',
 'Añadí un Script dentro de Moneda con el ejemplo, usando GetPlayerFromCharacter.',
 'Probá que al tocarla sube Coins y la moneda desaparece.',
 'Duplicá la Moneda en cinco lugares y comprobá que el total sea cinco.'
 ],`local coin = script.Parent
local collected = false
coin.Touched:Connect(function(hit)
    if collected then return end
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    local stats = player:FindFirstChild("leaderstats")
    local coins = stats and stats:FindFirstChild("Coins")
    if not coins then return end
    collected = true
    coins.Value += 1
    coin:Destroy()
end)`, 'Cada moneda suma 1 y no se cuenta dos veces.','Hacé una moneda dorada que valga 5.','Usá la bandera collected antes de destruir: Touched puede dispararse varias veces.','robloxScript'),
 lesson('r15','Puerta con precio','Abrir una zona al gastar monedas.',[
 'Creá una Part Puerta con Anchored=true y CanCollide=true.',
 'Usá el Leaderboard con Coins. Para esta práctica, cada jugador debe tener al menos 3.',
 'En Puerta agregá Script y comprobá el valor de Coins cuando el jugador la toca.',
 'Si alcanza, restá 3 y ocultá la puerta por tres segundos; luego restaurá colisión y transparencia.',
 'Si no alcanza, comprobá que la puerta permanezca cerrada. Como mejora, más adelante podés mostrar un aviso en el HUD.'
 ],`local puerta = script.Parent
local activa = true
puerta.Touched:Connect(function(hit)
    if not activa then return end
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    local stats = player and player:FindFirstChild("leaderstats")
    local coins = stats and stats:FindFirstChild("Coins")
    if not coins or coins.Value < 3 then return end
    activa = false
    coins.Value -= 3
    puerta.CanCollide = false
    puerta.Transparency = 0.8
    task.wait(3)
    puerta.CanCollide = true
    puerta.Transparency = 0
    activa = true
end)`, 'La puerta se abre temporalmente solo si hay al menos tres monedas.','Creá dos puertas con precios diferentes.','Esta puerta física se abre para todos durante tres segundos; para acceso privado por jugador hace falta otro diseño.','robloxScript'),
 lesson('r16','Interfaz de puntos','Mostrar las monedas en una esquina de la pantalla.',[
 'En StarterGui insertá ScreenGui y dentro TextLabel llamado Puntaje.',
 'Ajustá Position, Size y Text de Puntaje para que sea legible.',
 'Insertá un LocalScript dentro del TextLabel y pegá el ejemplo.',
 'En Play, recogé una moneda y comprobá que el texto cambia.',
 'Probá en una pantalla pequeña usando el emulador de dispositivos de Studio.'
 ],`local player = game.Players.LocalPlayer
local coins = player:WaitForChild("leaderstats"):WaitForChild("Coins")
local label = script.Parent
local function actualizar()
    label.Text = "Monedas: " .. coins.Value
end
coins.Changed:Connect(actualizar)
actualizar()`, 'El TextLabel muestra Coins y se actualiza al recoger monedas.','Creá otro indicador para vidas o nivel.','El LocalScript debe estar en una ubicación de cliente, como StarterGui; no va en ServerScriptService.','robloxScript')
 ]},
 {id:'r5',name:'5 · Mundos avanzados',detail:'Animación, NPC, datos y seguridad multijugador.',lessons:[
 lesson('r17','Animar personajes','Crear una animación propia y reproducirla.',[
 'En Studio insertá un rig compatible con el avatar y abrí Animation Editor.',
 'Elegí el rig, creá una animación y colocá poses en varios segundos.',
 'Probá la animación dentro del editor para corregir brazos, piernas y tiempos.',
 'Guardá/publicá el recurso según las autorizaciones de la cuenta y anotá el ID de tu animación.',
 'En un Script apropiado, cargá la animación en un Animator y probá reproducirla en Play.'
 ],`-- Reemplazá el ID por una animación creada por vos
local humanoid = script.Parent:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")
local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://TU_ID"
local track = animator:LoadAnimation(animation)
track:Play()`, 'El personaje reproduce una secuencia de poses creada por vos.','Creá animaciones distintas para caminar, celebrar y descansar.','El ID es un marcador de ejemplo: debés usar una animación tuya con permisos correctos; no copies recursos ajenos sin autorización.','robloxScript'),
 lesson('r18','NPC que camina a una meta','Usar PathfindingService para evitar obstáculos.',[
 'Creá un NPC con Humanoid y HumanoidRootPart; agregá en Workspace una Part MetaNPC.',
 'En el modelo NPC insertá un Script.',
 'Calculá un camino desde la posición del NPC hasta MetaNPC con PathfindingService.',
 'Si el estado es Success, recorré los waypoints usando Humanoid:MoveTo y MoveToFinished:Wait.',
 'Probá el camino con una pared en medio; observá si rodea el obstáculo.'
 ],`local PathfindingService = game:GetService("PathfindingService")
local npc = script.Parent
local humanoid = npc:WaitForChild("Humanoid")
local root = npc:WaitForChild("HumanoidRootPart")
local meta = workspace:WaitForChild("MetaNPC")
local camino = PathfindingService:CreatePath()
camino:ComputeAsync(root.Position, meta.Position)
if camino.Status == Enum.PathStatus.Success then
    for _, punto in camino:GetWaypoints() do
        humanoid:MoveTo(punto.Position)
        if not humanoid.MoveToFinished:Wait() then break end
    end
end`, 'El NPC sigue varios puntos para llegar a MetaNPC.','Hacé que cambie de destino según el nivel del jugador.','Si un camino falla, revisá anclajes, tamaño del NPC, obstáculos y Output antes de reintentarlo.','robloxScript'),
 lesson('r19','Cliente y servidor seguros','Validar las solicitudes del jugador antes de dar recompensas.',[
 'En ReplicatedStorage creá un RemoteEvent llamado SolicitarMoneda.',
 'En Workspace creá una Folder Monedas e insertá dentro Part de prueba.',
 'Desde un LocalScript podés solicitar con SolicitarMoneda:FireServer(moneda).',
 'En ServerScriptService poné el código de validación: tipo, pertenencia y distancia.',
 'Probá con una moneda cercana y con otra muy lejana; el servidor debe rechazar la segunda.'
 ],`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local remote = ReplicatedStorage:WaitForChild("SolicitarMoneda")
local monedas = workspace:WaitForChild("Monedas")
remote.OnServerEvent:Connect(function(player, moneda)
    if typeof(moneda) ~= "Instance" or not moneda:IsA("BasePart") then return end
    if not moneda:IsDescendantOf(monedas) then return end
    local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if not root or (root.Position - moneda.Position).Magnitude > 10 then return end
    -- Aquí se aplica una recompensa validada; falta evitar duplicados.
    print(player.Name, "solicitud válida")
end)`, 'Una solicitud desde lejos no da recompensa; el servidor decide.','Añadí una comprobación de moneda no recolectada y límite de una solicitud por segundo.','Nunca confíes en puntos, precios o distancias enviados por el cliente. Validá todo en el servidor.','robloxRemote'),
 lesson('r20','Guardar progreso con DataStore','Conservar las monedas entre sesiones.',[
 'Usá el Script Leaderboard y un juego de prueba publicado de forma privada.',
 'En ServerScriptService creá un Script para obtener DataStoreService y un almacén «CoinsV1».',
 'Al entrar un jugador, intentá leer la clave coins_ + UserId con pcall; si falla, comenzá en 0.',
 'Al salir, llamá UpdateAsync dentro de pcall para guardar las monedas, sin guardar datos personales.',
 'Probá dos sesiones de ensayo y revisá Output; seguí las indicaciones de API Services del entorno de prueba.'
 ],`local Players = game:GetService("Players")
local store = game:GetService("DataStoreService"):GetDataStore("CoinsV1")
Players.PlayerAdded:Connect(function(player)
    local board = player:WaitForChild("leaderstats")
    local coins = board:WaitForChild("Coins")
    local ok, saved = pcall(function()
        return store:GetAsync("coins_" .. player.UserId)
    end)
    if ok and type(saved) == "number" then coins.Value = saved end
end)
Players.PlayerRemoving:Connect(function(player)
    local board = player:FindFirstChild("leaderstats")
    local coins = board and board:FindFirstChild("Coins")
    if not coins then return end
    local ok, err = pcall(function()
        store:UpdateAsync("coins_" .. player.UserId, function()
            return coins.Value
        end)
    end)
    if not ok then warn(err) end
end)`, 'Después de salir y volver a entrar, las monedas se recuperan.','Agregá el nivel alcanzado y una estrategia de guardado periódico sin exceso de solicitudes.','Las llamadas a DataStore pueden fallar; usá pcall. Para producción hacen falta pruebas adicionales de cierres inesperados y escrituras concurrentes.','robloxData')
 ]},
 {id:'r6',name:'6 · Proyecto profesional',detail:'Generación, rendimiento, revisión y publicación responsable.',lessons:[
 lesson('r21','Generar niveles desde código','Crear un recorrido con piezas repetidas.',[
 'En ServerScriptService agregá Script llamado Generador.',
 'Definí una cantidad de plataformas y una distancia entre ellas.',
 'Con un bucle for creá Parts, fijá Size, Position y Anchored=true.',
 'Probá 8, 15 y 25 plataformas. Ajustá la distancia para que se puedan saltar.',
 'Asigná cada plataforma a una Folder Niveles en Workspace para ordenarlas.'
 ],`local niveles = Instance.new("Folder")
niveles.Name = "Niveles"
niveles.Parent = workspace
for i = 1, 12 do
    local p = Instance.new("Part")
    p.Name = "Plataforma" .. i
    p.Size = Vector3.new(10, 1, 8)
    p.Position = Vector3.new(i * 12, 5, 0)
    p.Anchored = true
    p.Parent = niveles
end`, 'Se crean doce plataformas en línea al entrar a Play.','Generá alturas y direcciones diferentes con Random.new, siempre dejando una ruta posible.','Las piezas generadas solo durante Play deben regenerarse en cada partida o construirse fuera de ejecución para quedar guardadas.','robloxScript'),
 lesson('r22','Diseño de misiones y recompensas','Combinar un objetivo, una llave y una salida.',[
 'Definí una misión clara: obtener tres monedas, conseguir una llave y salir.',
 'Construí tres zonas visibles desde el SpawnLocation.',
 'Usá Coins y una variable propia para indicar si el jugador tiene llave.',
 'Colocá una puerta que solo funcione cuando se cumplan ambos requisitos.',
 'Añadí feedback visual o sonoro al completar cada objetivo y una pantalla de victoria.'
 ],'Diseño de misión:\n1. Recolectar 3 monedas\n2. Encontrar 1 llave\n3. Abrir la puerta\n4. Llegar a la salida','El jugador entiende qué falta y puede completar todo el recorrido.','Agregá una misión opcional que abra un camino secreto, sin compras.','No confundas variables de un jugador con estados globales: en multijugador cada persona necesita su propio progreso.','robloxBuild'),
 lesson('r23','Rendimiento y depuración','Hacer que el mundo sea fluido y fácil de corregir.',[
 'Abrí Output y corregí todos los errores rojos antes de añadir funciones.',
 'Probá con dos jugadores desde las opciones de test de Studio y verificá que no comparten monedas.',
 'Revisá piezas invisibles, scripts repetidos y bucles con esperas innecesariamente cortas.',
 'Reducí objetos decorativos duplicados y comprobá la iluminación en calidad baja.',
 'Usá las herramientas de rendimiento y compará el juego antes y después de cada cambio.'
 ],'Lista de revisión:\n□ Sin errores en Output\n□ Dos jugadores sin mezclarse\n□ Sin partes que caigan sin querer\n□ Sin bucles descontrolados\n□ Mundo jugable en calidad baja','El juego se ejecuta con estabilidad y dos jugadores mantienen estados distintos.','Registrá un error, su causa y cómo lo corregiste en un pequeño diario de desarrollo.','Para comprobar un problema, cambiá una sola cosa por vez y volvé a probar.','robloxScript'),
 lesson('r24','Proyecto final y publicación responsable','Terminar y presentar una experiencia original 3D.',[
 'Planificá por escrito el nombre, público, controles, historia, objetivo y tres niveles del juego.',
 'Construí un mundo propio con al menos un obby, checkpoints, monedas y pantalla de puntos.',
 'Incorporá dos scripts originales, una función reutilizable, una animación y una misión final.',
 'Realizá diez pruebas en solitario y dos con más de un jugador; corregí fallos de colisiones y guardado.',
 'Mostrá el resultado al docente. Publicalo únicamente si el adulto responsable y la institución autorizan la cuenta, la visibilidad y las opciones de comunicación.'
 ],'Entrega final:\n✓ Mundo 3D original\n✓ Inicio y final\n✓ Monedas y checkpoints\n✓ Interfaz y animación\n✓ Código de servidor validado\n✓ Pruebas y créditos','Otra persona completa la experiencia sin que tengas que explicarle los controles.','Prepará una actualización con dos dificultades y mejoras de accesibilidad.','Antes de hacer pública una experiencia, revisá privacidad, chats, recursos de terceros y permisos de publicación con el docente.','robloxBuild')
 ]}
 ]};
window.KruekaGuiasCursos={version:1,references,tracks:[scratch,roblox]};
})();
