import json, time, unicodedata
from caesar_cli import transform
def normalize_orig(s):
    out=''
    for ch in s:
        nf = unicodedata.normalize('NFD', ch)
        if len(nf)>=2 and nf[0].lower()=='n' and '\u0303' in nf:
            out += 'Ñ' if nf[0].isupper() else 'ñ'
        else:
            out += ''.join(c for c in nf if unicodedata.category(c)!='Mn')
    return out
def run():
    with open('test.json','r',encoding='utf-8') as f:
        data = json.load(f)
    tests = data.get('tests', [])
    start = time.time()
    failures = 0
    ops = 0
    for rep in range(100):
        for t in tests:
            ops += 1
            enc = transform(t['input'], t['shift'], t.get('lang','es'))
            dec = transform(enc, -t['shift'], t.get('lang','es'))
            if dec != normalize_orig(t['input']):
                failures += 1
    elapsed = time.time() - start
    print(f'Ran {ops} ops in {elapsed:.3f}s. Failures: {failures}')
if __name__=='__main__': run()
