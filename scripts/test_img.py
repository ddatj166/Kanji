import requests

urls = [
    "https://m.lophoctiengnhat.com/public/lesson/giaotrinh/kanji_look_and_lea_r_n/bai01_hinh_01.png",
    "https://lophoctiengnhat.com/public/lesson/giaotrinh/kanji_look_and_lea_r_n/bai01_hinh_01.png"
]
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
for u in urls:
    try:
        r = requests.head(u, headers=headers)
        print(u, r.status_code, r.headers.get("content-type"), r.headers.get("content-length"))
    except Exception as e:
        print(u, "Error:", e)
