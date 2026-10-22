import pymupdf
import re
import json

doc = pymupdf.open('/home/dattruong/Documents/JPNKanji/pdf/book2.pdf')

def clean_vietnamese(text):
    if not text:
        return ""
    # Fix corrupted horn characters from old Vietnamese fonts
    t = text.replace('ƣ', 'ư').replace('Ƣ', 'Ư')
    t = t.replace('\u01a1', 'ơ').replace('\u01a0', 'Ơ')
    return t

for page_idx in range(4, 8):
    page = doc[page_idx]
    text = clean_vietnamese(page.get_text())
    print(f"\n================ PAGE {page_idx+1} ================")
    # Print lines
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    print("Total lines:", len(lines))
    print("\n".join(lines[:25]))
