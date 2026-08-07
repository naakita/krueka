/* Cargador compatible del Club B.E.I. · 20260807c */
(function(){
  'use strict';
  var src=(document.currentScript&&document.currentScript.src)||'';
  var base=src.slice(0,src.lastIndexOf('/')+1);
  ['club-juego-1.js','club-juego-2.js','club-juego-3.js','club-juego-4.js','club-mejoras.js','club-pc-lab.js'].forEach(function(file){
    document.write('<script src="'+base+file+'?v=20260807c"><\/script>');
  });
})();
