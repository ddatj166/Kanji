import requests

url = "https://m.lophoctiengnhat.com/kanji_look_and_learn_B01.html"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
resp = requests.get(url, headers=headers)
with open("/home/dattruong/Documents/JPNKanji/scripts/lesson1.html", "w", encoding="utf-8") as f:
    f.write(resp.text)
print("Fetched lesson 1, length:", len(resp.text))
