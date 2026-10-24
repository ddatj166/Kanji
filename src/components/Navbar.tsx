'use client';

import React, { useEffect, useRef } from 'react';
import { Plus, Sparkles, Search, X } from 'lucide-react';
import { BookFilter } from '@/types/kanji';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResetAll: () => void;
  onOpenAddModal: () => void;
  onOpenFlashcards: () => void;
  filteredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onResetAll,
  onOpenAddModal,
  onOpenFlashcards,
  filteredCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Press '/' or Ctrl+K / Cmd+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={onResetAll}
            className="flex items-center gap-2.5 text-left group shrink-0 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-red-600 group-hover:bg-red-700 flex items-center justify-center text-white shadow-sm transition-colors">
              <span className="text-lg font-bold font-serif leading-none">漢</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Kanji Look & Learn
              </h1>
            </div>
          </button>

          {/* Centered Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  if (searchQuery) onSearchChange('');
                  else searchInputRef.current?.blur();
                }
              }}
              placeholder="Tìm Kanji, Hán Việt, nghĩa, âm đọc..."
              className="w-full pl-9 pr-14 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl border border-transparent focus:border-red-500 focus:ring-2 focus:ring-red-500/15 outline-none transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded-md absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenFlashcards}
              disabled={filteredCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 transition-all disabled:opacity-40"
              title="Ôn tập Flashcard với danh sách đang hiển thị"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Flashcard</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
