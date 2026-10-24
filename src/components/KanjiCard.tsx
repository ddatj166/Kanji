'use client';

import React from 'react';
import { Star, Volume2 } from 'lucide-react';
import { KanjiEntry } from '@/types/kanji';
import { speakJapanese } from '@/lib/speech';

interface KanjiCardProps {
  kanji: KanjiEntry;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  viewMode: 'grid' | 'compact';
}

export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  isBookmarked,
  onToggleBookmark,
  onClick,
  viewMode,
}) => {
  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakJapanese(kanji.kanji);
  };

  const sourceLabel =
    kanji.book === 1
      ? `Q1 · B${kanji.lesson}`
      : kanji.book === 2
      ? `Q2 · B${kanji.lesson}`
      : `Tự thêm · B${kanji.lesson}`;

  if (viewMode === 'compact') {
    const readings = [
      ...(kanji.onyomi || []),
      ...(kanji.kunyomi || []),
    ]
      .slice(0, 3)
      .join(' · ');

    return (
      <div
        onClick={onClick}
        className="group flex items-center justify-between gap-3 px-4 py-2.5 bg-white hover:bg-slate-50/90 border border-slate-200/80 hover:border-slate-300 rounded-xl cursor-pointer transition-all"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <span className="w-10 text-center text-2xl font-bold font-serif text-slate-900 group-hover:text-red-700 transition-colors shrink-0">
            {kanji.kanji}
          </span>

          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide shrink-0 sm:w-28 truncate">
              {kanji.han_viet || '---'}
            </span>
            <span className="text-xs text-slate-700 truncate flex-1">
              {kanji.meaning_vi || kanji.meaning_en || '---'}
            </span>
            {readings && (
              <span className="hidden lg:inline text-xs text-slate-400 truncate max-w-[180px]">
                {readings}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-[11px] text-slate-400 font-medium">
            {sourceLabel}
          </span>

          <button
            type="button"
            onClick={handleAudio}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Nghe phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => onToggleBookmark(kanji.id, e)}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-500 hover:bg-amber-50'
                : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
            }`}
            title={isBookmarked ? 'Bỏ lưu' : 'Lưu chữ này'}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // Minimalist Grid Mode: Only Kanji prominently, no image
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between bg-white border border-slate-200/80 hover:border-red-300 hover:shadow-md hover:shadow-slate-900/5 rounded-2xl p-3 cursor-pointer transition-all duration-200"
    >
      {/* Subtle Top Meta */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-medium text-slate-400">
          {sourceLabel}
        </span>

        <button
          type="button"
          onClick={(e) => onToggleBookmark(kanji.id, e)}
          className={`p-1 -mr-1 -mt-1 rounded-lg transition-all ${
            isBookmarked
              ? 'text-amber-500 opacity-100'
              : 'text-slate-300 opacity-60 sm:opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50/60'
          }`}
          title={isBookmarked ? 'Bỏ lưu' : 'Lưu từ này'}
        >
          <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Prominent Minimalist Kanji Center */}
      <div className="py-4 my-auto flex items-center justify-center">
        <span className="text-5xl sm:text-6xl font-bold font-serif text-slate-900 group-hover:text-red-700 group-hover:scale-105 transition-all duration-200 select-none leading-none">
          {kanji.kanji}
        </span>
      </div>

      {/* Minimal Footer: Han Viet & Meaning */}
      <div className="text-center pt-1 border-t border-slate-100">
        <h3 className="text-xs font-bold text-red-700 tracking-wider uppercase truncate">
          {kanji.han_viet || '---'}
        </h3>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">
          {kanji.meaning_vi || kanji.meaning_en || '---'}
        </p>
      </div>
    </div>
  );
};
