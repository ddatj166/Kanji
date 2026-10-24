import { ExampleWord } from '@/types/kanji';

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

const KANJI_CHAR_REGEX = /[\u3400-\u4dbf\u4e00-\u9fff々]/;
const JP_TEXT_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff々]/;

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
      if (data.kanji) result.kanji = String(data.kanji).trim();
      if (data.han_viet) result.han_viet = String(data.han_viet).trim().toUpperCase();
      if (data.meaning_vi || data.meaning) {
        result.meaning_vi = String(data.meaning_vi || data.meaning).trim();
      }
      if (data.onyomi) {
        result.onyomi = Array.isArray(data.onyomi)
          ? data.onyomi
          : String(data.onyomi).split(/[,、\s/]+/).filter(Boolean);
      }
      if (data.kunyomi) {
        result.kunyomi = Array.isArray(data.kunyomi)
          ? data.kunyomi
          : String(data.kunyomi).split(/[,、\s/]+/).filter(Boolean);
      }
      if (data.strokes) result.strokes = Number(data.strokes);
      if (data.jlpt) result.jlpt = String(data.jlpt).toUpperCase();
      if (data.story || data.mnemonic) {
        result.story =
          typeof data.mnemonic === 'string'
            ? data.mnemonic
            : data.story || data.mnemonic?.story || '';
      }
      if (Array.isArray(data.examples)) {
        result.examples = data.examples
          .map((ex: any) => ({
            word: String(ex.word || ex.kanji || '').trim(),
            reading: String(ex.reading || ex.hiragana || '').trim(),
            han_viet: String(ex.han_viet || '').trim().toUpperCase(),
            meaning: String(ex.meaning || ex.meaning_vi || '').trim(),
          }))
          .filter((ex: ExampleWord) => ex.word && ex.meaning);
      }
      if (result.kanji) return result;
    } catch {
      // Fallback to text parsing
    }
  }

  // 2. Parse Line-by-line / Key-Value text format
  const lines = text.split('\n');
  let inExamplesSection = false;
  let inStorySection = false;

  for (let rawLine of lines) {
    const line = rawLine.trim().replace(/^\*+|\*+$/g, '').trim();
    if (!line) continue;

    // Check for Examples section header
    if (/^(?:\d+[\.\)]\s*)?(?:ví dụ|examples|từ vựng|các từ vựng|từ vựng ví dụ)\s*[:：]?$/i.test(line)) {
      inExamplesSection = true;
      inStorySection = false;
      continue;
    }

    if (!inExamplesSection) {
      const kanjiMatch = line.match(
        /^(?:kanji|chữ|chữ hán|hán tự)[\s:*：-]+([\u3400-\u4dbf\u4e00-\u9fff々])/i
      );
      if (kanjiMatch && !result.kanji) {
        result.kanji = kanjiMatch[1];
        inStorySection = false;
        continue;
      }

      const hvMatch = line.match(/^(?:hán việt|han viet|âm hán việt)[\s:*：-]+([^\n]+)/i);
      if (hvMatch && !result.han_viet) {
        result.han_viet = hvMatch[1].replace(/\*+/g, '').trim().toUpperCase();
        inStorySection = false;
        continue;
      }

      const meanMatch = line.match(/^(?:nghĩa|nghĩa tiếng việt|meaning)[\s:*：-]+([^\n]+)/i);
      if (meanMatch && !result.meaning_vi) {
        result.meaning_vi = meanMatch[1].replace(/\*+/g, '').trim();
        inStorySection = false;
        continue;
      }

      const onMatch = line.match(/^(?:âm on|on|onyomi)[\s:*：-]+([^\n]+)/i);
      if (onMatch && !result.onyomi) {
        const rawOn = onMatch[1].replace(/\*+/g, '').trim();
        if (!/^(?:không|không có|none|-|—)$/i.test(rawOn)) {
          result.onyomi = rawOn.split(/[,、\s/]+/).filter(Boolean);
        }
        inStorySection = false;
        continue;
      }

      const kunMatch = line.match(/^(?:âm kun|kun|kunyomi)[\s:*：-]+([^\n]+)/i);
      if (kunMatch && !result.kunyomi) {
        const rawKun = kunMatch[1].replace(/\*+/g, '').trim();
        if (!/^(?:không|không có|none|-|—)$/i.test(rawKun)) {
          result.kunyomi = rawKun.split(/[,、\s/]+/).filter(Boolean);
        }
        inStorySection = false;
        continue;
      }

      const strokeMatch = line.match(/^(?:số nét|nét|strokes)[\s:*：-]+(\d+)/i);
      if (strokeMatch && !result.strokes) {
        result.strokes = Number(strokeMatch[1]);
        inStorySection = false;
        continue;
      }

      const jlptMatch = line.match(/^(?:jlpt|cấp độ)[\s:*：-]+(N[1-5])/i);
      if (jlptMatch && !result.jlpt) {
        result.jlpt = jlptMatch[1].toUpperCase();
        inStorySection = false;
        continue;
      }

      const storyMatch = line.match(
        /^(?:mẹo nhớ|mẹo ghi nhớ|câu chuyện|liên tưởng|story|mnemonic)[\s:*：-]*(.*)$/i
      );
      if (storyMatch && !result.story) {
        result.story = storyMatch[1].replace(/\*+/g, '').trim();
        inStorySection = true;
        continue;
      }

      // If line contains '|' with Japanese characters in first column, treat as example even without header
      if (line.includes('|')) {
        const cleanPipe = line.replace(/^\d+[\.\-\)\s]+/, '').trim();
        const parts = cleanPipe.split('|').map((p) => p.replace(/\*+/g, '').trim());
        if (parts.length >= 2 && JP_TEXT_REGEX.test(parts[0])) {
          result.examples?.push({
            word: parts[0] || '',
            reading: parts[1] || '',
            han_viet: (parts.length >= 4 ? parts[2] : '').toUpperCase(),
            meaning: parts.length >= 4 ? parts[3] : parts[2] || parts[1] || '',
          });
          inStorySection = false;
          continue;
        }
      }

      // Continuation of multi-line story
      if (inStorySection) {
        result.story = result.story ? `${result.story} ${line}` : line;
      }
      continue;
    }

    // 3. Parse Example lines (only when inExamplesSection === true)
    const cleanLine = line.replace(/^(?:\d+[\.\-\)\s]+|[-•*]\s+)/, '').trim();
    if (!cleanLine) continue;

    if (cleanLine.includes('|')) {
      const parts = cleanLine.split('|').map((p) => p.replace(/\*+/g, '').trim());
      if (parts.length >= 2 && JP_TEXT_REGEX.test(parts[0])) {
        result.examples?.push({
          word: parts[0] || '',
          reading: parts[1] || '',
          han_viet: (parts.length >= 4 ? parts[2] : '').toUpperCase(),
          meaning: parts.length >= 4 ? parts[3] : parts[2] || parts[1] || '',
        });
      }
    } else if (JP_TEXT_REGEX.test(cleanLine.split(/\s+/)[0] || '')) {
      // Format: 桜 (さくら) [ANH]: hoa anh đào OR 桜 - さくら : hoa anh đào
      const complexMatch = cleanLine.match(
        /^([^\s(:\-]+)\s*(?:[\(\[（]([^\)\]）]+)[\)\]）]|\-\s*([^\s:\-]+))?\s*(?:\[([^\]]+)\])?\s*[:\-–]\s*(.+)$/
      );
      if (complexMatch && complexMatch[1] && complexMatch[5]) {
        result.examples?.push({
          word: complexMatch[1].trim(),
          reading: (complexMatch[2] || complexMatch[3] || '').trim(),
          han_viet: (complexMatch[4] || '').trim().toUpperCase(),
          meaning: complexMatch[5].trim(),
        });
      }
    }
  }

  // Fallback: look for standalone single Kanji if not matched by key
  if (!result.kanji) {
    const singleKanji = text.match(/(?:^|\s)([\u3400-\u4dbf\u4e00-\u9fff々])(?:\s|$|[\(\[])/);
    if (singleKanji && KANJI_CHAR_REGEX.test(singleKanji[1])) {
      result.kanji = singleKanji[1];
    }
  }

  return result;
}
