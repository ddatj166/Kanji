import pymupdf
import re
import json

def clean_vietnamese(text):
    if not text:
        return ""
    t = text.replace('ƣ', 'ư').replace('Ƣ', 'Ư')
    t = t.replace('\u01a1', 'ơ').replace('\u01a0', 'Ơ')
    return t

doc = pymupdf.open('/home/dattruong/Documents/JPNKanji/pdf/book2.pdf')

def parse_kanji_section(sec_text, num, char):
    # sec_text starts right around the kanji
    # Story is between the title line and '訓:'
    story = ""
    story_m = re.search(r'\d+\.\s+[一-龯][^\n]+\n+(.*?)(?=訓:|$)', sec_text, re.DOTALL)
    if story_m:
        story = " ".join([l.strip() for l in story_m.group(1).split('\n') if l.strip()])

    # Kunyomi
    kun = []
    kun_m = re.search(r'訓:\s*([^\n]+(?:\n\s*[^\n]+)*?)(?=音:|$)', sec_text)
    if kun_m:
        raw_kun = re.sub(r'\s+', '', kun_m.group(1))
        kun = [k.strip() for k in raw_kun.split(',') if k.strip()]

    # Onyomi
    on = []
    on_m = re.search(r'音:\s*([^\n]+(?:\n\s*[^\n]+)*?)(?=\n\s*\d+\s*\n|\n\s*\d+\s+[^\n]+|$)', sec_text)
    if on_m:
        raw_on = re.sub(r'\s+', '', on_m.group(1))
        on = [o.strip() for o in raw_on.split(',') if o.strip()]

    # Examples:
    # Pattern: \n(\d+)\s*\n([^\n]+(?:\n[^\n]+)*?)(?=\n\s*\d+\s*\n|\n\s*\d+\.\s+[一-龯]|\Z)
    # Let's extract examples after 音:
    examples = []
    ex_start = sec_text.find('音:')
    if ex_start != -1:
        ex_content = sec_text[ex_start:]
        # Find individual examples
        ex_blocks = re.split(r'\n\s*(\d+)\s*\n', ex_content)
        # ex_blocks: [header, '1', content1, '2', content2, ...]
        for i in range(1, len(ex_blocks), 2):
            ex_num = ex_blocks[i]
            ex_text = ex_blocks[i+1].strip()
            # Split by lines
            ex_lines = [l.strip() for l in ex_text.split('\n') if l.strip()]
            if not ex_lines:
                continue
            
            # Usually line 0 has word and maybe reading
            first_line = ex_lines[0]
            parts = first_line.split()
            word = parts[0]
            reading = parts[1] if len(parts) > 1 else ""
            
            remaining = ex_lines[1:]
            if not reading and remaining:
                reading = remaining[0]
                remaining = remaining[1:]
                
            # Find Han Viet (all uppercase line)
            han_viet = ""
            meaning_parts = []
            for line in remaining:
                # If uppercase letters and spaces
                if re.match(r'^[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+$', line) and len(line) > 1:
                    han_viet = line.strip()
                else:
                    meaning_parts.append(line.strip())
            
            meaning = " ".join(meaning_parts)
            examples.append({
                "word": word,
                "reading": reading,
                "han_viet": han_viet,
                "meaning": meaning
            })

    return {
        "number": int(num),
        "kanji": char,
        "story": story,
        "kunyomi": kun,
        "onyomi": on,
        "examples_count": len(examples),
        "examples": examples[:3] # sample
    }

# Test on page 5
page5 = doc[4]
text5 = clean_vietnamese(page5.get_text())
pos1 = text5.find('1. 抑')
pos2 = text5.find('2. 迎')
sec1 = text5[pos1:pos2]
sec2 = text5[pos2:]

res1 = parse_kanji_section(sec1, 1, '抑')
res2 = parse_kanji_section(sec2, 2, '迎')
print("Res 1:", json.dumps(res1, ensure_ascii=False, indent=2))
print("Res 2:", json.dumps(res2, ensure_ascii=False, indent=2))
