import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const META_FILE = path.join(DATA_DIR, 'kanji_meta.json');
const HAN_VIET_FILE = path.join(DATA_DIR, 'han_viet_map.json');

let kanjiMeta: Record<string, any> | null = null;
let hanVietMap: Record<string, any> | null = null;

function loadDictionaries() {
  if (!kanjiMeta && fs.existsSync(META_FILE)) {
    try {
      kanjiMeta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    } catch (e) {
      console.error(e);
    }
  }
  if (!hanVietMap && fs.existsSync(HAN_VIET_FILE)) {
    try {
      hanVietMap = JSON.parse(fs.readFileSync(HAN_VIET_FILE, 'utf-8'));
    } catch (e) {
      console.error(e);
    }
  }
}

export async function GET(request: Request) {
  loadDictionaries();
  const { searchParams } = new URL(request.url);
  const char = searchParams.get('q')?.trim() || '';

  if (!char) {
    return NextResponse.json({ error: 'Missing character' }, { status: 400 });
  }

  const firstChar = Array.from(char)[0];
  const meta = kanjiMeta?.[firstChar] || {};
  const hv = hanVietMap?.[firstChar] || {};

  return NextResponse.json({
    kanji: firstChar,
    han_viet: hv.han_viet || '',
    meaning_vi: hv.meaning_vi ? hv.meaning_vi.split('/')[0].trim() : '',
    meaning_en: meta.meanings ? meta.meanings.slice(0, 3).join(', ') : '',
    onyomi: meta.readings_on || [],
    kunyomi: meta.readings_kun || [],
    strokes: meta.strokes || 0,
    jlpt: meta.jlpt_new ? `N${meta.jlpt_new}` : 'N3',
  });
}
