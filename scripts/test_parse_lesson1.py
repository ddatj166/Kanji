import re
import json

with open("/home/dattruong/Documents/JPNKanji/scripts/lesson1.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's extract kanji sections
# Each section typically has:
# - An image: src="../public/lesson/giaotrinh/kanji_look_and_lea_r_n/..."
# - A mnemonic story
# - A kanji button with rel="..."
# - A table of examples

# Split by section headers or by images
# Let's find all rel="([^"]+)" or searchht
kanjis = re.findall(r'class="button seachht"\s+rel="([^"]+)"', html)
print(f"Found {len(kanjis)} kanjis via rel:")
print(kanjis)

# Let's inspect each kanji block
# Notice tables with class "khung-full"
blocks = re.findall(r'<table class="khung-full".*?(?=<table class="khung-full"|<h2|$)', html, re.DOTALL)
print(f"Found {len(blocks)} khung-full blocks")

for i, b in enumerate(blocks[:3]):
    img_m = re.search(r'<img[^>]+src="([^"]+)"', b)
    rel_m = re.search(r'rel="([^"]+)"', b)
    story_m = re.search(r'<td><p>(.*?)</p><p><a class="button seachht"', b, re.DOTALL)
    
    img = img_m.group(1) if img_m else None
    kanji = rel_m.group(1) if rel_m else None
    story = story_m.group(1).strip() if story_m else None
    print(f"\n--- Item {i+1} ---")
    print("Kanji:", kanji)
    print("Image:", img)
    print("Story:", story)
