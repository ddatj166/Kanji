'use client';

import React from 'react';
import { Search, X, BookOpen, Layers, Star, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { BookFilter } from '@/types/kanji';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: BookFilter;
  onTabChange: (tab: BookFilter) => void;
  selectedLesson: number | 'all';
  onLessonChange: (lesson: number | 'all') => void;
  selectedJlpt: string | 'all';
  onJlptChange: (jlpt: string | 'all') => void;
  viewMode: 'grid' | 'compact';
  onViewModeChange: (mode: 'grid' | 'compact') => void;
  counts: {
    total: number;
    book1: number;
    book2: number;
    custom: number;
    bookmarked: number;
  };
  availableLessons: number[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedLesson,
  onLessonChange,
  selectedJlpt,
  onJlptChange,
  viewMode,
  onViewModeChange,
  counts,
  availableLessons,
}) => {
  return (
    <div className="bg-white border-b border-slate-200/80 shadow-sm sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Top row: Search Bar & View Mode */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tra từ: Gõ Kanji (日), Hán Việt (nhật, nhat), Nghĩa (mặt trời), hoặc On/Kun (nichi)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end sm:self-auto">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md text-sm transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ lưới trực quan (có ảnh)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-md text-sm transition-all ${
                viewMode === 'compact'
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ danh sách gọn"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom row: Book Tabs & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => onTabChange('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({counts.total})
            </button>
            <button
              onClick={() => onTabChange('book1')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'book1'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Quyển 1 ({counts.book1})
            </button>
            <button
              onClick={() => onTabChange('book2')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'book2'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Quyển 2 ({counts.book2})
            </button>
            <button
              onClick={() => onTabChange('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Tự thêm ({counts.custom})
            </button>
          </div>

          {/* Lesson & JLPT Selectors */}
          <div className="flex items-center gap-2">
            {/* Lesson Dropdown */}
            {availableLessons.length > 0 && (
              <select
                value={selectedLesson}
                onChange={(e) => onLessonChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-red-500 outline-none"
              >
                <option value="all">Tất cả bài học</option>
                {availableLessons.map((l) => (
                  <option key={l} value={l}>
                    Bài {l}
                  </option>
                ))}
              </select>
            )}

            {/* JLPT Filter */}
            <select
              value={selectedJlpt}
              onChange={(e) => onJlptChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-red-500 outline-none"
            >
              <option value="all">Tất cả JLPT</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
