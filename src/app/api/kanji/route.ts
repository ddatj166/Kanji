import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { KanjiEntry } from '@/types/kanji';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOK1_FILE = path.join(DATA_DIR, 'book1.json');
const BOOK2_FILE = path.join(DATA_DIR, 'book2.json');
const CUSTOM_FILE = path.join(DATA_DIR, 'custom_kanji.json');
const CUSTOM_IMG_DIR = path.join(process.cwd(), 'public', 'images', 'custom');

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

function cleanupOrphanedImages(customEntries: KanjiEntry[], immediateDeleteUrls: string[] = []) {
  try {
    if (!fs.existsSync(CUSTOM_IMG_DIR)) return;

    const referencedFiles = new Set<string>();
    for (const entry of customEntries) {
      const url = entry.mnemonic?.image_url || '';
      if (url.startsWith('/images/custom/')) {
        referencedFiles.add(path.basename(url));
      }
    }

    const immediateFiles = new Set(
      immediateDeleteUrls
        .filter((u) => u && u.startsWith('/images/custom/'))
        .map((u) => path.basename(u))
    );

    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    for (const file of fs.readdirSync(CUSTOM_IMG_DIR)) {
      if (referencedFiles.has(file)) continue;
      const fullPath = path.join(CUSTOM_IMG_DIR, file);
      try {
        const stat = fs.statSync(fullPath);
        if (immediateFiles.has(file) || now - stat.mtimeMs > TEN_MINUTES) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Ignore individual file errors
      }
    }
  } catch (err) {
    console.error('Error cleaning up orphaned images:', err);
  }
}

export async function GET() {
  const b1: KanjiEntry[] = readJsonFile(BOOK1_FILE, []);
  const b2: KanjiEntry[] = readJsonFile(BOOK2_FILE, []);
  const custom: KanjiEntry[] = readJsonFile(CUSTOM_FILE, []);

  const customMap = new Map<string, KanjiEntry>();
  const customOnly: KanjiEntry[] = [];

  for (const item of custom) {
    if (item.id.startsWith('b1-') || item.id.startsWith('b2-')) {
      customMap.set(item.id, item);
    } else {
      customOnly.push({
        ...item,
        book: 3,
        custom: true,
      });
    }
  }

  const mergedB1 = b1.map((item) => {
    const override = customMap.get(item.id);
    return override
      ? { ...override, book: 1, custom: false, isModified: true }
      : item;
  });

  const mergedB2 = b2.map((item) => {
    const override = customMap.get(item.id);
    return override
      ? { ...override, book: 2, custom: false, isModified: true }
      : item;
  });

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
      const customBookItems = custom.filter(
        (c) => !c.id.startsWith('b1-') && !c.id.startsWith('b2-')
      );
      const maxNumber = customBookItems.reduce((max, c) => Math.max(max, c.number || 0), 0);

      const newEntry: KanjiEntry = {
        ...kanji,
        id: `custom-${Date.now()}`,
        book: 3,
        lesson: kanji.lesson || 1,
        number: maxNumber + 1,
        custom: true,
      };
      custom.push(newEntry);
      writeJsonFile(CUSTOM_FILE, custom);
      cleanupOrphanedImages(custom);
      return NextResponse.json({ success: true, item: newEntry });
    } else if (action === 'update' || action === 'update_or_add_example') {
      const existingIdx = custom.findIndex((c) => c.id === kanji.id);
      const isBookEntry = kanji.id.startsWith('b1-') || kanji.id.startsWith('b2-');

      const oldImgUrl = existingIdx >= 0 ? custom[existingIdx].mnemonic?.image_url : '';
      const newImgUrl = kanji.mnemonic?.image_url || '';

      const updatedEntry: KanjiEntry = {
        ...kanji,
        book: isBookEntry ? (kanji.id.startsWith('b1-') ? 1 : 2) : 3,
        custom: !isBookEntry,
        isModified: isBookEntry ? true : undefined,
      };

      if (existingIdx >= 0) {
        custom[existingIdx] = updatedEntry;
      } else {
        custom.push(updatedEntry);
      }

      writeJsonFile(CUSTOM_FILE, custom);
      cleanupOrphanedImages(
        custom,
        oldImgUrl && oldImgUrl !== newImgUrl ? [oldImgUrl] : []
      );
      return NextResponse.json({ success: true, item: updatedEntry });
    } else if (action === 'reset_to_original') {
      const targetId = id || kanji?.id;
      const existing = custom.find((c) => c.id === targetId);
      const updated = custom.filter((c) => c.id !== targetId);
      writeJsonFile(CUSTOM_FILE, updated);

      const b1: KanjiEntry[] = readJsonFile(BOOK1_FILE, []);
      const b2: KanjiEntry[] = readJsonFile(BOOK2_FILE, []);
      const originalItem = [...b1, ...b2].find((item) => item.id === targetId) || null;

      cleanupOrphanedImages(
        updated,
        existing?.mnemonic?.image_url ? [existing.mnemonic.image_url] : []
      );
      return NextResponse.json({ success: true, item: originalItem });
    } else if (action === 'delete') {
      const targetId = id || kanji?.id;
      const targetItem = custom.find((c) => c.id === targetId);
      const updated = custom.filter((c) => c.id !== targetId);
      writeJsonFile(CUSTOM_FILE, updated);
      cleanupOrphanedImages(updated);
      return NextResponse.json({ success: true, deletedItem: targetItem });
    } else if (action === 'restore') {
      if (kanji && kanji.id) {
        const exists = custom.some((c) => c.id === kanji.id);
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
    const targetItem = custom.find((c) => c.id === id);
    const updated = custom.filter((c) => c.id !== id);
    writeJsonFile(CUSTOM_FILE, updated);
    cleanupOrphanedImages(updated);
    return NextResponse.json({ success: true, deletedItem: targetItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
