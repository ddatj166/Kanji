import pymupdf
import re

doc = pymupdf.open('/home/dattruong/Documents/JPNKanji/pdf/book2.pdf')

def clean_vietnamese(text):
    if not text:
        return ""
    t = text.replace('ƣ', 'ư').replace('Ƣ', 'Ư')
    t = t.replace('\u01a1', 'ơ').replace('\u01a0', 'Ơ')
    return t

found_pages = []
for pno in range(4, len(doc)):
    text = clean_vietnamese(doc[pno].get_text())
    m = re.findall(r'(\d+)\.\s+([一-龯])\s+([^\n]+)', text)
    if m:
        # Check if it has '訓:' or '音:'
        if '訓:' in text or '音:' in text:
            found_pages.append((pno + 1, [x[0] for x in m]))

print(f"Total content pages found: {len(found_pages)}")
print(f"First page: {found_pages[0]}")
print(f"Last page: {found_pages[-1]}")
