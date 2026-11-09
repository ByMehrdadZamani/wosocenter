'use strict';
// Check the real formation generator without changing its browser implementation.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const js = fs.readFileSync(path.join(__dirname, '..', 'lineup.js'), 'utf8');
const end = js.indexOf('const LFLAG_EMOJI=');
assert.ok(end > 0, 'formation section missing from lineup.js');
const testCode = `${js.slice(0, end)}\n` +
  `var lState={formation:'4-3-3', slots:Array.from({length:11},(_,i)=>({playerId:'P'+i}))};\n` +
  `var lSelected=0; function lChange(fn){fn();} function lClose(){}\n` +
  `globalThis.testApi={names:LFORMATION_NAMES,spots:lFormationSpots,svg:lFormationSvg,select:lSelectFormation,state:lState};`;
const context = {};
vm.runInNewContext(testCode, context, {filename:'lineup.js'});
const {names, spots, svg, select, state} = context.testApi;
assert.equal(names.length, 31, '31 formations are expected');
assert.equal(new Set(names).size, names.length, 'duplicate formation names');

for (const name of names) {
  const points = spots(name);
  assert.equal(points.length, 11, `${name}: expected 11 players`);
  assert.equal(points[10].position, 'GK', `${name}: GK should be last`);
  assert.equal(points[10].x, 540, `${name}: GK should stay centered`);
  assert.equal((svg(name).match(/fill=\"#f4d16a\"/g) || []).length, 11,
    `${name}: miniature pitch should show 11 player markers`);
  for (const p of points) {
    assert.ok(p.scale >= .7 && p.scale <= 1, `${name}: invalid card scale`);
    assert.ok(p.x - 90*p.scale >= 0 && p.x + 90*p.scale <= 1080,
      `${name}: card would fall outside horizontal canvas bounds`);
    assert.ok(p.y >= 230 && p.y + 189*p.scale <= 1330,
      `${name}: card would fall outside vertical canvas bounds`);
  }
  for (let i=0; i<points.length; i++) for (let j=i+1; j<points.length; j++) {
    const a=points[i], b=points[j];
    const overlapX=Math.min(a.x+90*a.scale,b.x+90*b.scale) - Math.max(a.x-90*a.scale,b.x-90*b.scale);
    const overlapY=Math.min(a.y+189*a.scale,b.y+189*b.scale) - Math.max(a.y,b.y);
    assert.ok(overlapX<=0 || overlapY<=0, `${name}: player card rectangles overlap (${i},${j})`);
  }
  select(name);
  assert.equal(state.formation, name);
  assert.equal(state.slots.length, 11);
  assert.equal(state.slots[10].playerId, 'P10', `${name}: goalkeeper was reassigned`);
  assert.equal(new Set(state.slots.map(s=>s.playerId)).size, 11, `${name}: lost/duplicate players`);
}
// The original formation should be freely recoverable after visiting all options.
select('4-3-3');
assert.equal(state.formation, '4-3-3');
assert.equal(state.slots.length, 11);
console.log(`PASS: ${names.length} formations, pitch previews, card boundaries, no overlapping cards, goalkeeper preservation, and player mapping.`);
