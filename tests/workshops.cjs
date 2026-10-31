const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const dist = path.join(__dirname, '..', 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'https://example.test/mon-deen/#arabic', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window, d = w.document;
// Pure DOM tests, without a browser, network, actual audio output or canvas rasterization.
w.scrollTo = () => {};
w.ResizeObserver = class { constructor(fn){this.fn=fn;} observe(){this.fn();} disconnect(){} };
d.fonts = { ready: Promise.resolve() };
const paths = [];
w.HTMLCanvasElement.prototype.getContext = () => ({setTransform(){},clearRect(){paths.length=0;},beginPath(){},moveTo(x,y){paths.push([x,y]);},lineTo(x,y){paths.push([x,y]);},stroke(){},measureText(t){return {width:t.length*45};}});
w.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({left:0,top:0,width:600,height:240});
w.HTMLCanvasElement.prototype.setPointerCapture = function(){this.captured=true;};
w.HTMLCanvasElement.prototype.hasPointerCapture = function(){return !!this.captured;};
const paused = [];
w.HTMLMediaElement.prototype.pause = function(){paused.push(this.id);};
w.print = () => {};
const previous = {version:1,completed:{intention:true},bookmarks:{priere:true},quiz:{intention:1},cards:{'intention-0':{rating:'known',due:1000}},notes:{intention:'Note conservée'},names:{'name-1':true},school:'all',lastLesson:'intention'};
w.localStorage.setItem('mon-deen-progress-v1', JSON.stringify(previous));
for (const script of d.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(dist,script.getAttribute('src')), 'utf8'));
const click = selector => {const el=d.querySelector(selector);assert.ok(el,selector);el.click();};
const change = (selector,value) => {const el=d.querySelector(selector);assert.ok(el,selector);el.value=String(value);el.dispatchEvent(new w.Event('change',{bubbles:true}));};
const nav = async route => {w.location.hash=route;await new Promise(resolve=>w.setTimeout(resolve,0));};
const pointer = (el,type,x,y) => {const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{isPrimary:true,button:0,pointerId:1,clientX:x,clientY:y});el.dispatchEvent(e);};
(async()=>{
  const lessons=w.DEEN_CONTENT.lessons;
  assert.equal(lessons.length,27);
  assert.equal(new Set(lessons.map(l=>l.id)).size,27);
  assert.equal(w.DEEN_READING.ids.length,14);
  assert.equal(new Set(w.DEEN_READING.ids).size,14);
  for(const id of w.DEEN_READING.ids)assert(lessons.some(l=>l.id===id));
  for(const l of lessons){assert(l.quiz.options[l.quiz.correct]);for(const s of l.sources)assert.equal(new URL(s.url).protocol,'https:');}
  // Every letter, every supported position, including all six one-sided connectors.
  for(const l of w.DEEN_ARABIC){
    click(`[data-w-letter="${l.id}"]`);
    const expected=l.joins?l.forms:[l.forms[0],l.forms[0],l.forms[1],l.forms[1]];
    assert.equal(d.querySelectorAll('[data-w-form]').length,4);
    for(let i=0;i<4;i++){click(`[data-w-form="${i}"]`);assert.equal(d.querySelector('#trace-guide').textContent,expected[i]);}
  }
  let canvas=d.querySelector('#trace-canvas');
  pointer(canvas,'pointerdown',100,100);pointer(canvas,'pointermove',200,120);pointer(canvas,'pointerup',200,120);
  assert.equal(d.querySelector('[data-w-undo]').disabled,false);
  assert(paths.length>=2);
  click('[data-w-guide]');assert.equal(d.querySelector('#trace-guide').hidden,true);assert.equal(d.querySelector('[data-w-undo]').disabled,false);
  click('[data-w-undo]');assert.equal(d.querySelector('[data-w-undo]').disabled,true);assert.equal(paths.length,0);
  click('[data-w-guide]');assert.equal(d.querySelector('#trace-guide').hidden,false);
  click('[data-w-mode="words"]');
  for(let i=0;i<w.DEEN_READING.words.length;i++){change('[data-w-word]',i);assert.equal(d.querySelector('#trace-guide').textContent,w.DEEN_READING.words[i][0]);}
  click('[data-w-mode="names"]');assert.equal(d.querySelector('[data-w-name]').options.length,100);
  for(const name of w.DEEN_NAMES){change('[data-w-name]',name.id);assert.equal(d.querySelector('#trace-guide').textContent,name.arabic);assert(d.querySelector('.writing-print').textContent.includes(name.arabic));}
  // Separate pronunciation view has no canvas; written letters retain their shape models.
  await nav('reading/sounds');assert.equal(d.querySelector('canvas'),null);assert.equal(d.querySelectorAll('[data-r-letter]').length,28);
  click('[data-r-filter="heavy"]');assert.equal(d.querySelectorAll('[data-r-letter]').length,7);
  click('[data-r-filter="solar"]');assert.equal(d.querySelectorAll('[data-r-letter]').length,14);
  await nav('reading');assert.equal(d.querySelectorAll('.reading-step').length,14);
  await nav('lesson/arabe-sons');assert(d.querySelector('.lesson-finish a').getAttribute('href').endsWith('lecture-voyelles'));
  let exerciseCount=0;
  for(const l of lessons.filter(l=>l.practice)){
    await nav('lesson/'+l.id);assert.equal(d.querySelectorAll('.practice-grid article').length,l.practice.length);exerciseCount+=l.practice.length;
    click(`[data-answer="${l.quiz.correct}"]`);assert(d.querySelector('.quiz-feedback').textContent.includes('Bien compris'));
  }
  await nav('reading/verses');assert.equal(d.querySelectorAll('audio').length,7);
  const first=d.querySelector('audio');first.dispatchEvent(new w.Event('play'));assert.equal(paused.filter(id=>id!==first.id).length,6);
  const loop=d.querySelector('[data-r-loop]');loop.checked=true;loop.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(first.loop,true);
  first.dispatchEvent(new w.Event('error'));assert.equal(d.querySelector('.audio-error').hidden,false);
  change('[data-r-chapter]',112);assert.equal(d.querySelectorAll('audio').length,4);assert(d.querySelector('audio').src.endsWith('112001.mp3'));
  for(const c of w.DEEN_READING.chapters)assert.equal(c.verses.length,c.id===1?7:4);
  const retained=JSON.parse(w.localStorage.getItem('mon-deen-progress-v1'));
  assert.equal(retained.completed.intention,true);assert.equal(retained.notes.intention,'Note conservée');assert.equal(retained.cards['intention-0'].rating,'known');assert.equal(retained.names['name-1'],true);
  const cacheText=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
  for(const script of d.querySelectorAll('script[src]'))assert(cacheText.includes(`'${script.getAttribute('src')}'`));
  for(const css of d.querySelectorAll('link[rel="stylesheet"]'))assert(cacheText.includes(`'${css.getAttribute('href')}'`));
  console.log(`OK: 112 formes, 10 mots, 99 noms + Allah, tracé/annulation, 14 étapes, ${exerciseCount} exercices, 11 audios, quiz et ancienne progression préservée.`);
  dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
