# caesar_tool.py - fast CLI for Caesar cipher (supports Spanish Ñ, diacritics and ligatures)
import argparse, unicodedata, sys

ALPHABET_UPPER = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z']
ALPHABET_LOWER = [c.lower() for c in ALPHABET_UPPER]
INDEX_MAP = {c:i for i,c in enumerate(ALPHABET_LOWER)}
LIGATURES = {'Æ':'AE','æ':'ae','Œ':'OE','œ':'oe','ß':'ss'}

def expand_ligature(ch):
    return LIGATURES.get(ch, ch)

def strip_diacritics(ch):
    nf = unicodedata.normalize('NFD', ch)
    return ''.join(c for c in nf if unicodedata.category(c) != 'Mn')

def normalize_char_seq(ch):
    expanded = expand_ligature(ch)
    return ''.join(strip_diacritics(c) for c in expanded)

def shift_index(base_lower, shift):
    idx = INDEX_MAP.get(base_lower)
    if idx is None:
        return None
    n = (idx + shift) % len(ALPHABET_LOWER)
    return n

def transform(text, shift):
    out_chars = []
    # cache per unique char
    cache = {}
    for ch in text:
        if ch in cache:
            out_chars.append(cache[ch])
            continue
        seq = normalize_char_seq(ch)
        if not seq:
            cache[ch] = ch
            out_chars.append(ch)
            continue
        is_upper = ch.upper() == ch and ch.lower() != ch
        part = []
        for base in seq:
            base_lower = base.lower()
            idx = shift_index(base_lower, shift)
            if idx is None:
                part.append(base.upper() if is_upper else base)
            else:
                part.append(ALPHABET_UPPER[idx] if is_upper else ALPHABET_LOWER[idx])
        part_str = ''.join(part)
        cache[ch] = part_str
        out_chars.append(part_str)
    return ''.join(out_chars)

def main():
    parser = argparse.ArgumentParser(description='Caesar cipher CLI (fast)')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-e','--encrypt', help='Text to encrypt', type=str)
    group.add_argument('-d','--decrypt', help='Text to decrypt', type=str)
    parser.add_argument('-s','--shift', help='Shift amount', type=int, default=3)
    parser.add_argument('-o','--output', help='Save result to file', type=str)
    args = parser.parse_args()

    if args.encrypt:
        res = transform(args.encrypt, args.shift)
    else:
        res = transform(args.decrypt, -args.shift)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(res)
        print('Saved to', args.output)
    else:
        print(res)

if __name__ == '__main__':
    main()
