\
    (function(){
    'use strict';
    // Final GitHub Pages–ready Caesar cipher (robust, preserves ñ, normalizes diacritics)
    const translations = {
      es: { title:'Cifrado César', lead:'Cifrado/Descifrado — compatible con Ñ y acentos', encrypt:'Encriptar', decrypt:'Desencriptar', copy:'Copiar resultado', download:'Descargar (.txt)', langNative:'Español' },
      en: { title:'Caesar Cipher', lead:'Encrypt/Decrypt — supports ñ and diacritics', encrypt:'Encrypt', decrypt:'Decrypt', copy:'Copy result', download:'Download (.txt)', langNative:'English' }
    };

    const ALPHABETS = {
      es: { upper:'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z'.split(' '), lower:'a b c d e f g h i j k l m n ñ o p q r s t u v w x y z'.split(' ') },
      en: { upper:'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' '), lower:'a b c d e f g h i j k l m n o p q r s t u v w x y z'.split(' ') }
    };

    const MAPS = {};
    for(const k of Object.keys(ALPHABETS)){
      const lower = ALPHABETS[k].lower, upper = ALPHABETS[k].upper;
      const lowerMap = Object.create(null);
      for(let i=0;i<lower.length;i++) lowerMap[lower[i]] = i;
      MAPS[k] = { lower, upper, lowerMap, len: lower.length };
    }

    const LIGATURES = {'Æ':'AE','æ':'ae','Œ':'OE','œ':'oe','ß':'ss','ẞ':'SS'};
    const cache = Object.create(null);

    function expandLig(ch){ return LIGATURES[ch] || ch; }

    function stripDiacriticsPreserveEnye(ch){
      try{
        const nf = ch.normalize('NFD');
        if(nf.length >= 2 && nf[0].toLowerCase() === 'n' && nf.indexOf('\u0303') !== -1){
          return nf[0] === nf[0].toUpperCase() ? 'Ñ' : 'ñ';
        }
      }catch(e){}
      try{ return ch.normalize('NFD').replace(/\p{M}/gu,''); }catch(e){ return ch.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
    }

    function normalizeCharSeq(ch){
      const key = 's:'+ch;
      if(cache[key] !== undefined) return cache[key];
      const exp = expandLig(ch);
      let out = '';
      for(let i=0;i<exp.length;i++) out += stripDiacriticsPreserveEnye(exp[i]);
      cache[key] = out;
      return out;
    }

    function transform(text, shift, lang){
      const m = MAPS[lang]; if(!m) return text;
      const { lowerMap, lower, upper, len } = m;
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
          if(idx === undefined){ part += isUpper ? base.toUpperCase() : base; }
          else { let r = (idx + shift) % len; if(r < 0) r += len; part += isUpper ? upper[r] : lower[r]; }
        }
        localCache[ch] = part; out += part;
      }
      return out;
    }

    window.caesarEncrypt = (t,s=1,lang='es') => transform(String(t), Number(s), lang);
    window.caesarDecrypt = (t,s=1,lang='es') => transform(String(t), -Number(s), lang);

    document.addEventListener('DOMContentLoaded', ()=>{
      const input = document.getElementById('inputText');
      const output = document.getElementById('outputText');
      const shift = document.getElementById('shift');
      const enc = document.getElementById('encryptBtn');
      const dec = document.getElementById('decryptBtn');
      const copy = document.getElementById('copyBtn');
      const dl = document.getElementById('downloadBtn');
      const lang = document.getElementById('langSelect');
      const preview = document.getElementById('normalizationPreview');
      const testLog = document.getElementById('testLog');

      function setLangUI(l){
        const t = translations[l] || translations['es'];
        document.getElementById('title').textContent = t.title;
        const lead = document.querySelector('.lead'); if(lead) lead.textContent = t.lead;
        enc.textContent = t.encrypt; dec.textContent = t.decrypt; copy.textContent = t.copy; dl.textContent = t.download;
        lang.querySelector('option[value=\"es\"]').textContent = translations['es'].langNative;
        lang.querySelector('option[value=\"en\"]').textContent = translations['en'].langNative;
      }
      setLangUI(lang.value);

      function updatePreview(){
        const txt = input.value || '';
        const items = []; let normalized='';
        for(const ch of txt){ const seq = normalizeCharSeq(ch); items.push(ch+' → '+seq); normalized += seq; }
        if(preview) preview.textContent = items.join('\\n') + '\\n\\nNormalized: ' + normalized;
      }

      input.addEventListener('input', updatePreview);
      shift.addEventListener('input', updatePreview);
      lang.addEventListener('change', ()=>{ setLangUI(lang.value); updatePreview(); });

      enc.addEventListener('click', ()=>{ output.value = window.caesarEncrypt(input.value, shift.value, lang.value); });
      dec.addEventListener('click', ()=>{ output.value = window.caesarDecrypt(input.value, shift.value, lang.value); });

      copy.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(output.value); copy.textContent = lang.value==='es' ? 'Copiado ✓' : 'Copied ✓'; setTimeout(()=> setLangUI(lang.value), 1200);}catch(e){} });
      dl.addEventListener('click', ()=>{ const blob = new Blob([output.value], {type:'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='resultado_caesar.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });

      // load tests if available
      fetch('test.json').then(r=> r.ok ? r.json() : null).then(data=>{
        if(!data || !Array.isArray(data.tests)) return;
        const tests = data.tests; const results=[]; const t0 = performance.now();
        for(let i=0;i<tests.length;i++){ const t = tests[i]; const encv = window.caesarEncrypt(t.input, t.shift, t.lang||'es'); const decv = window.caesarDecrypt(encv, t.shift, t.lang||'es'); const expected = (t.normalized !== undefined) ? t.normalized : (function(s){ let o=''; for(const ch of s){ o += normalizeCharSeq(ch) || ch;} return o})(t.input); results.push({i, ok: decv === expected}); }
        const ms = Math.round((performance.now()-t0)*1000)/1000; const out = `Ran ${tests.length} tests in ${ms} ms\\n` + results.map(r=> `${r.i}: ok=${r.ok}`).join('\\n'); if(testLog) testLog.textContent = out; console.log('[tests]', out);
      }).catch(()=>{});

      updatePreview();
    });
