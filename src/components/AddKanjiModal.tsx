'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  ClipboardPaste,
  FileText,
  Edit2,
  Save,
} from 'lucide-react';
import { KanjiEntry, ExampleWord } from '@/types/kanji';
import { parseAiResponse } from '@/lib/aiParser';

interface AddKanjiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKanjiAdded: (newKanji: KanjiEntry) => void;
  onKanjiUpdated?: (updatedKanji: KanjiEntry) => void;
  initialKanji?: KanjiEntry | null;
}

export const AI_PROMPT_TEMPLATE = `Hãy đóng vai là một giáo viên tiếng Nhật và tác giả của bộ sách "Kanji Look and Learn".
Tôi muốn học chữ Kanji sau: [ĐIỀN_CHỮ_KANJI_VÀO_ĐÂY]

Hãy giúp tôi:
1. Vẽ một bức tranh minh họa (hoặc mô tả chi tiết hình ảnh) theo phong cách Kanji Look and Learn: Nét vẽ tay đen trắng đơn giản (line art doodle) trên nền trắng, hình ảnh liên tưởng sáng tạo lồng ghép trực tiếp với hình dáng chữ Kanji để người học nhìn hình là nhớ ngay chữ Hán.
2. Xuất thông tin chi tiết và các từ vựng ví dụ theo ĐÚNG định dạng mẫu dưới đây để tôi copy vào ứng dụng:

KANJI: [Chữ Kanji]
HÁN VIỆT: [Âm Hán Việt in hoa]
NGHĨA: [Nghĩa tiếng Việt ngắn gọn]
ON: [Các âm On Katakana, cách nhau dấu phẩy]
KUN: [Các âm Kun Hiragana, cách nhau dấu phẩy]
NÉT: [Số nét]
JLPT: [N5/N4/N3/N2/N1]
MẸO NHỚ: [Câu chuyện liên tưởng hình ảnh để dễ nhớ chữ Hán này]
VÍ DỤ:
1. [Từ Kanji] | [Hiragana] | [Hán Việt] | [Nghĩa tiếng Việt]
2. [Từ Kanji] | [Hiragana] | [Hán Việt] | [Nghĩa tiếng Việt]
3. [Từ Kanji] | [Hiragana] | [Hán Việt] | [Nghĩa tiếng Việt]
4. [Từ Kanji] | [Hiragana] | [Hán Việt] | [Nghĩa tiếng Việt]
5. [Từ Kanji] | [Hiragana] | [Hán Việt] | [Nghĩa tiếng Việt]`;

export const AddKanjiModal: React.FC<AddKanjiModalProps> = ({
  isOpen,
  onClose,
  onKanjiAdded,
  onKanjiUpdated,
  initialKanji,
}) => {
  const isEditMode = !!initialKanji;

  // Mode: 'quick_ai' or 'manual'
  const [activeMode, setActiveMode] = useState<'quick_ai' | 'manual'>('quick_ai');

  // AI Paste text
  const [aiRawText, setAiRawText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState('');

  // Form states
  const [kanjiChar, setKanjiChar] = useState('');
  const [hanViet, setHanViet] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [onyomi, setOnyomi] = useState('');
  const [kunyomi, setKunyomi] = useState('');
  const [strokes, setStrokes] = useState<number>(0);
  const [jlpt, setJlpt] = useState('N3');
  const [lesson, setLesson] = useState<number>(1);
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [examples, setExamples] = useState<ExampleWord[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Example editing states
  const [editingExIdx, setEditingExIdx] = useState<number | null>(null);
  const [exWord, setExWord] = useState('');
  const [exReading, setExReading] = useState('');
  const [exHanViet, setExHanViet] = useState('');
  const [exMeaning, setExMeaning] = useState('');

  // Bulk examples paste inside manual mode
  const [bulkExamplesText, setBulkExamplesText] = useState('');
  const [showBulkEx, setShowBulkEx] = useState(false);

  // Sync initialKanji on open
  useEffect(() => {
    if (initialKanji) {
      setKanjiChar(initialKanji.kanji || '');
      setHanViet(initialKanji.han_viet || '');
      setMeaningVi(initialKanji.meaning_vi || '');
      setOnyomi((initialKanji.onyomi || []).join(', '));
      setKunyomi((initialKanji.kunyomi || []).join(', '));
      setStrokes(initialKanji.strokes || 0);
      setJlpt(initialKanji.jlpt || 'N3');
      setLesson(initialKanji.lesson || 1);
      setStory(initialKanji.mnemonic?.story || '');
      setImageUrl(initialKanji.mnemonic?.image_url || '');
      setImagePreview(initialKanji.mnemonic?.image_url || '');
      setExamples(initialKanji.examples || []);
      setActiveMode('manual');
    } else {
      // Reset form for create
      setKanjiChar('');
      setHanViet('');
      setMeaningVi('');
      setOnyomi('');
      setKunyomi('');
      setStrokes(0);
      setJlpt('N3');
      setLesson(1);
      setStory('');
      setImageUrl('');
      setImagePreview('');
      setExamples([]);
      setActiveMode('quick_ai');
    }
    setEditingExIdx(null);
  }, [initialKanji, isOpen]);

  // Handle Ctrl+V paste of images anywhere in modal
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setImagePreview(base64);
              setImageUrl(base64);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Copy prompt template to clipboard
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Parse text pasted from AI
  const handleApplyAiText = () => {
    if (!aiRawText.trim()) return;

    const parsed = parseAiResponse(aiRawText);
    let countFills = 0;

    if (parsed.kanji) {
      setKanjiChar(parsed.kanji);
      countFills++;
    }
    if (parsed.han_viet) {
      setHanViet(parsed.han_viet);
      countFills++;
    }
    if (parsed.meaning_vi) {
      setMeaningVi(parsed.meaning_vi);
      countFills++;
    }
    if (parsed.onyomi && parsed.onyomi.length > 0) {
      setOnyomi(parsed.onyomi.join(', '));
      countFills++;
    }
    if (parsed.kunyomi && parsed.kunyomi.length > 0) {
      setKunyomi(parsed.kunyomi.join(', '));
      countFills++;
    }
    if (parsed.strokes) {
      setStrokes(parsed.strokes);
      countFills++;
    }
    if (parsed.jlpt) {
      setJlpt(parsed.jlpt);
      countFills++;
    }
    if (parsed.story) {
      setStory(parsed.story);
      countFills++;
    }
    if (parsed.examples && parsed.examples.length > 0) {
      setExamples(parsed.examples);
      countFills++;
    }

    setParseSuccessMsg(
      `Đã phân tích thành công! Đã tự động điền chữ ${parsed.kanji || ''} cùng ${parsed.examples?.length || 0} từ vựng ví dụ.`
    );
    setTimeout(() => setParseSuccessMsg(''), 4000);
  };

  // Parse bulk examples in manual mode
  const handleApplyBulkExamples = () => {
    if (!bulkExamplesText.trim()) return;
    const lines = bulkExamplesText.split('\n');
    const newExs: ExampleWord[] = [];

    for (const line of lines) {
      const clean = line.replace(/^\d+[\.\-\)\s]+/, '').trim();
      if (!clean) continue;
      if (clean.includes('|')) {
        const parts = clean.split('|').map((p) => p.trim());
        if (parts.length >= 2) {
          newExs.push({
            word: parts[0] || '',
            reading: parts[1] || '',
            han_viet: (parts[2] || '').toUpperCase(),
            meaning: parts[3] || parts[2] || '',
          });
        }
      }
    }

    if (newExs.length > 0) {
      setExamples([...examples, ...newExs]);
      setBulkExamplesText('');
      setShowBulkEx(false);
    }
  };

  // Auto lookup character info from local dictionary
  const handleAutoLookup = async () => {
    if (!kanjiChar.trim()) return;
    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(kanjiChar.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.han_viet) setHanViet(data.han_viet);
        if (data.meaning_vi && !meaningVi) setMeaningVi(data.meaning_vi);
        if (data.onyomi && data.onyomi.length > 0) setOnyomi(data.onyomi.join(', '));
        if (data.kunyomi && data.kunyomi.length > 0) setKunyomi(data.kunyomi.join(', '));
        if (data.strokes) setStrokes(data.strokes);
        if (data.jlpt) setJlpt(data.jlpt);
      }
    } catch (err) {
      console.error('Auto lookup error:', err);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Add or update single example in list
  const handleSaveExample = () => {
    if (!exWord.trim() || !exMeaning.trim()) return;

    const newEx: ExampleWord = {
      word: exWord.trim(),
      reading: exReading.trim(),
      han_viet: exHanViet.trim().toUpperCase(),
      meaning: exMeaning.trim(),
    };

    if (editingExIdx !== null) {
      // Update existing example
      const updated = [...examples];
      updated[editingExIdx] = newEx;
      setExamples(updated);
      setEditingExIdx(null);
    } else {
      // Add new example
      setExamples([...examples, newEx]);
    }

    setExWord('');
    setExReading('');
    setExHanViet('');
    setExMeaning('');
  };

  const handleStartEditExample = (idx: number) => {
    const target = examples[idx];
    setEditingExIdx(idx);
    setExWord(target.word || '');
    setExReading(target.reading || '');
    setExHanViet(target.han_viet || '');
    setExMeaning(target.meaning || '');
  };

  const handleCancelEditExample = () => {
    setEditingExIdx(null);
    setExWord('');
    setExReading('');
    setExHanViet('');
    setExMeaning('');
  };

  const handleRemoveExample = (idx: number) => {
    setExamples(examples.filter((_, i) => i !== idx));
    if (editingExIdx === idx) {
      handleCancelEditExample();
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        setImageUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit complete kanji (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kanjiChar.trim()) {
      alert('Vui lòng nhập chữ Kanji!');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = imageUrl;

      // If user pasted base64 image, upload to server
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data: imageUrl }),
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          finalImageUrl = upData.url;
        }
      }

      if (isEditMode && initialKanji) {
        // Edit existing kanji
        const updatedKanji: KanjiEntry = {
          ...initialKanji,
          kanji: kanjiChar.trim(),
          han_viet: hanViet.trim().toUpperCase(),
          meaning_vi: meaningVi.trim(),
          onyomi: onyomi ? onyomi.split(',').map((s) => s.trim()) : [],
          kunyomi: kunyomi ? kunyomi.split(',').map((s) => s.trim()) : [],
          strokes: Number(strokes) || 0,
          jlpt,
          lesson: Number(lesson) || initialKanji.lesson || 1,
          mnemonic: {
            image_url: finalImageUrl,
            story: story.trim(),
          },
          examples,
          custom: true,
        };

        const res = await fetch('/api/kanji', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', kanji: updatedKanji }),
        });

        if (res.ok) {
          if (onKanjiUpdated) onKanjiUpdated(updatedKanji);
          onClose();
        }
      } else {
        // Create brand new kanji
        const newKanji: Partial<KanjiEntry> = {
          kanji: kanjiChar.trim(),
          han_viet: hanViet.trim().toUpperCase(),
          meaning_vi: meaningVi.trim(),
          onyomi: onyomi ? onyomi.split(',').map((s) => s.trim()) : [],
          kunyomi: kunyomi ? kunyomi.split(',').map((s) => s.trim()) : [],
          strokes: Number(strokes) || 0,
          jlpt,
          lesson: Number(lesson) || 1,
          mnemonic: {
            image_url: finalImageUrl,
            story: story.trim(),
          },
          examples,
        };

        const res = await fetch('/api/kanji', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', kanji: newKanji }),
        });

        if (res.ok) {
          const data = await res.json();
          onKanjiAdded(data.item);
          onClose();
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isEditMode ? `Chỉnh sửa chữ Kanji 「${initialKanji?.kanji}」` : 'Thêm chữ Kanji tùy thích'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? 'Cập nhật lại Hán Việt, câu chuyện nhớ, hình ảnh và các từ ví dụ'
                : 'Mở rộng từ điển cá nhân với ảnh và câu chuyện Look & Learn'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Only if creating new) */}
        {!isEditMode && (
          <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 pt-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('quick_ai')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeMode === 'quick_ai'
                  ? 'bg-white text-red-600 border-red-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Dán nhanh từ AI (Khuyên dùng ⚡)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeMode === 'manual'
                  ? 'bg-white text-slate-900 border-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Nhập thủ công</span>
            </button>
          </div>
        )}

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* AI Quick Paste Section */}
          {!isEditMode && activeMode === 'quick_ai' && (
            <div className="p-4 bg-gradient-to-br from-amber-50/60 to-rose-50/40 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Quy trình Dán kết quả từ AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg shadow-sm transition-all active:scale-95"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã copy Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>1. Copy Prompt gửi AI</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <b>Bước 1:</b> Bấm nút copy ở trên $\rightarrow$ Dán vào <b>ChatGPT / Claude / Gemini</b> và gõ chữ Kanji bạn cần tạo ảnh & ví dụ.<br />
                <b>Bước 2:</b> Copy toàn bộ câu trả lời của AI và dán vào ô bên dưới $\rightarrow$ Bấm <b>"⚡ Tự động điền"</b>.
              </p>

              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={aiRawText}
                  onChange={(e) => setAiRawText(e.target.value)}
                  placeholder="2. Dán đoạn văn bản hoặc JSON mà AI vừa trả về vào đây..."
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl outline-none focus:border-red-500 font-mono"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleApplyAiText}
                    disabled={!aiRawText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    <span>⚡ Phân tích & Tự động điền Form</span>
                  </button>

                  {parseSuccessMsg && (
                    <span className="text-xs font-semibold text-emerald-700 animate-in fade-in">
                      {parseSuccessMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Kanji character input with Auto-lookup */}
          <div>
            <label className="text-xs font-bold text-slate-700">Chữ Kanji (*)</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                required
                maxLength={4}
                value={kanjiChar}
                onChange={(e) => setKanjiChar(e.target.value)}
                placeholder="Ví dụ: 桜, 猫, 鬱..."
                className="w-28 text-center text-2xl font-bold font-serif py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAutoLookup}
                disabled={isLookingUp || !kanjiChar.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
              >
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>{isLookingUp ? 'Đang tra...' : 'Tra cứu Hán Việt'}</span>
              </button>
              <span className="text-[11px] text-slate-400 italic">
                (Tự động điền Hán Việt, On/Kun, số nét từ từ điển)
              </span>
            </div>
          </div>

          {/* Details Row: Han Viet & Meaning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Âm Hán Việt</label>
              <input
                type="text"
                value={hanViet}
                onChange={(e) => setHanViet(e.target.value)}
                placeholder="Ví dụ: ANH, MIÊU..."
                className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 uppercase font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Nghĩa tiếng Việt</label>
              <input
                type="text"
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                placeholder="Ví dụ: Hoa anh đào, con mèo..."
                className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* On/Kun & Strokes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Âm On (Katakana)</label>
              <input
                type="text"
                value={onyomi}
                onChange={(e) => setOnyomi(e.target.value)}
                placeholder="Ví dụ: オウ, ビョウ"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Âm Kun (Hiragana)</label>
              <input
                type="text"
                value={kunyomi}
                onChange={(e) => setKunyomi(e.target.value)}
                placeholder="Ví dụ: さくら, ねこ"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Số nét</label>
                <input
                  type="number"
                  min={1}
                  value={strokes || ''}
                  onChange={(e) => setStrokes(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">JLPT</label>
                <select
                  value={jlpt}
                  onChange={(e) => setJlpt(e.target.value)}
                  className="w-full mt-1 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mnemonic Story */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Câu chuyện / Mẹo liên tưởng để nhớ (Look & Learn)
            </label>
            <textarea
              rows={2}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Ví dụ: Hình ảnh cái cây có người đứng ngắm hoa..."
              className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
            />
          </div>

          {/* Mnemonic Image Upload & Paste */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Hình ảnh minh họa dễ nhớ (Look & Learn)</label>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                ⚡ Mẹo: Nhấn Ctrl+V để dán ảnh trực tiếp từ AI / Clipboard!
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Box */}
              <div className="w-28 h-28 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 p-2 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                    <span className="text-[10px]">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Chọn file từ máy</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">hoặc sao chép ảnh rồi bấm <b>Ctrl+V</b></span>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageUrl('');
                      }}
                      className="text-xs text-red-600 hover:underline ml-auto"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="Hoặc dán đường link URL hình ảnh..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Examples list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Danh sách từ vựng ví dụ ({examples.length})
              </label>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowBulkEx(!showBulkEx)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  {showBulkEx ? 'Ẩn dán hàng loạt' : '+ Dán nhiều ví dụ dạng text (|)'}
                </button>
              )}
            </div>

            {/* Bulk Example Input Box */}
            {showBulkEx && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 animate-in fade-in">
                <p className="text-[11px] text-blue-900">
                  Dán mỗi dòng một từ theo định dạng: <b>Kanji | Hiragana | Hán Việt | Nghĩa</b>
                </p>
                <textarea
                  rows={3}
                  value={bulkExamplesText}
                  onChange={(e) => setBulkExamplesText(e.target.value)}
                  placeholder={`1. 桜 | さくら | ANH | hoa anh đào\n2. 桜花 | おうか | ANH HOA | hoa anh đào`}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkExamples}
                  className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Thêm danh sách này
                </button>
              </div>
            )}

            {/* Existing added examples */}
            {examples.length > 0 && (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                {examples.map((ex, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2.5 text-xs ${
                      editingExIdx === i ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-800">{ex.word}</span>
                      {ex.reading && <span className="text-slate-500 ml-1">({ex.reading})</span>}
                      {ex.han_viet && <span className="text-red-700 font-bold ml-1">[{ex.han_viet}]</span>}:{' '}
                      <span className="text-slate-700">{ex.meaning}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditExample(i)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="Sửa từ ví dụ này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExample(i)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Xóa ví dụ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add or edit single example sub-form */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">
                  {editingExIdx !== null ? `Đang chỉnh sửa từ ví dụ #${editingExIdx + 1}` : 'Thêm từ ví dụ:'}
                </span>
                {editingExIdx !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEditExample}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Từ Kanji"
                  value={exWord}
                  onChange={(e) => setExWord(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Hiragana"
                  value={exReading}
                  onChange={(e) => setExReading(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Hán Việt"
                  value={exHanViet}
                  onChange={(e) => setExHanViet(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg uppercase outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Nghĩa tiếng Việt"
                  value={exMeaning}
                  onChange={(e) => setExMeaning(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveExample}
                disabled={!exWord.trim() || !exMeaning.trim()}
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 ${
                  editingExIdx !== null
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-slate-800 bg-white hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {editingExIdx !== null ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Cập nhật từ ví dụ này</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm từ này vào danh sách</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !kanjiChar.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : isEditMode
                ? 'Lưu thay đổi'
                : 'Lưu chữ Kanji vào từ điển'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
