'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { KanjiCard } from '@/components/KanjiCard';
import { KanjiModal } from '@/components/KanjiModal';
import { AddKanjiModal } from '@/components/AddKanjiModal';
import { FlashcardModal } from '@/components/FlashcardModal';
import { KanjiEntry, BookFilter } from '@/types/kanji';
import { Loader2, SearchX, Undo2, X, Check } from 'lucide-react';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function HomePage() {
  const [allKanji, setAllKanji] = useState<KanjiEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Undo / Delete history
  const [recentlyDeleted, setRecentlyDeleted] = useState<KanjiEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    item?: KanjiEntry;
  } | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookFilter>('all');
  const [selectedLesson, setSelectedLesson] = useState<number | 'all'>('all');
  const [selectedJlpt, setSelectedJlpt] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [displayCount, setDisplayCount] = useState(48);

  // Modals
  const [activeKanji, setActiveKanji] = useState<KanjiEntry | null>(null);
  const [editingKanji, setEditingKanji] = useState<KanjiEntry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kanji_bookmarks');
      if (saved) {
        setBookmarkedIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kanji');
      if (res.ok) {
        const json = await res.json();
        setAllKanji(json.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle bookmark
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('kanji_bookmarks', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Update existing Kanji
  const handleUpdateKanji = (updated: KanjiEntry) => {
    setAllKanji((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    setActiveKanji(updated);
    setToastMessage({
      text: `Đã cập nhật chữ 「${updated.kanji}」 thành công!`,
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open edit modal
  const handleOpenEditModal = (kanji: KanjiEntry) => {
    setActiveKanji(null);
    setEditingKanji(kanji);
    setIsAddModalOpen(true);
  };

  // Handle adding a new Kanji
  const handleKanjiAdded = (newKanji: KanjiEntry) => {
    setAllKanji((prev) => [newKanji, ...prev]);
    setActiveKanji(newKanji);
    setToastMessage({
      text: `Đã thêm chữ 「${newKanji.kanji}」 vào từ điển!`,
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Delete Kanji
  const handleDeleteKanji = async (target: KanjiEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Remove from UI immediately
    setAllKanji((prev) => prev.filter((k) => k.id !== target.id));
    if (activeKanji?.id === target.id) {
      setActiveKanji(null);
    }

    // Add to undo stack
    setRecentlyDeleted((prev) => [target, ...prev]);
    setToastMessage({
      text: `Đã xóa chữ 「${target.kanji}」 (${target.han_viet || ''})`,
      item: target,
    });

    // Call API to remove from data/custom_kanji.json
    try {
      await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: target.id }),
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Undo Delete
  const handleUndoDelete = async () => {
    if (recentlyDeleted.length === 0) return;

    const itemToRestore = recentlyDeleted[0];
    const remaining = recentlyDeleted.slice(1);
    setRecentlyDeleted(remaining);

    // Add back to UI
    setAllKanji((prev) => [itemToRestore, ...prev]);
    setToastMessage({
      text: `Đã khôi phục chữ 「${itemToRestore.kanji}」 thành công!`,
    });
    setTimeout(() => setToastMessage(null), 3000);

    // Call API to restore in data/custom_kanji.json
    try {
      await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', kanji: itemToRestore }),
      });
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  // Reset lesson filter when switching book
  const handleTabChange = (tab: BookFilter) => {
    setActiveTab(tab);
    setSelectedLesson('all');
    setDisplayCount(48);
  };

  // Available lessons based on active tab
  const availableLessons = useMemo(() => {
    let target = allKanji;
    if (activeTab === 'book1') target = allKanji.filter((k) => k.book === 1);
    else if (activeTab === 'book2') target = allKanji.filter((k) => k.book === 2);
    else if (activeTab === 'custom') target = allKanji.filter((k) => k.book === 3);

    const lessons = Array.from(new Set(target.map((k) => k.lesson))).sort((a, b) => a - b);
    return lessons;
  }, [allKanji, activeTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: allKanji.length,
      book1: allKanji.filter((k) => k.book === 1).length,
      book2: allKanji.filter((k) => k.book === 2).length,
      custom: allKanji.filter((k) => k.book === 3).length,
      bookmarked: bookmarkedIds.size,
    };
  }, [allKanji, bookmarkedIds]);

  // Fuzzy Search Index
  const fuse = useMemo(() => {
    return new Fuse(allKanji, {
      keys: [
        { name: 'kanji', weight: 3 },
        { name: 'han_viet', weight: 2.5 },
        { name: 'meaning_vi', weight: 2 },
        { name: 'onyomi', weight: 1.5 },
        { name: 'kunyomi', weight: 1.5 },
        { name: 'examples.word', weight: 1.5 },
        { name: 'examples.reading', weight: 1.2 },
        { name: 'examples.meaning', weight: 1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [allKanji]);

  // Filtered List
  const filteredKanji = useMemo(() => {
    let result = allKanji;

    // 1. Search Query
    const query = searchQuery.trim();
    if (query) {
      const qNormalized = removeVietnameseTones(query);
      const isNum = !isNaN(Number(query.replace('#', '')));

      // Direct exact match filter first
      const directMatches = allKanji.filter((k) => {
        if (isNum && k.number === Number(query.replace('#', ''))) return true;
        if (k.kanji === query) return true;
        if (k.han_viet && removeVietnameseTones(k.han_viet).includes(qNormalized)) return true;
        if (k.meaning_vi && removeVietnameseTones(k.meaning_vi).includes(qNormalized)) return true;
        if (k.kunyomi?.some((y) => removeVietnameseTones(y).includes(qNormalized))) return true;
        if (k.onyomi?.some((y) => removeVietnameseTones(y).includes(qNormalized))) return true;
        return false;
      });

      if (directMatches.length > 0) {
        result = directMatches;
      } else {
        const fuseResults = fuse.search(query);
        result = fuseResults.map((r) => r.item);
      }
    }

    // 2. Book Tab Filter
    if (activeTab === 'book1') {
      result = result.filter((k) => k.book === 1);
    } else if (activeTab === 'book2') {
      result = result.filter((k) => k.book === 2);
    } else if (activeTab === 'custom') {
      result = result.filter((k) => k.book === 3);
    } else if (activeTab === 'bookmarked') {
      result = result.filter((k) => bookmarkedIds.has(k.id));
    }

    // 3. Lesson Filter
    if (selectedLesson !== 'all') {
      result = result.filter((k) => k.lesson === selectedLesson);
    }

    // 4. JLPT Filter
    if (selectedJlpt !== 'all') {
      result = result.filter((k) => k.jlpt === selectedJlpt);
    }

    return result;
  }, [allKanji, searchQuery, activeTab, selectedLesson, selectedJlpt, bookmarkedIds, fuse]);

  // Display items
  const displayedItems = useMemo(() => {
    return filteredKanji.slice(0, displayCount);
  }, [filteredKanji, displayCount]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddModal={() => {
          setEditingKanji(null);
          setIsAddModalOpen(true);
        }}
        onOpenFlashcards={() => setIsFlashcardOpen(true)}
        counts={counts}
      />

      {/* Filter & Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setDisplayCount(48);
        }}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedLesson={selectedLesson}
        onLessonChange={(l) => {
          setSelectedLesson(l);
          setDisplayCount(48);
        }}
        selectedJlpt={selectedJlpt}
        onJlptChange={(j) => {
          setSelectedJlpt(j);
          setDisplayCount(48);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        counts={counts}
        availableLessons={availableLessons}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Đang nạp từ điển Kanji...</p>
          </div>
        ) : filteredKanji.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <SearchX className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy chữ Kanji nào</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Thử tìm kiếm với từ khóa khác, hoặc bấm nút "+ Thêm từ" ở góc phải để bổ sung chữ mới vào từ điển!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results count text */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Hiển thị <b>{Math.min(displayCount, filteredKanji.length)}</b> trong số <b>{filteredKanji.length}</b> kết quả
              </span>
              {recentlyDeleted.length > 0 && (
                <button
                  onClick={handleUndoDelete}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Hoàn tác chữ vừa xóa ({recentlyDeleted.length})</span>
                </button>
              )}
            </div>

            {/* Grid or Compact List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                {displayedItems.map((kanji) => (
                  <KanjiCard
                    key={kanji.id}
                    kanji={kanji}
                    isBookmarked={bookmarkedIds.has(kanji.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onDeleteKanji={handleDeleteKanji}
                    onEditKanji={handleOpenEditModal}
                    onClick={() => setActiveKanji(kanji)}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedItems.map((kanji) => (
                  <KanjiCard
                    key={kanji.id}
                    kanji={kanji}
                    isBookmarked={bookmarkedIds.has(kanji.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onDeleteKanji={handleDeleteKanji}
                    onEditKanji={handleOpenEditModal}
                    onClick={() => setActiveKanji(kanji)}
                    viewMode="compact"
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {displayCount < filteredKanji.length && (
              <div className="flex justify-center pt-6 pb-12">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 48)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm transition-all"
                >
                  Xem thêm ({filteredKanji.length - displayCount} chữ còn lại)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Toast Notification with Undo Button */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <span className="text-xs font-medium">{toastMessage.text}</span>
          {toastMessage.item && (
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Hoàn tác</span>
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Kanji Detail Modal */}
      <KanjiModal
        kanji={activeKanji}
        onClose={() => setActiveKanji(null)}
        isBookmarked={activeKanji ? bookmarkedIds.has(activeKanji.id) : false}
        onToggleBookmark={(id) => handleToggleBookmark(id)}
        onUpdateKanji={handleUpdateKanji}
        onDeleteKanji={handleDeleteKanji}
        onEditKanji={handleOpenEditModal}
      />

      {/* Add / Edit Custom Kanji Modal */}
      <AddKanjiModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingKanji(null);
        }}
        initialKanji={editingKanji}
        onKanjiAdded={handleKanjiAdded}
        onKanjiUpdated={handleUpdateKanji}
      />

      {/* Flashcard Practice Modal */}
      <FlashcardModal
        isOpen={isFlashcardOpen}
        onClose={() => setIsFlashcardOpen(false)}
        kanjiList={filteredKanji}
      />
    </div>
  );
}
