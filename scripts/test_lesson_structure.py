import re
import json

with open("/home/dattruong/Documents/JPNKanji/scripts/lesson1.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's find all images that match bai01_hinh_XX.png
imgs = re.findall(r'(\.\./public/lesson/giaotrinh/kanji_look_and_lea_r_n/bai\d+_hinh_\d+\.(?:png|jpg))', html)
print(f"Found {len(imgs)} images:")
for img in imgs:
    print(" ", img)

# Split by section headers or by images
# Let's find pattern: <h2 class="section">(.*?)</h2>
sections = re.split(r'<h2 class="section">(.*?)</h2>', html)
print(f"Total split sections: {len(sections)}")
for i in range(1, len(sections), 2):
    title = sections[i]
    content = sections[i+1]
    # find image
    img = re.search(r'<img[^>]+src="([^"]+)"', content)
    # find story
    # In item 2: <td>Hai ngón tay biểu thị cho số 2.<br /></td>
    story = re.search(r'<td>(.*?)</td>', content)
    # find table of examples
    examples = []
    rows = re.findall(r'<tr><td>(\d+)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', content)
    for r in rows:
        stt, k_word, hira, mean = r
        clean_k = re.sub(r'<[^>]+>', '', k_word).strip()
        clean_h = re.sub(r'<[^>]+>', '', hira).strip()
        clean_m = re.sub(r'<[^>]+>', '', mean).strip()
        examples.append({"word": clean_k, "reading": clean_h, "meaning": clean_m})
    
    kanji_char = examples[0]["word"] if examples else "Unknown"
    print(f"\n[{title}] Kanji: {kanji_char}")
    if img:
        print("  Image:", img.group(1))
    if story:
        clean_s = re.sub(r'<[^>]+>', '', story.group(1)).strip()
        print("  Story:", clean_s)
    print(f"  Examples count: {len(examples)}")
    if examples:
        print("  Ex1:", examples[0])
