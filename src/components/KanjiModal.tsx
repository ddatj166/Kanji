'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import {
  X,
  Volume2,
  Star,
  Plus,
  Lightbulb,
  Trash2,
  AlertTriangle,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { KanjiEntry, ExampleWord } from '@/types/kanji';
import { speakJapanese } from '@/lib/speech';

interface KanjiModalProps {
  kanji: KanjiEntry | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onUpdateKanji: (updated: KanjiEntry) => void;
  onDeleteKanji: (kanji: KanjiEntry) => void;
  onEditKanji: (kanji: KanjiEntry) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const KanjiModal: React.FC<KanjiModalProps> = ({
  kanji,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onUpdateKanji,
  onDeleteKanji,
  onEditKanji,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [showAddExample, setShowAddExample] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newReading, setNewReading] = useState('');
  const [newHanViet, setNewHanViet] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmDeleteExIdx, setConfirmDeleteExIdx] = useState<number | null>(null);

  // Reset internal UI states when switching Kanji
  useEffect(() => {
    setShowAddExample(false);
    setShowDeleteConfirm(false);
    setConfirmDeleteExIdx(null);
    setNewWord('');
    setNewReading('');
    setNewHanViet('');
    setNewMeaning('');
  }, [kanji?.id]);

  // Open/close native <dialog> and bind light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (kanji && !dialog.open) {
      dialog.showModal();
    } else if (!kanji && dialog.open) {
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
  }, [kanji]);

  // Keyboard navigation: Left/Right arrows to switch Kanji
  useEffect(() => {
    if (!kanji) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kanji, hasPrev, hasNext, onPrev, onNext]);

  if (!kanji) return null;

  const isCustom = kanji.custom || kanji.book === 3 || kanji.id.startsWith('custom-');

  const handleAddExampleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;

    setIsSaving(true);
    const newEx: ExampleWord = {
      word: newWord.trim(),
      reading: newReading.trim(),
      han_viet: newHanViet.trim().toUpperCase(),
      meaning: newMeaning.trim(),
    };

    const updatedKanji: KanjiEntry = {
      ...kanji,
      examples: [...(kanji.examples || []), newEx],
    };

    try {
      const res = await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_or_add_example',
          kanji: updatedKanji,
        }),
      });

      if (res.ok) {
        onUpdateKanji(updatedKanji);
        setNewWord('');
        setNewReading('');
        setNewHanViet('');
        setNewMeaning('');
        setShowAddExample(false);
      }
    } catch (err) {
      console.error('Error saving example:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExample = async (indexToRemove: number) => {
    const updatedExamples = (kanji.examples || []).filter((_, i) => i !== indexToRemove);
    const updatedKanji: KanjiEntry = {
      ...kanji,
      examples: updatedExamples,
    };
    setConfirmDeleteExIdx(null);

    try {
      const res = await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_or_add_example',
          kanji: updatedKanji,
        }),
      });

      if (res.ok) {
        onUpdateKanji(updatedKanji);
      }
    } catch (err) {
      console.error('Error deleting example:', err);
    }
  };

  const handleConfirmDelete = () => {
    onDeleteKanji(kanji);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto p-0 w-[calc(100%-1.5rem)] max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[90vh] backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm outline-none"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Compact Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {kanji.book === 1 ? 'Quyển 1' : kanji.book === 2 ? 'Quyển 2' : 'Tự thêm'} • Bài {kanji.lesson}
            </span>
            {kanji.jlpt && (
              <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {kanji.jlpt}
              </span>
            )}
            <span className="text-slate-400">{kanji.strokes} nét</span>
            <span className="text-slate-300 font-mono">#{kanji.number}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Prev / Next Navigation */}
            {(hasPrev || hasNext) && (
              <div className="flex items-center mr-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  title="Chữ trước (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!hasNext}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  title="Chữ tiếp theo (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleBookmark(kanji.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'Bỏ lưu' : 'Lưu chữ này'}
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onEditKanji(kanji)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Chỉnh sửa thông tin chữ này"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {isCustom && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa chữ này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Xóa chữ <b>「{kanji.kanji}」</b>? (Có thể hoàn tác sau khi xóa).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-white rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Xóa
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Unified Hero: Kanji Info (Left) + Look & Learn Visual & Story (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
            {/* Left: Kanji Character & Core Meaning */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-7xl sm:text-8xl font-bold font-serif text-slate-900 leading-none select-all">
                {kanji.kanji}
              </span>
              <div className="flex items-center gap-1.5 mt-3.5">
                <h2
                  id={titleId}
                  className="text-lg font-bold text-red-700 tracking-wide uppercase"
                >
                  {kanji.han_viet || '---'}
                </h2>
                <button
                  type="button"
                  onClick={() => speakJapanese(kanji.kanji)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {kanji.meaning_vi}
              </p>
            </div>

            {/* Right: Combined Look & Learn Image + Story */}
            <div className="sm:col-span-7 flex flex-col justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 gap-3">
              <div className="w-full h-40 sm:h-44 flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-100 p-2">
                {kanji.mnemonic.image_url ? (
                  <img
                    src={kanji.mnemonic.image_url}
                    alt={kanji.kanji}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-300 italic text-xs">
                    Chưa có hình minh họa
                  </span>
                )}
              </div>

              {kanji.mnemonic.story && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-amber-950 leading-relaxed">
                    {kanji.mnemonic.story}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Compact On / Kun Readings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12 shrink-0">
                Kun
              </span>
              <div className="flex flex-wrap gap-1.5">
                {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                  kanji.kunyomi.map((k, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => speakJapanese(k.replace(/[-.]/g, ''))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white hover:border-red-300 text-slate-800 rounded-lg border border-slate-200/90 transition-colors"
                    >
                      <span>{k}</span>
                      <Volume2 className="w-3 h-3 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:border-l sm:border-slate-200/80 sm:pl-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12 shrink-0">
                On
              </span>
              <div className="flex flex-wrap gap-1.5">
                {kanji.onyomi && kanji.onyomi.length > 0 ? (
                  kanji.onyomi.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => speakJapanese(o)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white hover:border-red-300 text-slate-800 rounded-lg border border-slate-200/90 transition-colors"
                    >
                      <span>{o}</span>
                      <Volume2 className="w-3 h-3 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Từ vựng ví dụ ({kanji.examples ? kanji.examples.length : 0})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddExample(!showAddExample)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddExample ? 'Đóng' : 'Thêm ví dụ'}</span>
              </button>
            </div>

            {/* Compact Inline Add Example Form */}
            {showAddExample && (
              <form
                onSubmit={handleAddExampleSubmit}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder={`Từ (${kanji.kanji}語)`}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    value={newReading}
                    onChange={(e) => setNewReading(e.target.value)}
                    placeholder="Hiragana"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    value={newHanViet}
                    onChange={(e) => setNewHanViet(e.target.value)}
                    placeholder="HÁN VIỆT"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 uppercase"
                  />
                  <input
                    type="text"
                    required
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="Nghĩa tiếng Việt *"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExample(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200/70 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            )}

            {/* Example List */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
              {kanji.examples && kanji.examples.length > 0 ? (
                kanji.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => speakJapanese(ex.word || ex.reading)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
                        <div className="flex items-baseline gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-slate-900">
                            {ex.word}
                          </span>
                          {ex.reading && (
                            <span className="text-xs text-slate-500">
                              {ex.reading}
                            </span>
                          )}
                          {ex.han_viet && (
                            <span className="text-[10px] font-semibold text-red-700 uppercase bg-red-50/80 px-1.5 py-0.5 rounded">
                              {ex.han_viet}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 truncate">
                          {ex.meaning}
                        </p>
                      </div>
                    </div>

                    {/* Inline 2-step delete example button */}
                    {confirmDeleteExIdx === idx ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteExample(idx)}
                          className="px-2 py-0.5 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteExIdx(null)}
                          className="px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 rounded-md"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteExIdx(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                        title="Xóa ví dụ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có từ vựng ví dụ.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
