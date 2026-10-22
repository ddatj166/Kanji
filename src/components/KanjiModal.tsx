'use client';

import React, { useState } from 'react';
import {
  X,
  Volume2,
  Star,
  Plus,
  Check,
  BookOpen,
  Lightbulb,
  Trash2,
  AlertTriangle,
  Edit2,
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
}

export const KanjiModal: React.FC<KanjiModalProps> = ({
  kanji,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onUpdateKanji,
  onDeleteKanji,
  onEditKanji,
}) => {
  const [showAddExample, setShowAddExample] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newReading, setNewReading] = useState('');
  const [newHanViet, setNewHanViet] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!kanji) return null;

  const isCustom = kanji.custom || kanji.book === 3 || kanji.id.startsWith('custom-');

  const handleAddExampleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newMeaning) return;

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
    if (!confirm('Bạn có chắc muốn xóa từ ví dụ này?')) return;

    const updatedExamples = (kanji.examples || []).filter((_, i) => i !== indexToRemove);
    const updatedKanji: KanjiEntry = {
      ...kanji,
      examples: updatedExamples,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                kanji.book === 1
                  ? 'bg-red-100 text-red-700'
                  : kanji.book === 2
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {kanji.book === 1 ? 'Quyển 1' : kanji.book === 2 ? 'Quyển 2' : 'Tự thêm'} • Bài {kanji.lesson}
            </span>
            {kanji.jlpt && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {kanji.jlpt}
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">#{kanji.number}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Edit button */}
            <button
              onClick={() => onEditKanji(kanji)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200"
              title="Chỉnh sửa chữ này"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sửa</span>
            </button>

            {/* Delete custom kanji button */}
            {isCustom && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Xóa chữ này khỏi từ điển"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onToggleBookmark(kanji.id)}
              className={`p-1.5 rounded-xl transition-all ${
                isBookmarked ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'
              }`}
              title="Đánh dấu từ này"
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-medium text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Bạn có chắc chắn muốn xóa chữ <b>「{kanji.kanji}」</b>? (Bạn có thể bấm Hoàn tác ngay sau khi xóa).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Visual Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Left: Kanji Character Box */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50/70 to-rose-100/50 rounded-2xl border border-red-100">
              <span className="text-8xl font-bold font-serif text-slate-900 leading-none">
                {kanji.kanji}
              </span>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xl font-bold text-red-700 tracking-wider uppercase">
                  {kanji.han_viet}
                </span>
                <button
                  onClick={() => speakJapanese(kanji.kanji)}
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-white rounded-lg transition-colors shadow-sm"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-1 text-center">
                {kanji.meaning_vi}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-medium">
                <span>Số nét: <b>{kanji.strokes}</b></span>
              </div>
            </div>

            {/* Right: Look & Learn Illustration Image */}
            <div className="sm:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="w-full h-56 flex items-center justify-center overflow-hidden rounded-xl bg-white p-2">
                {kanji.mnemonic.image_url ? (
                  <img
                    src={kanji.mnemonic.image_url}
                    alt={kanji.kanji}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400 italic text-sm">Chưa có hình ảnh minh họa</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Hình ảnh minh họa liên tưởng (Look & Learn)
              </p>
            </div>
          </div>

          {/* Mnemonic Story Box */}
          {kanji.mnemonic.story && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Mẹo ghi nhớ chữ Hán
                  </h4>
                  <p className="text-sm font-medium text-amber-950 mt-1 leading-relaxed">
                    {kanji.mnemonic.story}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* On/Kun Readings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kunyomi */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Âm Kun (Kunyomi)
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                  kanji.kunyomi.map((k, i) => (
                    <button
                      key={i}
                      onClick={() => speakJapanese(k.replace(/[-.]/g, ''))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors"
                    >
                      <span>{k}</span>
                      <Volume2 className="w-3 h-3 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Không có</span>
                )}
              </div>
            </div>

            {/* Onyomi */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Âm On (Onyomi)
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {kanji.onyomi && kanji.onyomi.length > 0 ? (
                  kanji.onyomi.map((o, i) => (
                    <button
                      key={i}
                      onClick={() => speakJapanese(o)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors"
                    >
                      <span>{o}</span>
                      <Volume2 className="w-3 h-3 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Không có</span>
                )}
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                Từ vựng ví dụ ({kanji.examples ? kanji.examples.length : 0})
              </h4>
              <button
                onClick={() => setShowAddExample(!showAddExample)}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm từ ví dụ mới</span>
              </button>
            </div>

            {/* Add Example Form (Collapsible) */}
            {showAddExample && (
              <form
                onSubmit={handleAddExampleSubmit}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in"
              >
                <h5 className="text-xs font-bold text-slate-700">Thêm từ vựng mới cho chữ 「{kanji.kanji}」</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Từ vựng (Kanji)</label>
                    <input
                      type="text"
                      required
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder={`Ví dụ: ${kanji.kanji}語, ${kanji.kanji}曜日`}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Cách đọc (Hiragana)</label>
                    <input
                      type="text"
                      value={newReading}
                      onChange={(e) => setNewReading(e.target.value)}
                      placeholder="Ví dụ: にほんご"
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Âm Hán Việt (Tùy chọn)</label>
                    <input
                      type="text"
                      value={newHanViet}
                      onChange={(e) => setNewHanViet(e.target.value)}
                      placeholder="Ví dụ: NHẬT BẢN NGỮ"
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Nghĩa tiếng Việt</label>
                    <input
                      type="text"
                      required
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      placeholder="Ví dụ: Tiếng Nhật"
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExample(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu từ vựng'}
                  </button>
                </div>
              </form>
            )}

            {/* Example List Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
              {kanji.examples && kanji.examples.length > 0 ? (
                kanji.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => speakJapanese(ex.word || ex.reading)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-slate-800">{ex.word}</span>
                          {ex.reading && (
                            <span className="text-xs text-slate-500 font-medium">({ex.reading})</span>
                          )}
                          {ex.han_viet && (
                            <span className="text-[11px] font-bold text-red-700 uppercase bg-red-50 px-1.5 py-0.2 rounded">
                              {ex.han_viet}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{ex.meaning}</p>
                      </div>
                    </div>

                    {/* Delete single example button */}
                    <button
                      onClick={() => handleDeleteExample(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa từ ví dụ này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Chưa có ví dụ nào. Bấm nút "+ Thêm từ ví dụ mới" ở trên để bổ sung!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
