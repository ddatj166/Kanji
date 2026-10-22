'use client';

import React from 'react';
import { BookOpen, Layers, PlusCircle, Star, Sparkles } from 'lucide-react';
import { BookFilter } from '@/types/kanji';

interface NavbarProps {
  activeTab: BookFilter;
  onTabChange: (tab: BookFilter) => void;
  onOpenAddModal: () => void;
  onOpenFlashcards: () => void;
  counts: {
    total: number;
    book1: number;
    book2: number;
    custom: number;
    bookmarked: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenFlashcards,
  counts,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('all')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <span className="text-xl font-bold font-serif">漢</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Kanji Look & Learn</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {counts.total} chữ
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Từ điển & Ghi nhớ chữ Hán qua hình ảnh</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Flashcard Button */}
            <button
              onClick={onOpenFlashcards}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all shadow-sm"
              title="Luyện tập Flashcard"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Flashcard</span>
            </button>

            {/* Bookmark Filter Button */}
            <button
              onClick={() => onTabChange(activeTab === 'bookmarked' ? 'all' : 'bookmarked')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all border ${
                activeTab === 'bookmarked'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title="Xem các từ đã lưu"
            >
              <Star className={`w-4 h-4 ${activeTab === 'bookmarked' ? 'fill-white text-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">Đã lưu</span>
              {counts.bookmarked > 0 && (
                <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                  activeTab === 'bookmarked' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {counts.bookmarked}
                </span>
              )}
            </button>

            {/* Add Custom Kanji Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all shadow-md shadow-red-600/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm từ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
