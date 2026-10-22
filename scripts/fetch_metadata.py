import requests
import json
import os

print("Downloading kanji-data...")
r_kanji = requests.get('https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json')
kanji_meta = r_kanji.json()
with open('/home/dattruong/Documents/JPNKanji/data/kanji_meta.json', 'w', encoding='utf-8') as f:
    json.dump(kanji_meta, f, ensure_ascii=False)
print("Saved kanji_meta.json, total entries:", len(kanji_meta))

print("Downloading xue-hanzi for Sino-Vietnamese (Hán Việt)...")
r_hanzi = requests.get('https://raw.githubusercontent.com/phucbm/xue-hanzi/main/public/data/dictionary.json')
dict_list = r_hanzi.json()

han_viet_map = {}
for entry in dict_list:
    # entry keys: ['s', 't', 'p', 'pt', 'sp', 'b', 'vi', 'sv', 'en']
    # 'sv' is Sino-Vietnamese (Hán Việt), 's' is simplified, 't' is traditional
    sv = entry.get('sv')
    if sv:
        s = entry.get('s')
        t = entry.get('t')
        vi = entry.get('vi')
        for char in [s, t]:
            if char and len(char) == 1 and char not in han_viet_map:
                han_viet_map[char] = {
                    "han_viet": sv.upper(),
                    "meaning_vi": vi or ""
                }

with open('/home/dattruong/Documents/JPNKanji/data/han_viet_map.json', 'w', encoding='utf-8') as f:
    json.dump(han_viet_map, f, ensure_ascii=False, indent=2)
print("Saved han_viet_map.json, total characters:", len(han_viet_map))

# Test with some characters
for char in ['日', '月', '木', '山', '川', '一', '二', '三']:
    print(f"{char}: {han_viet_map.get(char)}")
