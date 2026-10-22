import pymupdf
import re

doc = pymupdf.open('/home/dattruong/Documents/JPNKanji/pdf/book2.pdf')

missing_top = 0
missing_bot = 0
total_kanji = 0

for pno in range(4, 168): # pages 5 to 168
    page = doc[pno]
    img_list = page.get_images(full=True)
    top_img = None
    bot_img = None
    
    for img in img_list:
        xref = img[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        r = rects[0]
        # Ignore footer/headers
        if r.height < 40 or r.y0 > 750:
            continue
        if r.y1 < 380 and top_img is None:
            top_img = xref
        elif r.y0 >= 350 and r.y1 < 750 and bot_img is None:
            bot_img = xref

    if not top_img:
        missing_top += 1
    if not bot_img:
        missing_bot += 1

print(f"Pages 5-168 (164 pages): missing top img: {missing_top}, missing bot img: {missing_bot}")
