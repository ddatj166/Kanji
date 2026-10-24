'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
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
  Link as LinkIcon,
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isEditMode = !!initialKanji;

  const [activeMode, setActiveMode] = useState<'quick_ai' | 'manual'>('quick_ai');

  // AI Paste text
  const [aiRawText, setAiRawText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [examples, setExamples] = useState<ExampleWord[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Example editing states
  const [editingExIdx, setEditingExIdx] = useState<number | null>(null);
  const [exWord, setExWord] = useState('');
  const [exReading, setExReading] = useState('');
  const [exHanViet, setExHanViet] = useState('');
  const [exMeaning, setExMeaning] = useState('');

  // Bulk examples paste inside manual mode
  const [bulkExamplesText, setBulkExamplesText] = useState('');
  const [showBulkEx, setShowBulkEx] = useState(false);

  // Open/close native <dialog> and bind light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    const handleLightDismissFallback = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      dialog.close();
    };

    dialog.addEventListener('click', handleLightDismissFallback);
    return () => {
      dialog.removeEventListener('click', handleLightDismissFallback);
    };
  }, [isOpen]);

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
      setAiRawText('');
      setActiveMode('quick_ai');
    }
    setEditingExIdx(null);
    setShowUrlInput(false);
    setShowBulkEx(false);
    setSubmitError('');
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

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Parse text pasted from AI and switch to review/manual view
  const handleApplyAiText = () => {
    if (!aiRawText.trim()) return;

    const parsed = parseAiResponse(aiRawText);
    if (parsed.kanji) setKanjiChar(parsed.kanji);
    if (parsed.han_viet) setHanViet(parsed.han_viet);
    if (parsed.meaning_vi) setMeaningVi(parsed.meaning_vi);
    if (parsed.onyomi && parsed.onyomi.length > 0) setOnyomi(parsed.onyomi.join(', '));
    if (parsed.kunyomi && parsed.kunyomi.length > 0) setKunyomi(parsed.kunyomi.join(', '));
    if (parsed.strokes) setStrokes(parsed.strokes);
    if (parsed.jlpt) setJlpt(parsed.jlpt);
    if (parsed.story) setStory(parsed.story);
    if (parsed.examples && parsed.examples.length > 0) setExamples(parsed.examples);

    setActiveMode('manual');
  };

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

  const handleSaveExample = () => {
    if (!exWord.trim() || !exMeaning.trim()) return;

    const newEx: ExampleWord = {
      word: exWord.trim(),
      reading: exReading.trim(),
      han_viet: exHanViet.trim().toUpperCase(),
      meaning: exMeaning.trim(),
    };

    if (editingExIdx !== null) {
      const updated = [...examples];
      updated[editingExIdx] = newEx;
      setExamples(updated);
      setEditingExIdx(null);
    } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kanjiChar.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      let finalImageUrl = imageUrl;

      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data: imageUrl }),
        });
        if (!upRes.ok) {
          throw new Error('Không thể tải ảnh lên máy chủ.');
        }
        const upData = await upRes.json();
        finalImageUrl = upData.url;
      }

      if (isEditMode && initialKanji) {
        const isBookEntry =
          initialKanji.id.startsWith('b1-') || initialKanji.id.startsWith('b2-');
        const updatedKanji: KanjiEntry = {
          ...initialKanji,
          kanji: kanjiChar.trim(),
          han_viet: hanViet.trim().toUpperCase(),
          meaning_vi: meaningVi.trim(),
          onyomi: onyomi ? onyomi.split(',').map((s) => s.trim()).filter(Boolean) : [],
          kunyomi: kunyomi ? kunyomi.split(',').map((s) => s.trim()).filter(Boolean) : [],
          strokes: Number(strokes) || 0,
          jlpt,
          lesson: Number(lesson) || initialKanji.lesson || 1,
          mnemonic: {
            image_url: finalImageUrl,
            story: story.trim(),
          },
          examples,
          custom: !isBookEntry,
          isModified: isBookEntry ? true : undefined,
        };

        const res = await fetch('/api/kanji', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', kanji: updatedKanji }),
        });

        if (!res.ok) {
          throw new Error('Không thể lưu chỉnh sửa vào từ điển.');
        }
        const data = await res.json();
        if (onKanjiUpdated) onKanjiUpdated(data.item || updatedKanji);
        onClose();
      } else {
        const newKanji: Partial<KanjiEntry> = {
          kanji: kanjiChar.trim(),
          han_viet: hanViet.trim().toUpperCase(),
          meaning_vi: meaningVi.trim(),
          onyomi: onyomi ? onyomi.split(',').map((s) => s.trim()).filter(Boolean) : [],
          kunyomi: kunyomi ? kunyomi.split(',').map((s) => s.trim()).filter(Boolean) : [],
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

        if (!res.ok) {
          throw new Error('Không thể thêm chữ Kanji mới vào từ điển.');
        }
        const data = await res.json();
        onKanjiAdded(data.item);
        onClose();
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setSubmitError(err?.message || 'Đã xảy ra lỗi khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable Image Dropzone Block
  const renderImageDropzone = () => (
    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
      <label className="relative w-20 h-20 rounded-xl bg-white border-2 border-dashed border-slate-300 hover:border-red-400 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-colors group">
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="flex flex-col items-center text-slate-400 group-hover:text-red-500 p-1 text-center">
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Chọn ảnh</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </label>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Ảnh minh họa Look & Learn
          </span>
          {imagePreview && (
            <button
              type="button"
              onClick={() => {
                setImagePreview('');
                setImageUrl('');
              }}
              className="text-[11px] text-red-600 hover:underline"
            >
              Xóa ảnh
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Nhấn <b>Ctrl+V</b> để dán ảnh trực tiếp từ Clipboard, hoặc bấm vào ô bên trái để tải lên.
        </p>
        <div>
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Hoặc dán link URL ảnh</span>
            </button>
          ) : (
            <input
              type="text"
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImagePreview(e.target.value);
              }}
              placeholder="https://..."
              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto p-0 w-[calc(100%-1.5rem)] max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[90vh] backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm outline-none"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <h3 id={titleId} className="text-sm font-bold text-slate-800">
              {isEditMode
                ? `Chỉnh sửa chữ 「${initialKanji?.kanji}」`
                : 'Thêm chữ Kanji mới'}
            </h3>

            {/* Mode Switcher Pill (Only when creating new) */}
            {!isEditMode && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveMode('quick_ai')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${
                    activeMode === 'quick_ai'
                      ? 'bg-white text-slate-900 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dán từ AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('manual')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${
                    activeMode === 'manual'
                      ? 'bg-white text-slate-900 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chi tiết {kanjiChar ? `(${kanjiChar})` : ''}</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!isEditMode && activeMode === 'quick_ai' ? (
          /* STEP 1: Focused AI Quick Paste View (Hides manual form clutter) */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Dán nhanh từ ChatGPT / Claude / Gemini
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg shadow-sm transition-all active:scale-95"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã copy Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>1. Copy Prompt mẫu</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Copy Prompt ở trên → Gửi cho AI kèm chữ Kanji muốn học → Dán kết quả AI trả về vào ô dưới đây:
              </p>

              <textarea
                rows={6}
                value={aiRawText}
                onChange={(e) => setAiRawText(e.target.value)}
                placeholder="2. Dán nội dung văn bản mà AI trả về vào đây..."
                className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Image Paste Dropzone right in Quick AI view */}
            {renderImageDropzone()}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveMode('manual')}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tự nhập thủ công
              </button>
              <button
                type="button"
                onClick={handleApplyAiText}
                disabled={!aiRawText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all disabled:opacity-40"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Tiếp tục: Phân tích & Kiểm tra →</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2 / MANUAL: Clean Structured Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* Row 1: Kanji + Han Viet + Meaning */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="text-[11px] font-semibold text-slate-600">
                  Chữ Kanji *
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={kanjiChar}
                    onChange={(e) => setKanjiChar(e.target.value)}
                    placeholder="桜"
                    className="w-16 text-center text-xl font-bold font-serif py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAutoLookup}
                    disabled={isLookingUp || !kanjiChar.trim()}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors disabled:opacity-40"
                    title="Tự động điền Hán Việt, On/Kun, số nét từ từ điển"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="truncate">{isLookingUp ? 'Đang tra...' : 'Tra tự động'}</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600">
                  Âm Hán Việt
                </label>
                <input
                  type="text"
                  value={hanViet}
                  onChange={(e) => setHanViet(e.target.value)}
                  placeholder="ANH"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white uppercase font-bold"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="text-[11px] font-semibold text-slate-600">
                  Nghĩa tiếng Việt
                </label>
                <input
                  type="text"
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                  placeholder="Hoa anh đào..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Row 2: On / Kun / Strokes / JLPT */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
              <div className="col-span-1 sm:col-span-4">
                <label className="text-[11px] font-semibold text-slate-600">
                  Âm On (Katakana)
                </label>
                <input
                  type="text"
                  value={onyomi}
                  onChange={(e) => setOnyomi(e.target.value)}
                  placeholder="オウ, ヨウ"
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
              <div className="col-span-1 sm:col-span-4">
                <label className="text-[11px] font-semibold text-slate-600">
                  Âm Kun (Hiragana)
                </label>
                <input
                  type="text"
                  value={kunyomi}
                  onChange={(e) => setKunyomi(e.target.value)}
                  placeholder="さくら"
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  Số nét
                </label>
                <input
                  type="number"
                  min={1}
                  value={strokes || ''}
                  onChange={(e) => setStrokes(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  JLPT
                </label>
                <select
                  value={jlpt}
                  onChange={(e) => setJlpt(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
            </div>

            {/* Row 3: Image Dropzone & Mnemonic Story */}
            <div className="space-y-3">
              {renderImageDropzone()}

              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  Mẹo ghi nhớ / Câu chuyện liên tưởng
                </label>
                <textarea
                  rows={2}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Câu chuyện giúp nhớ hình dáng chữ..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Row 4: Examples */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-600">
                  Từ vựng ví dụ ({examples.length})
                </label>
                <button
                  type="button"
                  onClick={() => setShowBulkEx(!showBulkEx)}
                  className="text-[11px] font-medium text-red-600 hover:underline"
                >
                  {showBulkEx ? 'Ẩn dán hàng loạt' : '+ Dán nhiều dòng (|)'}
                </button>
              </div>

              {showBulkEx && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <textarea
                    rows={3}
                    value={bulkExamplesText}
                    onChange={(e) => setBulkExamplesText(e.target.value)}
                    placeholder={`桜 | さくら | ANH | hoa anh đào\n桜花 | おうか | ANH HOA | hoa anh đào`}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkExamples}
                    className="px-3 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
                  >
                    Thêm vào danh sách
                  </button>
                </div>
              )}

              {examples.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-36 overflow-y-auto">
                  {examples.map((ex, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 text-xs ${
                        editingExIdx === i ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-800">{ex.word}</span>
                        {ex.reading && (
                          <span className="text-slate-500 ml-1">({ex.reading})</span>
                        )}
                        {ex.han_viet && (
                          <span className="text-red-700 font-semibold ml-1">
                            [{ex.han_viet}]
                          </span>
                        )}
                        <span className="text-slate-600 ml-1.5">— {ex.meaning}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditExample(i)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveExample(i)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Compact 1-row Example Input */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Từ Kanji"
                  value={exWord}
                  onChange={(e) => setExWord(e.target.value)}
                  className="w-[calc(50%-0.2rem)] sm:w-28 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="Hiragana"
                  value={exReading}
                  onChange={(e) => setExReading(e.target.value)}
                  className="w-[calc(50%-0.2rem)] sm:w-28 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="HÁN VIỆT"
                  value={exHanViet}
                  onChange={(e) => setExHanViet(e.target.value)}
                  className="w-[calc(45%-0.2rem)] sm:w-28 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg uppercase outline-none focus:border-red-500 focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="Nghĩa tiếng Việt"
                  value={exMeaning}
                  onChange={(e) => setExMeaning(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveExample();
                    }
                  }}
                  className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleSaveExample}
                  disabled={!exWord.trim() || !exMeaning.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                >
                  {editingExIdx !== null ? 'Cập nhật' : '+ Thêm'}
                </button>
              </div>
            </div>

            {/* Form Actions */}
            {submitError && (
              <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-40"
              >
                {isSubmitting
                  ? 'Đang lưu...'
                  : isEditMode
                  ? 'Lưu thay đổi'
                  : 'Lưu vào từ điển'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
