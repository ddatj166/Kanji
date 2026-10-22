import pymupdf
import re

doc = pymupdf.open('/home/dattruong/Documents/JPNKanji/pdf/book2.pdf')

def clean_vietnamese(text):
    if not text:
        return ""
    t = text.replace('ƣ', 'ư').replace('Ƣ', 'Ư')
    t = t.replace('\u01a1', 'ơ').replace('\u01a0', 'Ơ')
    return t

page = doc[4] # page 5
text = clean_vietnamese(page.get_text())

# Split into top and bottom kanji sections
# Top starts with '1. 抑', bottom starts with '2. 迎'
pos1 = text.find('1. 抑')
pos2 = text.find('2. 迎')

sec1 = text[pos1:pos2]
sec2 = text[pos2:]

print("=== SEC 1 ===")
print(sec1[:300])

# Let's inspect examples in sec 1
# Examples have pattern: number \n kanji \n reading \n han_viet \n meaning
# Or let's see how lines are organized:
lines = [l.strip() for l in sec1.split('\n') if l.strip()]
print("\n=== Lines in Sec 1 ===")
for i, l in enumerate(lines[:35]):
    print(f"{i:02d}: {l}")
