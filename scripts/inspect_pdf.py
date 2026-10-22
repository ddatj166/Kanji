import sys
import pypdf

reader = pypdf.PdfReader("/home/dattruong/Documents/JPNKanji/pdf/book2.pdf")
print("Total pages in book2.pdf:", len(reader.pages))

# Sample text from first 10 pages
for i in range(min(15, len(reader.pages))):
    page = reader.pages[i]
    text = page.extract_text() or ""
    num_images = len(page.images)
    print(f"\n=== Page {i+1} (Images: {num_images}, Text chars: {len(text)}) ===")
    if text.strip():
        print(text[:400].strip())
