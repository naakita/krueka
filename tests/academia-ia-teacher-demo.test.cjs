const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('academia-ia.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/i);
const sql=fs.readFileSync('supabase/migrations/20261023_club_ai_teacher_demo_role_check.sql','utf8');

test('Modo DEMO sin errores de sintaxis',()=>{
 assert.ok(js,'Script presente');
 assert.doesNotThrow(()=>new vm.Script(js[1]));
});

test('Se muestra solo si verifica sesión institucional con rol autorizado',()=>{
 assert.match(js[1],/teacherAuthClient\.auth\.getSession\(\)/);
 assert.match(js[1],/teacherAuthClient\.rpc\('club_ai_teacher_demo_allowed'\)/);
 assert.match(js[1],/result\.data===true/);
 assert.match(html,/id="teacher-demo-entry" hidden/);
 assert.match(html,/id="teacher-demo-banner"[^>]*hidden/);
 assert.doesNotMatch(js[1],/code\s*===\s*['"]DEMO/);
});

test('La base limita la función a cuentas docentes autenticadas',()=>{
 assert.match(sql,/security invoker/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/p\.activo\s*=\s*true/);
 assert.match(sql,/p\.role::text in \('admin', 'docente'\)/);
 assert.match(sql,/grant execute on function public\.club_ai_teacher_demo_allowed\(\) to authenticated/);
 assert.match(sql,/revoke all on function public\.club_ai_teacher_demo_allowed\(\) from public, anon/);
});

test('El avance DEMO permanece separado del progreso de alumnos',()=>{
 assert.match(js[1],/isTeacherDemo\?'profesor-demo-local'/);
 assert.match(js[1],/if\(isTeacherDemo\)\{el\('save-status'\)/);
 assert.match(js[1],/function openTeacherDemo\(\)/);
 assert.match(js[1],/session=null;isTeacherDemo=true/);
 assert.match(html,/no accede a cuentas ni trabajos de alumnos/);
});
