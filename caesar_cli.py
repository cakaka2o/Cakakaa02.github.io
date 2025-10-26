# caesar_cli.py - GitHub Pages ready normalization (preserve ñ)
import argparse, unicodedata
ALPHABETS = {
    'es': ('A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z'.split(' '),
           'a b c d e f g h i j k l m n ñ o p q r s t u v w x y z'.split(' ')),
    'en': ('A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' '),
           'a b c d e f g h i j k l m n o p q r s t u v w x y z'.split(' '))
}
LIGATURES = {'Æ':'AE','æ':'ae','Œ':'OE','œ':'oe','ß':'ss'}

def expand_lig(ch): return LIGATURES.get(ch,ch)
def strip_diac(ch):
    nf = unicodedata.normalize('NFD', ch)
    if len(nf) >= 2 and nf[0].lower() == 'n' and '\u0303' in nf:
        return 'Ñ' if nf[0].isupper() else 'ñ'
    return ''.join(c for c in nf if unicodedata.category(c) != 'Mn')

def norm_seq(ch):
    expanded = expand_lig(ch)
    return ''.join(strip_diac(c) for c in expanded)

def build_map(lang):
    upper, lower = ALPHABETS[lang]
    lower_map = {c:i for i,c in enumerate(lower)}
    return lower_map, upper, lower, len(lower)

def transform(text, shift, lang):
    lower_map, upper_arr, lower_arr, length = build_map(lang)
    out = []
    cache = {}
    for ch in text:
        if ch in cache:
            out.append(cache[ch]); continue
        seq = norm_seq(ch)
        if not seq:
            cache[ch] = ch; out.append(ch); continue
        is_upper = ch.upper() == ch and ch.lower() != ch
        part = []
        for base in seq:
            idx = lower_map.get(base.lower())
            if idx is None:
                part.append(base.upper() if is_upper else base)
            else:
                r = (idx + shift) % length
                if r < 0: r += length
                part.append(upper_arr[r] if is_upper else lower_arr[r])
        s = ''.join(part)
        cache[ch] = s
        out.append(s)
    return ''.join(out)

def main():
    parser = argparse.ArgumentParser(description='Caesar CLI (GitHub Pages ready)')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-e','--encrypt', help='Text to encrypt', type=str)
    group.add_argument('-d','--decrypt', help='Text to decrypt', type=str)
    parser.add_argument('-s','--shift', help='Shift amount', type=int, default=3)
    parser.add_argument('-l','--lang', help='Language (es|en)', choices=['es','en'], default='es')
    args = parser.parse_args()
    if args.encrypt:
        print(transform(args.encrypt, args.shift, args.lang))
    else:
        print(transform(args.decrypt, -args.shift, args.lang))

if __name__ == '__main__':
    main()
