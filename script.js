\
(function(){
'use strict';
console.log('[caesar v-ñfix] loaded');

const ALPHABETS = {
  es: { upper: 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z'.split(' '), lower: 'a b c d e f g h i j k l m n ñ o p q r s t u v w x y z'.split(' ') },
  en: { upper: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' '), lower: 'a b c d e f g h i j k l m n o p q r s t u v w x y z'.split(' ') }
};

const MAPS = {};
for(const lang of Object.keys(ALPHABETS)){
  const lower = ALPHABETS[lang].lower, upper = ALPHABETS[lang].upper, lm = Object.create(null);
  for(let i=0;i<lower.length;i++) lm[lower[i]] = i;
  MAPS[lang] = { lower, upper, lowerMap: lm, len: lower.length };
}

const LIGATURES = {'Æ':'AE','æ':'ae','Œ':'OE','œ':'oe','ß':'ss'};
const cache = Object.create(null);

function expandLig(ch){ return LIGATURES[ch] || ch; }

function stripDiacriticsPreserveEnye(ch){
  // Preserve ñ/Ñ: if NFD has base 'n' and combining tilde U+0303, return 'ñ' or 'Ñ'
  try{
    const nf = ch.normalize('NFD');
    if(nf.length >= 2 && nf[0].toLowerCase() === 'n' && nf.indexOf('\u0303') !== -1){
      return (nf[0] === nf[0].toUpperCase()) ? 'Ñ' : 'ñ';
    }
  }catch(e){
    // ignore
  }
  // Otherwise remove combining marks
  try{
    return ch.normalize('NFD').replace(/\p{M}/gu, '');
  }catch(e){
    return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}

function normalizeCharSeq(ch){
  const key = 's:'+ch;
  if(cache[key] !== undefined) return cache[key];
  const exp = expandLig(ch);
  let out = '';
  for(let i=0;i<exp.length;i++){
    out += stripDiacriticsPreserveEnye(exp[i]);
  }
  cache[key] = out;
  return out;
}

function transform(text, shift, lang){
  const m = MAPS[lang]; if(!m) return text;
  const {lowerMap, lower, upper, len} = m;
  const localCache = Object.create(null);
  let out = '';
  for(const ch of String(text)){
    if(localCache[ch] !== undefined){ out += localCache[ch]; continue; }
    const seq = normalizeCharSeq(ch);
    if(!seq){ localCache[ch] = ch; out += ch; continue; }
    const isUpper = (ch.toUpperCase() === ch) && (ch.toLowerCase() !== ch);
    let part = '';
    for(const base of seq){
      const idx = lowerMap[base.toLowerCase()];
      if(idx === undefined){ part += isUpper?base.toUpperCase():base; }
      else { let r = (idx + shift) % len; if(r<0) r += len; part += isUpper?upper[r]:lower[r]; }
    }
    localCache[ch] = part; out += part;
  }
  return out;
}

window.caesarEncrypt = (t,s=1,lang='es') => transform(String(t), Number(s), lang);
window.caesarDecrypt = (t,s=1,lang='es') => transform(String(t), -Number(s), lang);

// add simple UI wiring and self-test runner that uses test.json if present
document.addEventListener('DOMContentLoaded', ()=>{
  const input = document.getElementById('inputText');
  const output = document.getElementById('outputText');
  const shiftEl = document.getElementById('shift');
  const enc = document.getElementById('encryptBtn');
  const dec = document.getElementById('decryptBtn');
  const copy = document.getElementById('copyBtn');
  const langSel = document.getElementById('langSelect');
  const log = document.getElementById('testLog');

  enc.addEventListener('click', ()=> output.value = window.caesarEncrypt(input.value, shiftEl.value, langSel.value) );
  dec.addEventListener('click', ()=> output.value = window.caesarDecrypt(input.value, shiftEl.value, langSel.value) );
  copy.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(output.value); copy.textContent='Copiado ✓'; setTimeout(()=>copy.textContent='Copiar',1000);}catch(e){} });

  // Try to load test.json (from same folder) and run tests fast
  fetch('test.json').then(r=> r.ok ? r.json() : null).then(data=>{
    if(!data || !Array.isArray(data.tests)) return;
    const tests = data.tests;
    const results = [];
    const t0 = performance.now();
    for(let i=0;i<tests.length;i++){
      const t = tests[i];
      const enc = window.caesarEncrypt(t.input, t.shift, t.lang || 'es');
      const dec = window.caesarDecrypt(enc, t.shift, t.lang || 'es');
      const ok = dec === (t.normalized || normalizeOriginal(t.input));
      results.push({i, input: t.input, enc, dec, ok});
    }
    const ms = Math.round((performance.now() - t0)*1000)/1000;
    let out = `Ran ${tests.length} tests in ${ms} ms\n\n` + results.map(r=> `${r.i}: ok=${r.ok} input="${r.input}" enc="${r.enc}" dec="${r.dec}"`).join('\n');
    if(log) log.textContent = out;
    console.log('[caesar tests]', out);
  }).catch(()=>{});

  function normalizeOriginal(s){ let o=''; for(const ch of s) o += normalizeCharSeq(ch)||ch; return o; }

});
})();\
