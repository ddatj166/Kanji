import re

with open('/home/dattruong/Documents/JPNKanji/scripts/lesson1.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Match all <a class="linkto" href="(\d+)">(.*?)</a>
nav_kanji = re.findall(r'<a class="linkto"\s+href="(\d+)">([^<]+)</a>', html)
print(f"Top nav kanji count: {len(nav_kanji)}")
for num, char in nav_kanji:
    print(f"#{num}: {char}")
