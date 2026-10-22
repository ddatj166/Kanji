import requests
import re
from html.parser import HTMLParser

url = "https://m.lophoctiengnhat.com/kanji-look-and-lear.n-list.html"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

resp = requests.get(url, headers=headers)
print("Status code:", resp.status_code)
print("Encoding:", resp.encoding)
text = resp.text
print("Length:", len(text))

# Save first 3000 chars to check structure
with open("/home/dattruong/Documents/JPNKanji/scripts/web_sample.html", "w", encoding="utf-8") as f:
    f.write(text)

# Look for lessons or kanji links
links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', text)
kanji_links = [l for l in links if "kanji" in l.lower() or "bai" in l.lower() or "lesson" in l.lower()]
print(f"Total links: {len(links)}, Relevant links: {len(kanji_links)}")
for l in kanji_links[:20]:
    print("  ", l)
