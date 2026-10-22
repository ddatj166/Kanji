export interface ExampleWord {
  word: string;
  reading: string;
  han_viet?: string;
  meaning: string;
  jlpt?: string;
}

export interface KanjiMnemonic {
  image_url: string;
  story: string;
}

export interface KanjiEntry {
  id: string;
  book: number; // 1: Book 1, 2: Book 2, 3: Custom
  lesson: number;
  number: number;
  kanji: string;
  han_viet: string;
  meaning_vi: string;
  meaning_en?: string;
  onyomi: string[];
  kunyomi: string[];
  strokes: number;
  jlpt?: string;
  mnemonic: KanjiMnemonic;
  examples: ExampleWord[];
  custom?: boolean;
}

export type BookFilter = 'all' | 'book1' | 'book2' | 'custom' | 'bookmarked';
