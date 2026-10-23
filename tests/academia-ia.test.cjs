const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('academia-ia.html', 'utf8');
const studio = fs.readFileSync('studio.html', 'utf8');
const accesos = fs.readFileSync('accesos.html', 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/i);

test('Academia IA tiene JavaScript válido y accesos visibles', () => {
  assert.ok(js, 'El documento debe contener el script del entrenamiento');
  assert.doesNotThrow(() => new vm.Script(js[1]));
  assert.match(studio, /href="academia-ia\.html"/);
  assert.match(accesos, /href="academia-ia\.html"/);
});

test('Incluye las cuatro misiones y campos del prompt', () => {
  for (let i = 0; i < 4; i++) assert.match(html, new RegExp('id="lesson-' + i + '"'));
  for (const field of ['goal', 'context', 'instruction', 'limits', 'check'])
    assert.match(html, new RegExp('id="' + field + '"'));
  assert.match(html, /No es un modelo de IA generativa/);
  assert.match(html, /club_ai_academy_state/);
});

test('El editor de prompts no envía consultas del menor a proveedores externos', () => {
  assert.doesNotMatch(js[1], /api\.openai\.com|opencode\.ai\/inference|openrouter\.ai\/api/);
  assert.match(html, /href="studio\.html"/);
});
