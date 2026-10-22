import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { KanjiEntry } from '@/types/kanji';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOK1_FILE = path.join(DATA_DIR, 'book1.json');
const BOOK2_FILE = path.join(DATA_DIR, 'book2.json');
const CUSTOM_FILE = path.join(DATA_DIR, 'custom_kanji.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const b1: KanjiEntry[] = readJsonFile(BOOK1_FILE, []);
  const b2: KanjiEntry[] = readJsonFile(BOOK2_FILE, []);
  const custom: KanjiEntry[] = readJsonFile(CUSTOM_FILE, []);

  // Merge: if a custom entry overrides or adds examples to an existing id, apply it
  const customMap = new Map<string, KanjiEntry>();
  const customOnly: KanjiEntry[] = [];

  for (const item of custom) {
    if (item.id.startsWith('b1-') || item.id.startsWith('b2-')) {
      customMap.set(item.id, item);
    } else {
      customOnly.push(item);
    }
  }

  const mergedB1 = b1.map(item => customMap.get(item.id) || item);
  const mergedB2 = b2.map(item => customMap.get(item.id) || item);

  return NextResponse.json({
    total: mergedB1.length + mergedB2.length + customOnly.length,
    counts: {
      book1: mergedB1.length,
      book2: mergedB2.length,
      custom: customOnly.length,
    },
    data: [...mergedB1, ...mergedB2, ...customOnly],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, kanji, id } = body;

    const custom: KanjiEntry[] = readJsonFile(CUSTOM_FILE, []);

    if (action === 'add') {
      const newEntry: KanjiEntry = {
        ...kanji,
        id: `custom-${Date.now()}`,
        book: 3,
        lesson: kanji.lesson || 1,
        number: custom.filter(c => c.book === 3).length + 1,
        custom: true
      };
      custom.push(newEntry);
      writeJsonFile(CUSTOM_FILE, custom);
      return NextResponse.json({ success: true, item: newEntry });
    } else if (action === 'update' || action === 'update_or_add_example') {
      const existingIdx = custom.findIndex(c => c.id === kanji.id);
      const updatedEntry = { ...kanji, custom: true };
      if (existingIdx >= 0) {
        custom[existingIdx] = updatedEntry;
      } else {
        custom.push(updatedEntry);
      }
      writeJsonFile(CUSTOM_FILE, custom);
      return NextResponse.json({ success: true, item: updatedEntry });
    } else if (action === 'delete') {
      const targetId = id || kanji?.id;
      const targetItem = custom.find(c => c.id === targetId);
      const updated = custom.filter(c => c.id !== targetId);
      writeJsonFile(CUSTOM_FILE, updated);
      return NextResponse.json({ success: true, deletedItem: targetItem });
    } else if (action === 'restore') {
      if (kanji && kanji.id) {
        const exists = custom.some(c => c.id === kanji.id);
        if (!exists) {
          custom.push(kanji);
          writeJsonFile(CUSTOM_FILE, custom);
        }
        return NextResponse.json({ success: true, item: kanji });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const custom: KanjiEntry[] = readJsonFile(CUSTOM_FILE, []);
    const targetItem = custom.find(c => c.id === id);
    const updated = custom.filter(c => c.id !== id);
    writeJsonFile(CUSTOM_FILE, updated);
    return NextResponse.json({ success: true, deletedItem: targetItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
