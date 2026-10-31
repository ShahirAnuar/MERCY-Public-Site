'use strict';
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const html = readFileSync(join(__dirname, '../reader/index.html'), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Reader module script exists');

const functions = [
  script.match(/function spreadPages\([^\n]+/)?.[0],
  script.match(/function navigatePage\([^\n]+/)?.[0]
];
assert.ok(functions.every(Boolean), 'Spread helpers are present');
const { spreadPages, navigatePage } = new Function(
  functions.join('\n') + '\nreturn { spreadPages, navigatePage }'
)();

test('landscape aligns consecutive story and illustration pages', () => {
  assert.deepEqual(spreadPages(1, 8, true), [1, 2]);
  assert.deepEqual(spreadPages(2, 8, true), [1, 2]);
  assert.deepEqual(spreadPages(3, 8, true), [3, 4]);
  assert.deepEqual(spreadPages(4, 8, true), [3, 4]);
});

test('odd final page is not paired with a non-existing page', () => {
  assert.deepEqual(spreadPages(5, 5, true), [5]);
  assert.deepEqual(spreadPages(1, 1, true), [1]);
});

test('portrait shows exactly the requested page', () => {
  assert.deepEqual(spreadPages(2, 8, false), [2]);
  assert.deepEqual(spreadPages(3, 8, false), [3]);
});

test('landscape navigation moves by whole pairs with boundaries', () => {
  assert.equal(navigatePage(1, 1, 8, true), 3);
  assert.equal(navigatePage(3, -1, 8, true), 1);
  assert.equal(navigatePage(7, 1, 8, true), 7);
  assert.equal(navigatePage(1, -1, 8, true), 1);
  assert.equal(navigatePage(5, 1, 5, true), 5);
});

test('portrait navigation still moves one page', () => {
  assert.equal(navigatePage(2, 1, 8, false), 3);
  assert.equal(navigatePage(2, -1, 8, false), 1);
});

test('renderer draws two independent canvases and offsets story-thread hotspots', () => {
  assert.match(html, /id="page-right"/);
  assert.match(script, /const pages=await Promise\.all\(spread\.map/);
  assert.match(script, /targetCanvas=i===0\?canvas:rightCanvas/);
  assert.match(script, /offsetX\+Math\.min\(rect\[0\],rect\[2\]\)/);
  assert.match(script, /pages\.map\(\(page,i\)=>spread\[i\]<=14\?hasQrPage/);
});
