import { ExampleWord, KanjiEntry } from '@/types/kanji';

export interface ParsedAiKanji {
  kanji?: string;
  han_viet?: string;
  meaning_vi?: string;
  onyomi?: string[];
  kunyomi?: string[];
  strokes?: number;
  jlpt?: string;
  story?: string;
  examples?: ExampleWord[];
}

export function parseAiResponse(rawText: string): ParsedAiKanji {
  const result: ParsedAiKanji = {
    examples: [],
  };

  const text = rawText.trim();
  if (!text) return result;

  // 1. Try parsing JSON format first
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      if (data.kanji) result.kanji = data.kanji;
      if (data.han_viet) result.han_viet = data.han_viet.toUpperCase();
      if (data.meaning_vi || data.meaning) result.meaning_vi = data.meaning_vi || data.meaning;
      if (data.onyomi) {
        result.onyomi = Array.isArray(data.onyomi) ? data.onyomi : data.onyomi.split(/[,、\s]+/);
      }
      if (data.kunyomi) {
        result.kunyomi = Array.isArray(data.kunyomi) ? data.kunyomi : data.kunyomi.split(/[,、\s]+/);
      }
      if (data.strokes) result.strokes = Number(data.strokes);
      if (data.jlpt) result.jlpt = data.jlpt;
      if (data.story || data.mnemonic) result.story = data.story || data.mnemonic;
      if (Array.isArray(data.examples)) {
        result.examples = data.examples.map((ex: any) => ({
          word: ex.word || ex.kanji || '',
          reading: ex.reading || ex.hiragana || '',
          han_viet: (ex.han_viet || '').toUpperCase(),
          meaning: ex.meaning || ex.meaning_vi || '',
        }));
      }
      if (result.kanji) return result;
    } catch (e) {
      // Fallback to text parsing
    }
  }

  // 2. Parse Line-by-line / Key-Value text format
  const lines = text.split('\n');
  let inExamplesSection = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for Section headers
    if (/^(ví dụ|examples|từ vựng|cac vi du):/i.test(line)) {
      inExamplesSection = true;
      continue;
    }

    if (!inExamplesSection) {
      // Parse key-value lines
      const kanjiMatch = line.match(/^(?:kanji|chữ|chữ hán|hán tự)[\s:*：-]+([一-龯])/i);
      if (kanjiMatch && !result.kanji) {
        result.kanji = kanjiMatch[1];
        continue;
      }

      const hvMatch = line.match(/^(?:hán việt|han viet|âm hán việt)[\s:*：-]+([^\n]+)/i);
      if (hvMatch && !result.han_viet) {
        result.han_viet = hvMatch[1].trim().toUpperCase();
        continue;
      }

      const meanMatch = line.match(/^(?:nghĩa|nghĩa tiếng việt|meaning)[\s:*：-]+([^\n]+)/i);
      if (meanMatch && !result.meaning_vi) {
        result.meaning_vi = meanMatch[1].trim();
        continue;
      }

      const onMatch = line.match(/^(?:âm on|on|onyomi)[\s:*：-]+([^\n]+)/i);
      if (onMatch && !result.onyomi) {
        result.onyomi = onMatch[1].split(/[,、\s]+/).filter(Boolean);
        continue;
      }

      const kunMatch = line.match(/^(?:âm kun|kun|kunyomi)[\s:*：-]+([^\n]+)/i);
      if (kunMatch && !result.kunyomi) {
        result.kunyomi = kunMatch[1].split(/[,、\s]+/).filter(Boolean);
        continue;
      }

      const strokeMatch = line.match(/^(?:số nét|nét|strokes)[\s:*：-]+(\d+)/i);
      if (strokeMatch && !result.strokes) {
        result.strokes = Number(strokeMatch[1]);
        continue;
      }

      const jlptMatch = line.match(/^(?:jlpt|cấp độ)[\s:*：-]+(N[1-5])/i);
      if (jlptMatch && !result.jlpt) {
        result.jlpt = jlptMatch[1].toUpperCase();
        continue;
      }

      const storyMatch = line.match(/^(?:mẹo nhớ|câu chuyện|liên tưởng|story|mnemonic)[\s:*：-]+([^\n]+)/i);
      if (storyMatch && !result.story) {
        result.story = storyMatch[1].trim();
        continue;
      }
    }

    // 3. Parse Example lines
    // Matches formats like:
    // 1. 桜 | さくら | ANH | hoa anh đào
    // 桜 - さくら (ANH): hoa anh đào
    // 桜 (さくら) [ANH] hoa anh đào
    const cleanLine = line.replace(/^\d+[\.\-\)\s]+/, '').trim();
    if (cleanLine.includes('|')) {
      const parts = cleanLine.split('|').map((p) => p.trim());
      if (parts.length >= 2) {
        result.examples?.push({
          word: parts[0] || '',
          reading: parts[1] || '',
          han_viet: (parts[2] || '').toUpperCase(),
          meaning: parts[3] || parts[2] || '',
        });
      }
    } else {
      // Regex match: word (reading) [han_viet] meaning or word - reading : meaning
      const complexMatch = cleanLine.match(/^([^\s(:\-]+)\s*[\(\-]?\s*([^\s\)\]:\-]+)?[\)\]]?\s*(?:\[([^\]]+)\])?\s*[:\-–]?\s*(.*)$/);
      if (complexMatch && complexMatch[1]) {
        result.examples?.push({
          word: complexMatch[1].trim(),
          reading: (complexMatch[2] || '').trim(),
          han_viet: (complexMatch[3] || '').trim().toUpperCase(),
          meaning: (complexMatch[4] || '').trim(),
        });
      }
    }
  }

  // If kanji wasn't found in keys, look for standalone single Kanji in text
  if (!result.kanji) {
    const singleKanji = text.match(/(?:^|\s)([一-龯])(?:\s|$|[\(\[])/);
    if (singleKanji) {
      result.kanji = singleKanji[1];
    }
  }

  return result;
}
