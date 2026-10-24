'use client';

import React from 'react';
import { Star, LayoutGrid, List, RotateCcw } from 'lucide-react';
import { BookFilter } from '@/types/kanji';

interface FilterBarProps {
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
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
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
  hasActiveFilters,
  onResetFilters,
}) => {
  const tabs: {
    id: BookFilter;
    label: string;
    count: number;
    icon?: React.ReactNode;
  }[] = [
    { id: 'all', label: 'Tất cả', count: counts.total },
    { id: 'book1', label: 'Quyển 1', count: counts.book1 },
    { id: 'book2', label: 'Quyển 2', count: counts.book2 },
    { id: 'custom', label: 'Tự thêm', count: counts.custom },
    {
      id: 'bookmarked',
      label: 'Đã lưu',
      count: counts.bookmarked,
      icon: (
        <Star
          className={`w-3.5 h-3.5 ${
            activeTab === 'bookmarked' ? 'fill-amber-400 text-amber-500' : 'text-amber-500'
          }`}
        />
      ),
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/70 sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Segmented Source Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      isActive ? 'text-red-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Lesson, JLPT, Reset, View Mode */}
          <div className="flex items-center gap-2 ml-auto">
            {availableLessons.length > 0 && (
              <select
                value={selectedLesson}
                onChange={(e) =>
                  onLessonChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                aria-label="Lọc theo bài học"
                className={`text-xs rounded-lg px-2.5 py-1.5 border outline-none transition-colors cursor-pointer ${
                  selectedLesson !== 'all'
                    ? 'bg-red-50/70 border-red-200 text-red-700 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700 font-medium'
                }`}
              >
                <option value="all">Tất cả bài</option>
                {availableLessons.map((l) => (
                  <option key={l} value={l}>
                    Bài {l}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedJlpt}
              onChange={(e) => onJlptChange(e.target.value)}
              aria-label="Lọc theo cấp độ JLPT"
              className={`text-xs rounded-lg px-2.5 py-1.5 border outline-none transition-colors cursor-pointer ${
                selectedJlpt !== 'all'
                  ? 'bg-red-50/70 border-red-200 text-red-700 font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700 font-medium'
              }`}
            >
              <option value="all">Mọi JLPT</option>
              <option value="N5">JLPT N5</option>
              <option value="N4">JLPT N4</option>
              <option value="N3">JLPT N3</option>
              <option value="N2">JLPT N2</option>
              <option value="N1">JLPT N1</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa bộ lọc đang chọn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đặt lại</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Chế độ lưới"
                aria-label="Chế độ lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('compact')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'compact'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Chế độ danh sách"
                aria-label="Chế độ danh sách"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
