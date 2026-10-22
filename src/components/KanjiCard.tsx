'use client';

import React from 'react';
import { Star, Volume2, Trash2, Edit2 } from 'lucide-react';
import { KanjiEntry } from '@/types/kanji';
import { speakJapanese } from '@/lib/speech';

interface KanjiCardProps {
  kanji: KanjiEntry;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onDeleteKanji?: (kanji: KanjiEntry, e: React.MouseEvent) => void;
  onEditKanji?: (kanji: KanjiEntry, e: React.MouseEvent) => void;
  onClick: () => void;
  viewMode: 'grid' | 'compact';
}

export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  isBookmarked,
  onToggleBookmark,
  onDeleteKanji,
  onEditKanji,
  onClick,
  viewMode,
}) => {
  const isCustom = kanji.custom || kanji.book === 3 || kanji.id.startsWith('custom-');

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakJapanese(kanji.kanji);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteKanji) {
      onDeleteKanji(kanji, e);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditKanji) {
      onEditKanji(kanji, e);
    }
  };

  const bookColor =
    kanji.book === 1
      ? 'bg-red-50 text-red-700 border-red-200'
      : kanji.book === 2
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (viewMode === 'compact') {
    return (
      <div
        onClick={onClick}
        className="group flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl cursor-pointer transition-all hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-50 group-hover:bg-red-50 border border-slate-200 group-hover:border-red-200 transition-colors">
            <span className="text-2xl font-bold font-serif text-slate-800 group-hover:text-red-700">
              {kanji.kanji}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-red-700 uppercase">{kanji.han_viet || '---'}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${bookColor}`}>
                {kanji.book === 1 ? 'Q1' : kanji.book === 2 ? 'Q2' : 'Tự thêm'} - B{kanji.lesson}
              </span>
              {kanji.jlpt && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {kanji.jlpt}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 line-clamp-1">{kanji.meaning_vi}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {kanji.mnemonic.image_url && (
            <img
              src={kanji.mnemonic.image_url}
              alt={kanji.kanji}
              className="w-10 h-10 object-contain rounded border border-slate-200 hidden sm:block bg-white mr-1"
              loading="lazy"
            />
          )}
          <button
            onClick={handleAudio}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onToggleBookmark(kanji.id, e)}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>
          {onEditKanji && (
            <button
              onClick={handleEdit}
              className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa chữ này"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isCustom && onDeleteKanji && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa chữ này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer hover:shadow-xl hover:border-red-300/80 transition-all duration-200 hover:-translate-y-1"
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${bookColor}`}>
            {kanji.book === 1 ? 'Quyển 1' : kanji.book === 2 ? 'Quyển 2' : 'Tự thêm'} • Bài {kanji.lesson}
          </span>
          {kanji.jlpt && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {kanji.jlpt}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleAudio}
            className="p-1 text-slate-300 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onToggleBookmark(kanji.id, e)}
            className={`p-1 rounded-lg transition-colors ${
              isBookmarked ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>
          {onEditKanji && (
            <button
              onClick={handleEdit}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Chỉnh sửa chữ này"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isCustom && onDeleteKanji && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Xóa chữ này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Kanji & Mnemonic Image Container */}
      <div className="grid grid-cols-2 gap-3 items-center py-2">
        {/* Kanji Character Box */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/60 group-hover:border-red-200 transition-colors">
          <span className="text-5xl font-bold font-serif text-slate-800 group-hover:text-red-700 transition-colors">
            {kanji.kanji}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">{kanji.strokes} nét</span>
        </div>

        {/* Look & Learn Illustration Thumbnail */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 flex items-center justify-center p-1.5">
          {kanji.mnemonic.image_url ? (
            <img
              src={kanji.mnemonic.image_url}
              alt={kanji.kanji}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <span className="text-xs text-slate-400 italic">Chưa có ảnh</span>
          )}
        </div>
      </div>

      {/* Bottom Info: Han Viet & Meaning */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-red-700 tracking-wide uppercase">
            {kanji.han_viet || '---'}
          </h3>
          <span className="text-xs text-slate-400 font-mono">#{kanji.number}</span>
        </div>
        <p className="text-xs font-medium text-slate-700 mt-0.5 line-clamp-1">
          {kanji.meaning_vi || kanji.meaning_en || '---'}
        </p>

        {/* Quick Example count */}
        {kanji.examples && kanji.examples.length > 0 && (
          <p className="text-[11px] text-slate-500 mt-1">
            {kanji.examples.length} từ vựng ví dụ
          </p>
        )}
      </div>
    </div>
  );
};
