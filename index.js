
// Optimized Caesar cipher script with normalization caching for speed.
// Designed to avoid repeated Unicode normalization on the same characters.
// Should be much faster on repeated operations and avoid long delays.
// Exposes window.caesarEncrypt / window.caesarDecrypt and shows operation time in console.

(function(){
  'use strict';
  console.log('[cifrador optimized] script loaded');

  // Spanish alphabet including Ñ
  const ALPHABET_UPPER = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const ALPHABET_LOWER = ALPHABET_UPPER.map(c => c.toLowerCase());
  const ALPHABET_LEN = ALPHABET_LOWER.length;

  // Map for quick lookup
  const INDEX_MAP = Object.create(null);
  for(let i=0;i<ALPHABET_LEN;i++) INDEX_MAP[ALPHABET_LOWER[i]] = i;

  // Common ligatures map
  const LIGATURES = { 'Æ':'AE','æ':'ae','Œ':'OE','œ':'oe','ß':'ss' };

  // Cache for normalized characters -> base sequence
  const normCache = Object.create(null);

  function expandLigatureChar(ch){
    return LIGATURES[ch] || ch;
  }

  function stripDiacriticsCharFast(ch){
    // Try to use cached result: avoid repeated normalize calls per-character
    const cached = normCache[ch];
    if(cached !== undefined) return cached;
    let out;
    try{
      out = ch.normalize('NFD').replace(/\p{M}/gu, '');
    }catch(e){
      out = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    normCache[ch] = out;
    return out;
  }

  function normalizeCharToBaseSeq(ch){
    // Use cache for full expansion result too
    const cached = normCache['seq:' + ch];
    if(cached !== undefined) return cached;
    const expanded = expandLigatureChar(ch);
    let out = '';
    for(let i=0;i<expanded.length;i++){
      out += stripDiacriticsCharFast(expanded[i]);
    }
    normCache['seq:' + ch] = out;
    return out;
  }

  // Fast transformation: compute once per unique character in input to minimize work
  function transformFast(text, shift){
    const start = performance.now();
    const mapPerChar = Object.create(null); // origChar -> transformed string
    let out = '';
    for(let i=0;i<text.length;i++){
      const ch = text[i];
      if(mapPerChar[ch] !== undefined){
        out += mapPerChar[ch];
        continue;
      }
      const seq = normalizeCharToBaseSeq(ch);
      if(!seq){
        mapPerChar[ch] = ch;
        out += ch;
        continue;
      }
      const origIsUpper = (ch.toUpperCase() === ch) && (ch.toLowerCase() !== ch);
      let part = '';
      for(let j=0;j<seq.length;j++){
        const base = seq[j];
        const baseLower = base.toLowerCase();
        const idx = INDEX_MAP[baseLower];
        if(idx === undefined){
          part += (origIsUpper ? base.toUpperCase() : base);
        } else {
          const newIdx = (idx + shift) % ALPHABET_LEN;
          const finalIdx = newIdx < 0 ? newIdx + ALPHABET_LEN : newIdx;
          part += (origIsUpper ? ALPHABET_UPPER[finalIdx] : ALPHABET_LOWER[finalIdx]);
        }
      }
      mapPerChar[ch] = part;
      out += part;
    }
    const ms = Math.round((performance.now() - start) * 1000) / 1000;
    console.log('[cifrador optimized] transformFast done in', ms, 'ms for', text.length, 'chars (unique cache size', Object.keys(mapPerChar).length + ')');
    return out;
  }

  function encrypt(text, shift){ return transformFast(String(text), Number(shift) || 0); }
  function decrypt(text, shift){ return transformFast(String(text), -(Number(shift) || 0)); }

  // expose to console
  window.caesarEncrypt = (t,s=1) => encrypt(String(t), Number(s));
  window.caesarDecrypt = (t,s=1) => decrypt(String(t), Number(s));

  // DOM wiring
  function ready(){
    const input = document.getElementById('input-original');
    const resultado = document.getElementById('resultado');
    const rango = document.getElementById('rango');
    const btnEncrypt = document.getElementById('btn-encrypt');
    const btnDecrypt = document.getElementById('btn-decrypt');
    if(!input || !resultado || !rango || !btnEncrypt || !btnDecrypt){
      console.error('[cifrador optimized] DOM elements missing:', {input, resultado, rango, btnEncrypt, btnDecrypt});
      return;
    }

    function show(text){
      resultado.textContent = text;
    }

    btnEncrypt.addEventListener('click', ()=>{
      const txt = input.value || '';
      const shift = parseInt(rango.value, 10) || 0;
      show( encrypt(txt, shift) );
    });

    btnDecrypt.addEventListener('click', ()=>{
      const txt = input.value || '';
      const shift = parseInt(rango.value, 10) || 0;
      show( decrypt(txt, shift) );
    });

    // performance test helper: double-click result to copy to input
    resultado.addEventListener('dblclick', ()=>{
      try{ input.value = resultado.textContent; }catch(e){}
    });

    console.log('[cifrador optimized] ready');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else setTimeout(ready, 0);

})();
