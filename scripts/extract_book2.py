import os
import re
import json
import pymupdf

PDF_PATH = "/home/dattruong/Documents/JPNKanji/pdf/book2.pdf"
IMG_DIR = "/home/dattruong/Documents/JPNKanji/public/images/book2"
os.makedirs(IMG_DIR, exist_ok=True)

# Load metadata
with open('/home/dattruong/Documents/JPNKanji/data/kanji_meta.json', 'r', encoding='utf-8') as f:
    kanji_meta = json.load(f)

with open('/home/dattruong/Documents/JPNKanji/data/han_viet_map.json', 'r', encoding='utf-8') as f:
    han_viet_map = json.load(f)

def clean_vietnamese(text):
    if not text:
        return ""
    t = text.replace('ƣ', 'ư').replace('Ƣ', 'Ư')
    t = t.replace('\u01a1', 'ơ').replace('\u01a0', 'Ơ')
    return t

doc = pymupdf.open(PDF_PATH)
all_book2_kanji = []

def parse_section(sec_text, num, char, page, is_top):
    # Short meaning from title line: e.g. "1. 抑    ức    ức chế    yoku"
    meaning_vi = ""
    title_m = re.search(r'\d+\.\s+[一-龯]\s+([^\n]+)', sec_text)
    if title_m:
        parts = [p.strip() for p in re.split(r'\s{2,}', title_m.group(1)) if p.strip()]
        if len(parts) >= 2:
            meaning_vi = parts[1]
        elif len(parts) == 1:
            meaning_vi = parts[0]

    # Story is after title line, before 訓:
    story = ""
    story_m = re.search(r'\d+\.\s+[一-龯][^\n]+\n+(.*?)(?=訓:|$)', sec_text, re.DOTALL)
    if story_m:
        raw_s = " ".join([l.strip() for l in story_m.group(1).split('\n') if l.strip()])
        # clean any leftover keywords
        story = re.sub(r'^(?:[^\w\s]+|[a-z]+\s+)+', '', raw_s).strip()

    # Kunyomi: between 訓: and 音:
    kun = []
    kun_m = re.search(r'訓:\s*(.*?)(?=\s*音:|\Z)', sec_text, re.DOTALL)
    if kun_m:
        raw_k = re.sub(r'\s+', '', kun_m.group(1))
        kun = [k for k in raw_k.split(',') if k]

    # Onyomi: between 音: and examples
    on = []
    on_m = re.search(r'音:\s*(.*?)(?=\s*\n\s*\d+\s*(?:\n|[^\d\n])|\Z)', sec_text, re.DOTALL)
    if on_m:
        raw_o = re.sub(r'\s+', '', on_m.group(1))
        on = [o for o in raw_o.split(',') if o]

    # Han Viet lookup
    hv_info = han_viet_map.get(char, {})
    han_viet = hv_info.get("han_viet", "")
    if not han_viet:
        # Fallback to search in page text around char
        pre_match = re.search(rf'([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+)\n+\d+\.\s+{char}', sec_text)
        if pre_match:
            han_viet = pre_match.group(1).strip()

    # Examples
    examples = []
    ex_start = sec_text.find('音:')
    if ex_start != -1:
        ex_content = sec_text[ex_start:]
        blocks = re.split(r'\n\s*(\d+)\s*\n', ex_content)
        for i in range(1, len(blocks), 2):
            ex_text = blocks[i+1].strip()
            lines = [l.strip() for l in ex_text.split('\n') if l.strip()]
            if not lines:
                continue
            
            first_line = lines[0]
            parts = first_line.split()
            word = parts[0]
            reading = parts[1] if len(parts) > 1 else ""
            
            rem = lines[1:]
            if not reading and rem:
                reading = rem[0]
                rem = rem[1:]
            
            hv = ""
            mean_parts = []
            for l in rem:
                if re.match(r'^[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+$', l) and len(l) > 1:
                    hv = l.strip()
                else:
                    mean_parts.append(l.strip())
            
            clean_ex_mean = " ".join(mean_parts).strip().rstrip(' .')
            examples.append({
                "word": word,
                "reading": reading,
                "han_viet": hv,
                "meaning": clean_ex_mean
            })

    # Image Extraction
    img_filename = f"b2_{num:04d}_{char}.jpg"
    img_dest = os.path.join(IMG_DIR, img_filename)
    local_img_path = f"/images/book2/{img_filename}"

    # Extract image from page
    img_list = page.get_images(full=True)
    valid_imgs = []
    for img in img_list:
        xref = img[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        r = rects[0]
        if r.y0 > 790 or r.height < 30:
            continue
        valid_imgs.append((r.y0, xref, r))

    valid_imgs.sort(key=lambda x: x[0])
    extracted = False

    if is_top:
        if len(valid_imgs) >= 1 and valid_imgs[0][0] < 380:
            base_img = doc.extract_image(valid_imgs[0][1])
            with open(img_dest, 'wb') as f:
                f.write(base_img['image'])
            extracted = True
    else:
        bot_cand = [it for it in valid_imgs if it[0] >= 350]
        if bot_cand:
            base_img = doc.extract_image(bot_cand[0][1])
            with open(img_dest, 'wb') as f:
                f.write(base_img['image'])
            extracted = True

    if not extracted:
        # Fallback clip
        clip_rect = pymupdf.Rect(140, 30, 310, 200) if is_top else pymupdf.Rect(140, 410, 310, 580)
        pix = page.get_pixmap(clip=clip_rect, dpi=150)
        pix.save(img_dest)

    # Metadata
    meta = kanji_meta.get(char, {})
    if not meaning_vi and hv_info.get("meaning_vi"):
        meaning_vi = hv_info["meaning_vi"].split('/')[0].strip()

    lesson_num = (num - 1) // 16 + 1

    return {
        "id": f"b2-{lesson_num:02d}-{num:03d}",
        "book": 2,
        "lesson": lesson_num,
        "number": num,
        "kanji": char,
        "han_viet": han_viet,
        "meaning_vi": meaning_vi,
        "meaning_en": ", ".join(meta.get("meanings", [])[:3]),
        "onyomi": on if on else meta.get("readings_on", []),
        "kunyomi": kun if kun else meta.get("readings_kun", []),
        "strokes": meta.get("strokes", 0),
        "jlpt": f"N{meta.get('jlpt_new', 3)}" if meta.get("jlpt_new") else "N3",
        "mnemonic": {
            "image_url": local_img_path,
            "story": story
        },
        "examples": examples
    }

# Process all pages from 5 to 168 (index 4 to 167)
for pno in range(4, 168):
    page = doc[pno]
    text = clean_vietnamese(page.get_text())

    matches = list(re.finditer(r'(\d+)\.\s+([一-龯])', text))
    if not matches:
        continue

    if len(matches) == 1:
        m1 = matches[0]
        num1 = int(m1.group(1))
        char1 = m1.group(2)
        entry1 = parse_section(text[m1.start():], num1, char1, page, is_top=True)
        all_book2_kanji.append(entry1)
    elif len(matches) >= 2:
        m1 = matches[0]
        m2 = matches[1]
        num1 = int(m1.group(1))
        char1 = m1.group(2)
        sec1 = text[m1.start():m2.start()]
        entry1 = parse_section(sec1, num1, char1, page, is_top=True)
        all_book2_kanji.append(entry1)

        num2 = int(m2.group(1))
        char2 = m2.group(2)
        sec2 = text[m2.start():]
        entry2 = parse_section(sec2, num2, char2, page, is_top=False)
        all_book2_kanji.append(entry2)

# Sort by number
all_book2_kanji.sort(key=lambda x: x["number"])

out_file = "/home/dattruong/Documents/JPNKanji/data/book2.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(all_book2_kanji, f, ensure_ascii=False, indent=2)

print(f"\nSUCCESS! Extracted {len(all_book2_kanji)} Kanji and images for Book 2 into {out_file}")
