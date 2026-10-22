import json

with open('/home/dattruong/Documents/JPNKanji/data/book1.json', 'r', encoding='utf-8') as f:
    b1 = json.load(f)

with open('/home/dattruong/Documents/JPNKanji/data/book2.json', 'r', encoding='utf-8') as f:
    b2 = json.load(f)

all_kanji = b1 + b2
with open('/home/dattruong/Documents/JPNKanji/data/kanji_all.json', 'w', encoding='utf-8') as f:
    json.dump(all_kanji, f, ensure_ascii=False)

# Also create empty custom_kanji.json if not exists
import os
custom_file = '/home/dattruong/Documents/JPNKanji/data/custom_kanji.json'
if not os.path.exists(custom_file):
    with open(custom_file, 'w', encoding='utf-8') as f:
        json.dump([], f)

os.makedirs('/home/dattruong/Documents/JPNKanji/public/images/custom', exist_ok=True)
print(f"Combined {len(b1)} (Book 1) + {len(b2)} (Book 2) = {len(all_kanji)} total Kanji in kanji_all.json")
