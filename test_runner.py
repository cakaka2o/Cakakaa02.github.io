import json, time, unicodedata, sys
from caesar_cli import transform, norm_seq, expand_lig, strip_diac

def run():
    with open('test.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    tests = data.get('tests', [])
    start = time.time()
    failures = 0
    for i,t in enumerate(tests*100):  # repeat to increase speed/load if needed
        if i>=4000: break  # limit to 4000 operations
        inp = t['input']; shift=t.get('shift',1); lang=t.get('lang','es')
        enc = transform(inp, shift, lang)
        dec = transform(enc, -shift, lang)
        # normalize original similar to web: expand ligatures and strip diacritics preserving ñ
        def normalize_orig(s):
            out=''
            for ch in s:
                nf = unicodedata.normalize('NFD', ch)
                if len(nf)>=2 and nf[0].lower()=='n' and '\u0303' in nf:
                    out += 'Ñ' if nf[0].isupper() else 'ñ'
                else:
                    out += ''.join(c for c in nf if unicodedata.category(c)!='Mn')
            return out
        expected = normalize_orig(inp)
        if dec != expected:
            failures += 1
    elapsed = time.time() - start
    print(f'Ran {min(4000,len(tests)*100)} ops in {elapsed:.3f}s. Failures: {failures}')

if __name__=='__main__': run()
