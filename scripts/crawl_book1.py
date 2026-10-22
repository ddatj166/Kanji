import os
import re
import json
import time
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://m.lophoctiengnhat.com"
IMG_BASE_URL = "https://lophoctiengnhat.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

CACHE_DIR = "/home/dattruong/Documents/JPNKanji/data/cache_html"
IMG_DIR = "/home/dattruong/Documents/JPNKanji/public/images/book1"
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)

# Load metadata
with open('/home/dattruong/Documents/JPNKanji/data/kanji_meta.json', 'r', encoding='utf-8') as f:
    kanji_meta = json.load(f)

with open('/home/dattruong/Documents/JPNKanji/data/han_viet_map.json', 'r', encoding='utf-8') as f:
    han_viet_map = json.load(f)

# Lesson list
with open('/home/dattruong/Documents/JPNKanji/scripts/web_sample.html', 'r', encoding='utf-8') as f:
    list_html = f.read()

links = re.findall(r'href=[\'\"]([^\'\"]*(?:kanji_look_and_learn_B\d+|kanji-look-and-lear-n-第\d+課)[^\'\"]*)[\'\"][^>]*>(.*?)</a>', list_html, re.DOTALL | re.IGNORECASE)
lesson_map = {}
for href, text in links:
    clean_text = re.sub(r'<[^>]+>', '', text).strip()
    m = re.search(r'(?:第|Bài\s*)(\d+)', clean_text + ' ' + href)
    if m:
        num = int(m.group(1))
        if num not in lesson_map:
            lesson_map[num] = href

print(f"Total lessons to crawl: {len(lesson_map)}")

all_book1_kanji = []
session = requests.Session()
session.headers.update(HEADERS)

for lesson_num in sorted(lesson_map.keys()):
    href = lesson_map[lesson_num]
    cache_path = os.path.join(CACHE_DIR, f"lesson_{lesson_num:02d}.html")
    
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            html = f.read()
    else:
        url = f"{BASE_URL}/{href}"
        print(f"Fetching Lesson {lesson_num:02d}: {url}")
        try:
            resp = session.get(url, timeout=15)
            html = resp.text
            with open(cache_path, "w", encoding="utf-8") as f:
                f.write(html)
            time.sleep(0.5)
        except Exception as e:
            print(f"Error fetching lesson {lesson_num}: {e}")
            continue

    # Extract top nav 16 kanji
    nav_kanji = re.findall(r'<a class="linkto"\s+href="(\d+)">([^<]+)</a>', html)
    # Deduplicate while preserving order
    ordered_kanji = []
    seen = set()
    for _, char in nav_kanji:
        char = char.strip()
        if char and char not in seen:
            seen.add(char)
            ordered_kanji.append(char)

    # Split sections by <h2 class="section">
    sections = re.split(r'<h2 class="section">(.*?)</h2>', html)
    section_items = []
    for i in range(1, len(sections), 2):
        sec_title = sections[i].strip()
        sec_body = sections[i+1]
        if "練習" in sec_title or "renshuu" in sec_title.lower():
            continue
        section_items.append((sec_title, sec_body))

    print(f"Lesson {lesson_num:02d}: {len(ordered_kanji)} nav kanji, {len(section_items)} section items")

    # Match each item
    for idx in range(max(len(ordered_kanji), len(section_items))):
        char = ordered_kanji[idx] if idx < len(ordered_kanji) else ""
        sec_title, sec_body = section_items[idx] if idx < len(section_items) else ("", "")

        # Find image
        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', sec_body)
        local_img_path = ""
        if img_match:
            raw_img_src = img_match.group(1).lstrip('./')
            if raw_img_src.startswith('../'):
                raw_img_src = raw_img_src[3:]
            img_url = f"{IMG_BASE_URL}/{raw_img_src}"
            
            # Local filename
            img_filename = f"b1_{lesson_num:02d}_{idx+1:02d}.png"
            img_dest = os.path.join(IMG_DIR, img_filename)
            local_img_path = f"/images/book1/{img_filename}"
            
            if not os.path.exists(img_dest):
                try:
                    img_resp = session.get(img_url, timeout=10)
                    if img_resp.status_code == 200:
                        with open(img_dest, "wb") as img_f:
                            img_f.write(img_resp.content)
                    else:
                        print(f"  Img HTTP {img_resp.status_code}: {img_url}")
                except Exception as e:
                    print(f"  Img error: {e}")

        # Story
        story = ""
        # pattern: <td><p>(story)</p> or <td>(story)</td>
        story_match = re.search(r'<table class="khung-full"[^>]*>.*?<img[^>]+>.*?</td>\s*<td>(.*?)</td>', sec_body, re.DOTALL)
        if story_match:
            story = re.sub(r'<[^>]+>', '', story_match.group(1))
            story = story.replace("Xem thêm", "").strip()

        # Examples
        examples = []
        rows = re.findall(r'<tr>\s*<td>(\d+)</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*</tr>', sec_body, re.DOTALL)
        for r in rows:
            stt, k_word, hira, mean = r
            clean_k = re.sub(r'<[^>]+>', '', k_word).strip()
            clean_h = re.sub(r'<[^>]+>', '', hira).strip()
            clean_m = re.sub(r'<[^>]+>', '', mean).strip()
            if clean_k or clean_h or clean_m:
                examples.append({
                    "word": clean_k,
                    "reading": clean_h,
                    "meaning": clean_m
                })

        # Fallback for kanji character if nav was short
        if not char and examples:
            char = examples[0]["word"][0]

        # Metadata
        meta = kanji_meta.get(char, {})
        hv_info = han_viet_map.get(char, {})
        han_viet = hv_info.get("han_viet", "")
        meaning_vi = ""
        
        # If no meaning_vi from hv_info or if it's too long, use example 1 meaning
        if examples and len(examples[0]["word"]) == 1 and examples[0]["meaning"]:
            meaning_vi = examples[0]["meaning"]
        elif hv_info.get("meaning_vi"):
            meaning_vi = hv_info["meaning_vi"].split('/')[0].strip()

        kanji_entry = {
            "id": f"b1-{lesson_num:02d}-{idx+1:02d}",
            "book": 1,
            "lesson": lesson_num,
            "number": (lesson_num - 1) * 16 + (idx + 1),
            "kanji": char,
            "han_viet": han_viet,
            "meaning_vi": meaning_vi,
            "meaning_en": ", ".join(meta.get("meanings", [])[:3]),
            "onyomi": meta.get("readings_on", []),
            "kunyomi": meta.get("readings_kun", []),
            "strokes": meta.get("strokes", 0),
            "jlpt": f"N{meta.get('jlpt_new', 5)}" if meta.get("jlpt_new") else ("N5" if lesson_num <= 16 else "N4"),
            "mnemonic": {
                "image_url": local_img_path,
                "story": story
            },
            "examples": examples
        }
        all_book1_kanji.append(kanji_entry)

# Save book1.json
out_file = "/home/dattruong/Documents/JPNKanji/data/book1.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(all_book1_kanji, f, ensure_ascii=False, indent=2)

print(f"\nSUCCESS! Crawled and extracted {len(all_book1_kanji)} Kanji for Book 1 into {out_file}")
