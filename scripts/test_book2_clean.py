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

def parse_section(sec_text, num, char):
    # Short meaning from title line: e.g. "1. 抑    ức    ức chế    yoku"
    meaning_vi = ""
    title_m = re.search(r'\d+\.\s+[一-龯]\s+([^\n]+)', sec_text)
    if title_m:
        parts = [p.strip() for p in re.split(r'\s{2,}', title_m.group(1)) if p.strip()]
        if len(parts) >= 2:
            meaning_vi = parts[1] # e.g. "ức chế"
        elif len(parts) == 1:
            meaning_vi = parts[0]

    # Story is after title line, before 訓:
    story = ""
    story_m = re.search(r'\d+\.\s+[一-龯][^\n]+\n+(.*?)(?=訓:|$)', sec_text, re.DOTALL)
    if story_m:
        story = " ".join([l.strip() for l in story_m.group(1).split('\n') if l.strip()])

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

    # Han Viet from text before "1. 抑"
    han_viet = ""
    pre_match = re.search(r'\n([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]{2,})\n+\d+\.\s+[一-龯]', sec_text)
    if pre_match:
        han_viet = pre_match.group(1).strip()

    # Examples
    examples = []
    ex_start = sec_text.find('音:')
    if ex_start != -1:
        ex_content = sec_text[ex_start:]
        # Find all numbered blocks: \n(\d+)\s*\n or \n(\d+)\s+([^\n]+)
        # Standardize: insert newline before standalone numbers
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
            
            examples.append({
                "word": word,
                "reading": reading,
                "han_viet": hv,
                "meaning": " ".join(mean_parts)
            })

    return {
        "number": int(num),
        "kanji": char,
        "han_viet": han_viet,
        "meaning_vi": meaning_vi,
        "story": story,
        "kunyomi": kun,
        "onyomi": on,
        "examples_count": len(examples),
        "sample_ex": examples[:2]
    }

page5 = doc[4]
text5 = clean_vietnamese(page5.get_text())
pos1 = text5.find('1. 抑')
pos2 = text5.find('2. 迎')
print("Item 1:", json.dumps(parse_section(text5[pos1:pos2], 1, '抑'), ensure_ascii=False, indent=2))
print("Item 2:", json.dumps(parse_section(text5[pos2:], 2, '迎'), ensure_ascii=False, indent=2))
