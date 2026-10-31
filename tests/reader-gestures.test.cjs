'use strict';
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {test}=require('node:test');
const assert=require('node:assert/strict');

const html=readFileSync(join(__dirname,'../reader/index.html'),'utf8');
const moduleSource=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(moduleSource,'Reader module source must exist');

const swipeSource=moduleSource.match(/function swipeDirection\([^\n]+/)?.[0];
const sideSource=moduleSource.match(/function pageTurnSide\([^\n]+/)?.[0];
function helpers(){
  assert.ok(swipeSource,'A pure horizontal swipe classifier must exist');
  assert.ok(sideSource,'A spread turning-side selector must exist');
  return new Function(swipeSource+'\n'+sideSource+'\nreturn {swipeDirection,pageTurnSide}')();
}

test('left and right horizontal swipes navigate naturally',()=>{
  const {swipeDirection}=helpers();
  assert.equal(swipeDirection(-100,10,350,1),1);
  assert.equal(swipeDirection(115,-8,450,1),-1);
});

test('pinch zoom and panning cannot cause accidental page turns',()=>{
  const {swipeDirection}=helpers();
  assert.equal(swipeDirection(-130,0,250,1.25),0);
  assert.equal(swipeDirection(-30,0,350,1),0);
  assert.equal(swipeDirection(-110,105,350,1),0);
  assert.equal(swipeDirection(-110,3,1900,1),0);
});

test('forward curl turns right leaf; backward curl turns left leaf in a spread',()=>{
  const {pageTurnSide}=helpers();
  assert.equal(pageTurnSide(1,true),'right');
  assert.equal(pageTurnSide(-1,true),'left');
  assert.equal(pageTurnSide(1,false),'single');
});

test('page curl uses distinct left and right canvas snapshots',()=>{
  assert.match(moduleSource,/function pageTurnLayer\(direction\)/);
  assert.match(moduleSource,/fixedCanvas=direction>0\?canvas:rightCanvas/);
  assert.match(moduleSource,/turningCanvas=direction>0\?rightCanvas:canvas/);
  assert.match(moduleSource,/--turn-back/);
  assert.match(moduleSource,/turn\.sheet\.style\.setProperty/);
  assert.match(html,/\.page-turn-fixed/);
  assert.match(html,/pageCurlForward/);
  assert.match(html,/pageCurlBackward/);
});

test('swipe events are handled separately from pinch and interactive story threads',()=>{
  assert.match(moduleSource,/stage\.addEventListener\('touchend'/);
  assert.match(moduleSource,/swipeDirection\(/);
  assert.match(moduleSource,/\.thread-target/);
  assert.match(moduleSource,/pinchStart/);
});
