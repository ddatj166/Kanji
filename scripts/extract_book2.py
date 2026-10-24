import os
import re
import json
import pymupdf

PDF_PATH = "/home/dattruong/Documents/JPNKanji/pdf/book2.pdf"
IMG_DIR = "/home/dattruong/Documents/JPNKanji/public/images/book2"
os.makedirs(IMG_DIR, exist_ok=True)

with open('/home/dattruong/Documents/JPNKanji/data/kanji_meta.json', 'r', encoding='utf-8') as f:
    kanji_meta = json.load(f)

with open('/home/dattruong/Documents/JPNKanji/data/han_viet_map.json', 'r', encoding='utf-8') as f:
    han_viet_map = json.load(f)

SUPPLEMENTAL_HV = {
    "円": ("VIÊN", "hình tròn, đồng Yên"),
    "曜": ("DIỆU", "ngày trong tuần"),
    "寺": ("TỰ", "ngôi chùa"),
    "北": ("BẮC", "hướng bắc, phía bắc"),
    "何": ("HÀ", "cái gì"),
    "毎": ("MỖI", "mỗi (mỗi ngày, mỗi tháng)"),
    "米": ("MỄ", "gạo, nước Mỹ"),
    "食": ("THỰC", "ăn, thức ăn"),
    "気": ("KHÍ", "tinh thần, không khí"),
    "広": ("QUẢNG", "rộng, rộng rãi"),
    "町": ("ĐINH", "thị trấn, con phố"),
    "電": ("ĐIỆN", "điện"),
    "駅": ("DỊCH", "ga, nhà ga"),
    "売": ("MẠI", "bán, bán hàng"),
    "読": ("ĐỘC", "đọc"),
    "帰": ("QUY", "về, trở về"),
    "春": ("XUÂN", "mùa xuân"),
    "夏": ("HẠ", "mùa hè"),
    "昼": ("TRÚ", "buổi trưa"),
    "晩": ("VÃN", "buổi tối, ban đêm"),
    "黒": ("HẮC", "màu đen"),
    "犬": ("KHUYỂN", "con chó"),
    "飯": ("PHẠN", "cơm, bữa ăn"),
    "豚": ("ĐỒN", "con heo, lợn"),
    "肉": ("NHỤC", "thịt"),
    "菜": ("THÁI", "rau, món ăn"),
    "楽": ("LẠC, NHẠC", "vui vẻ, âm nhạc"),
    "転": ("CHUYỂN", "chuyển động, xoay"),
    "乗": ("THỪA", "lên xe, cưỡi"),
    "糸": ("MỊCH, TY", "chỉ, sợi chỉ"),
    "験": ("NGHIỆM", "thử nghiệm, kỳ thi"),
    "題": ("ĐỀ", "chủ đề, đề bài"),
    "問": ("VẤN", "hỏi, vấn đề"),
    "者": ("GIẢ", "người (học giả, tác giả)"),
    "暑": ("THỬ", "nóng, oi bức"),
    "軽": ("KHINH", "nhẹ, nhẹ nhàng"),
    "悪": ("ÁC, Ố", "xấu, ác"),
    "歩": ("BỘ", "đi bộ, bước đi"),
    "薬": ("DƯỢC", "thuốc"),
    "働": ("ĐỘNG", "làm việc, lao động"),
    "図": ("ĐỒ", "bản đồ, hình vẽ"),
    "貸": ("THẢI", "cho mượn, cho vay"),
    "以": ("DĨ", "lấy làm mốc (trở lên, trở xuống)"),
    "戸": ("HỘ", "cánh cửa, hộ gia đình"),
    "県": ("HUYỆN", "tỉnh (của Nhật)"),
    "発": ("PHÁT", "xuất phát, phát âm"),
    "卵": ("NOÃN", "trứng, quả trứng"),
    "酒": ("TỬU", "rượu"),
    "塩": ("DIÊM", "muối"),
    "焼": ("THIÊU", "nướng, đốt cháy"),
    "笑": ("TIẾU", "cười, mỉm cười"),
    "恥": ("SỈ", "xấu hổ, ngượng"),
    "覚": ("GIÁC", "nhớ, cảm giác"),
    "荷": ("HÀ", "hành lý, đồ đạc"),
    "届": ("GIỚI", "gửi đến, chuyển đến"),
    "濯": ("TRẠC", "giặt giũ"),
    "寝": ("TẨM", "ngủ, nằm nghỉ"),
    "踊": ("DŨNG", "nhảy múa, khiêu vũ"),
    "宅": ("TRẠCH", "nhà ở"),
    "戦": ("CHIẾN", "chiến đấu, chiến tranh"),
    "経": ("KINH", "trải qua, kinh tế"),
    "済": ("TẾ", "hoàn tất, kinh tế"),
    "際": ("TẾ", "quốc tế, dịp"),
    "関": ("QUAN", "quan hệ, liên quan"),
    "党": ("ĐẢNG", "đảng phái, chính đảng"),
    "泳": ("VỊNH", "bơi, bơi lội"),
    "暖": ("NOÃN", "ấm áp"),
    "静": ("TĨNH", "yên tĩnh, thanh bình"),
    "込": ("NHẬP", "đông đúc, bao gồm"),
    "婚": ("HÔN", "kết hôn, hôn nhân"),
    "両": ("LƯỠNG", "cả hai, hai bên"),
    "々": ("ĐỒNG", "dấu lặp chữ Hán"),
    "賛": ("TÁN", "tán thành, khen ngợi"),
    "対": ("ĐỐI", "đối diện, phản đối"),
    "続": ("TỤC", "tiếp tục, liên tục"),
    "夢": ("MỘNG", "giấc mơ, ước mơ"),
    "鉄": ("THIẾT", "sắt, thép"),
    "遅": ("TRÌ", "muộn, chậm trễ"),
    "席": ("TỊCH", "chỗ ngồi, tham dự"),
    "申": ("THÂN", "thưa, trình bày"),
    "様": ("DẠNG", "ngài, hình dạng"),
    "査": ("TRA", "điều tra, kiểm tra"),
    "雪": ("TUYẾT", "tuyết"),
    "直": ("TRỰC", "sửa chữa, thẳng"),
    "険": ("HIỂM", "nguy hiểm, hiểm trở"),
    "戻": ("LỆ", "quay lại, trả lại"),
    "変": ("BIẾN", "thay đổi, kỳ lạ"),
    "歯": ("XỈ", "răng"),
    "髪": ("PHÁT", "tóc"),
    "絵": ("HỘI", "bức tranh, hội họa"),
    "伝": ("TRUYỀN", "truyền đạt, giúp đỡ"),
}

def clean_vietnamese(text):
    if not text:
        return ""
    t = text.replace('ƣ', 'ư').replace('Ƣ', 'Ư')
    t = t.replace('\u01a1', 'ơ').replace('\u01a0', 'Ơ')
    return t

doc = pymupdf.open(PDF_PATH)

# 1. Parse TOC (pages 169..end) for all 336 Book 2 Kanji
toc_text = ""
for pno in range(168, len(doc)):
    toc_text += clean_vietnamese(doc[pno].get_text()) + "\n"

toc_entries = {}
for m in re.finditer(r"(?:^|\n)\s*(\d+)\.\s*([一-龯])\s*([^\n]+?)\.{3,}\s*(\d+)", toc_text):
    num = int(m.group(1))
    char = m.group(2)
    mid = m.group(3).strip()
    page_num = int(m.group(4))
    parts = [p.strip() for p in re.split(r"\s{2,}", mid) if p.strip()]
    if len(parts) == 1:
        sub = parts[0].split()
        hv = sub[0].upper()
        mv = " ".join(sub[1:-1]) if len(sub) > 2 else parts[0]
    else:
        hv = parts[0].upper()
        mv = parts[1]
    toc_entries[num] = (char, hv, mv, page_num)

# Update han_viet_map.json
for char, (hv, mv) in SUPPLEMENTAL_HV.items():
    han_viet_map[char] = {"han_viet": hv, "meaning_vi": mv}

for num, (char, hv, mv, _) in toc_entries.items():
    if char not in han_viet_map or not han_viet_map[char].get("han_viet"):
        han_viet_map[char] = {"han_viet": hv, "meaning_vi": mv}

with open('/home/dattruong/Documents/JPNKanji/data/han_viet_map.json', 'w', encoding='utf-8') as f:
    json.dump(han_viet_map, f, ensure_ascii=False, indent=2)

# Update book1.json
with open('/home/dattruong/Documents/JPNKanji/data/book1.json', 'r', encoding='utf-8') as f:
    b1 = json.load(f)

for item in b1:
    c = item["kanji"]
    if c in SUPPLEMENTAL_HV:
        hv, mv = SUPPLEMENTAL_HV[c]
        if not item.get("han_viet"):
            item["han_viet"] = hv
        if not item.get("meaning_vi"):
            item["meaning_vi"] = mv
    elif c in han_viet_map:
        if not item.get("han_viet"):
            item["han_viet"] = han_viet_map[c].get("han_viet", "")
        if not item.get("meaning_vi"):
            item["meaning_vi"] = han_viet_map[c].get("meaning_vi", "").split("/")[0].strip()
    if c == "々" and not item.get("strokes"):
        item["strokes"] = 3

with open('/home/dattruong/Documents/JPNKanji/data/book1.json', 'w', encoding='utf-8') as f:
    json.dump(b1, f, ensure_ascii=False, indent=2)

# 2. Build continuous stream of Book 2 content pages (4..167)
full_text = ""
for pno in range(4, 168):
    ptxt = clean_vietnamese(doc[pno].get_text())
    ptxt = re.sub(r"^\s*\d+\s*\n", "", ptxt)
    full_text += "\n" + ptxt

positions = []
search_from = 0
for num in range(1, 337):
    char, hv, mv, page_num = toc_entries[num]
    m = re.search(rf"(?:^|\n)\s*{num}\.\s*{char}", full_text[search_from:])
    if m:
        abs_pos = search_from + m.start()
        positions.append((abs_pos, num, char, hv, mv, page_num))
        search_from = abs_pos + 5

# Group numbers by expected PDF page to determine top/bottom image extraction
page_groups = {}
for _, num, char, hv, mv, page_num in positions:
    pno = page_num + 2
    page_groups.setdefault(pno, []).append(num)

all_book2_kanji = []

for idx, (start_pos, num, char, toc_hv, toc_mv, page_num) in enumerate(positions):
    end_pos = positions[idx + 1][0] if idx + 1 < len(positions) else len(full_text)
    sec_text = full_text[start_pos:end_pos].strip()

    # Clean trailing next-character header (e.g. "\n迎 \nNGHÊNH") at end of sec_text
    if idx + 1 < len(positions):
        next_char = positions[idx + 1][2]
        sec_text = re.sub(rf"\n\s*{next_char}\s*\n\s*[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ,\s]+$", "", sec_text).strip()

    # Extract story: between title block and 訓: / 音:
    story = ""
    head_m = re.search(rf"^{num}\.\s*{char}\s*([^\n]*(?:\n[^\n]+)*?)(?=\s*(?:訓:|音:))", sec_text)
    if head_m:
        block = head_m.group(1)
        paras = [p.strip() for p in re.split(r"\n\s*\n", block) if p.strip()]
        if len(paras) >= 2:
            story_lines = [l.strip() for l in paras[-1].split("\n") if l.strip() and "    " not in l]
            story = " ".join(story_lines).strip()
        elif len(paras) == 1:
            lines = [l.strip() for l in paras[0].split("\n") if l.strip() and "    " not in l]
            # First line might still be part of title if it didn't have 4 spaces
            if len(lines) >= 2:
                story = " ".join(lines[1:]).strip()

    # Kunyomi
    kun = []
    kun_m = re.search(r'訓:\s*(.*?)(?=\s*音:|\n\s*1\s*\n|\Z)', sec_text, re.DOTALL)
    if kun_m:
        raw_k = re.sub(r'\s+', '', kun_m.group(1))
        kun = [k for k in raw_k.split(',') if k]

    # Onyomi
    on = []
    on_m = re.search(r'音:\s*(.*?)(?=\s*\n\s*\d+\s*(?:\n|[^\d\n])|\Z)', sec_text, re.DOTALL)
    if on_m:
        raw_o = re.sub(r'\s+', '', on_m.group(1))
        on = [o for o in raw_o.split(',') if o]

    # Examples
    examples = []
    ex_start = sec_text.find('音:')
    if ex_start == -1:
        ex_start = sec_text.find('訓:')
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
                if re.match(r'^[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ,\s]+$', l) and len(l) > 1:
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

    # Image extraction
    img_filename = f"b2_{num:04d}_{char}.jpg"
    img_dest = os.path.join(IMG_DIR, img_filename)
    local_img_path = f"/images/book2/{img_filename}"

    pno = page_num + 2
    page = doc[pno]
    siblings = page_groups.get(pno, [num])
    pos_in_page = siblings.index(num) if num in siblings else 0
    is_top = (pos_in_page == 0)

    if not os.path.exists(img_dest):
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

        if pos_in_page < len(valid_imgs):
            base_img = doc.extract_image(valid_imgs[pos_in_page][1])
            with open(img_dest, 'wb') as f:
                f.write(base_img['image'])
            extracted = True

        if not extracted:
            clip_rect = pymupdf.Rect(140, 30, 310, 200) if is_top else pymupdf.Rect(140, 410, 310, 580)
            pix = page.get_pixmap(clip=clip_rect, dpi=150)
            pix.save(img_dest)

    meta = kanji_meta.get(char, {})
    lesson_num = (num - 1) // 16 + 1

    all_book2_kanji.append({
        "id": f"b2-{lesson_num:02d}-{num:03d}",
        "book": 2,
        "lesson": lesson_num,
        "number": num,
        "kanji": char,
        "han_viet": toc_hv,
        "meaning_vi": toc_mv,
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
    })

out_file = "/home/dattruong/Documents/JPNKanji/data/book2.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(all_book2_kanji, f, ensure_ascii=False, indent=2)

with open("/home/dattruong/Documents/JPNKanji/data/kanji_all.json", "w", encoding="utf-8") as f:
    json.dump(b1 + all_book2_kanji, f, ensure_ascii=False)

print(f"SUCCESS! Book 1: {len(b1)} items, Book 2: {len(all_book2_kanji)} items.")
