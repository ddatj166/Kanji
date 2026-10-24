'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { KanjiCard } from '@/components/KanjiCard';
import { KanjiModal } from '@/components/KanjiModal';
import { AddKanjiModal } from '@/components/AddKanjiModal';
import { FlashcardModal } from '@/components/FlashcardModal';
import { KanjiEntry, BookFilter } from '@/types/kanji';
import { Loader2, SearchX, Undo2, X } from 'lucide-react';

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
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: { text: string; item?: KanjiEntry }, durationMs = 3500) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, durationMs);
  };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookFilter>('all');
  const [selectedLesson, setSelectedLesson] = useState<number | 'all'>('all');
  const [selectedJlpt, setSelectedJlpt] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [displayCount, setDisplayCount] = useState(50);

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
    showToast({
      text: `Đã cập nhật chữ 「${updated.kanji}」`,
    });
  };

  // Reset modified book Kanji back to original
  const handleResetKanji = async (target: KanjiEntry) => {
    try {
      const res = await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_to_original', id: target.id }),
      });
      if (!res.ok) throw new Error('Reset failed');
      const data = await res.json();
      if (data.item) {
        setAllKanji((prev) => prev.map((k) => (k.id === target.id ? data.item : k)));
        setActiveKanji(data.item);
        showToast({
          text: `Đã khôi phục chữ 「${data.item.kanji}」 về bản gốc`,
        });
      }
    } catch (err) {
      console.error('Reset error:', err);
      showToast({
        text: `Lỗi khi khôi phục chữ 「${target.kanji}」`,
      });
    }
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
    showToast({
      text: `Đã thêm chữ 「${newKanji.kanji}」 vào từ điển`,
    });
  };

  // Delete Kanji (Custom Kanji)
  const handleDeleteKanji = async (target: KanjiEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const prevList = allKanji;
    setAllKanji((prev) => prev.filter((k) => k.id !== target.id));
    if (activeKanji?.id === target.id) {
      setActiveKanji(null);
    }

    setRecentlyDeleted((prev) => [target, ...prev]);
    showToast(
      {
        text: `Đã xóa chữ 「${target.kanji}」`,
        item: target,
      },
      6000
    );

    try {
      const res = await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: target.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      console.error('Delete error:', err);
      setAllKanji(prevList);
      setRecentlyDeleted((prev) => prev.filter((k) => k.id !== target.id));
      showToast({
        text: `Không thể xóa chữ 「${target.kanji}」. Vui lòng thử lại.`,
      });
    }
  };

  // Undo Delete
  const handleUndoDelete = async () => {
    if (recentlyDeleted.length === 0) return;

    const itemToRestore = recentlyDeleted[0];
    const remaining = recentlyDeleted.slice(1);
    setRecentlyDeleted(remaining);

    setAllKanji((prev) => [itemToRestore, ...prev]);
    showToast({
      text: `Đã khôi phục chữ 「${itemToRestore.kanji}」`,
    });

    try {
      const res = await fetch('/api/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', kanji: itemToRestore }),
      });
      if (!res.ok) throw new Error('Restore failed');
    } catch (err) {
      console.error('Restore error:', err);
      showToast({
        text: `Lỗi khi khôi phục chữ 「${itemToRestore.kanji}」`,
      });
    }
  };

  // Reset lesson filter when switching book
  const handleTabChange = (tab: BookFilter) => {
    setActiveTab(tab);
    setSelectedLesson('all');
    setDisplayCount(50);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLesson('all');
    setSelectedJlpt('all');
    setDisplayCount(50);
  };

  const handleResetAll = () => {
    setActiveTab('all');
    handleResetFilters();
  };

  // Available lessons based on active tab
  const availableLessons = useMemo(() => {
    let target = allKanji;
    if (activeTab === 'book1') target = allKanji.filter((k) => k.book === 1);
    else if (activeTab === 'book2') target = allKanji.filter((k) => k.book === 2);
    else if (activeTab === 'custom') target = allKanji.filter((k) => k.book === 3);

    return Array.from(new Set(target.map((k) => k.lesson))).sort((a, b) => a - b);
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

    const query = searchQuery.trim();
    if (query) {
      const qNormalized = removeVietnameseTones(query);
      const isNum = /^#?\d+$/.test(query);

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

    if (activeTab === 'book1') {
      result = result.filter((k) => k.book === 1);
    } else if (activeTab === 'book2') {
      result = result.filter((k) => k.book === 2);
    } else if (activeTab === 'custom') {
      result = result.filter((k) => k.book === 3);
    } else if (activeTab === 'bookmarked') {
      result = result.filter((k) => bookmarkedIds.has(k.id));
    }

    if (selectedLesson !== 'all') {
      result = result.filter((k) => k.lesson === selectedLesson);
    }

    if (selectedJlpt !== 'all') {
      result = result.filter((k) => k.jlpt === selectedJlpt);
    }

    return result;
  }, [allKanji, searchQuery, activeTab, selectedLesson, selectedJlpt, bookmarkedIds, fuse]);

  const displayedItems = useMemo(() => {
    return filteredKanji.slice(0, displayCount);
  }, [filteredKanji, displayCount]);

  // Active Kanji Index for Prev/Next navigation inside KanjiModal
  const activeKanjiIndex = useMemo(() => {
    if (!activeKanji) return -1;
    return filteredKanji.findIndex((k) => k.id === activeKanji.id);
  }, [activeKanji, filteredKanji]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedLesson !== 'all' || selectedJlpt !== 'all';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800">
      {/* Unified Header with Centered Search */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setDisplayCount(50);
        }}
        onResetAll={handleResetAll}
        onOpenAddModal={() => {
          setEditingKanji(null);
          setIsAddModalOpen(true);
        }}
        onOpenFlashcards={() => setIsFlashcardOpen(true)}
        filteredCount={filteredKanji.length}
      />

      {/* Single-Row Segmented Toolbar */}
      <FilterBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedLesson={selectedLesson}
        onLessonChange={(l) => {
          setSelectedLesson(l);
          setDisplayCount(50);
        }}
        selectedJlpt={selectedJlpt}
        onJlptChange={(j) => {
          setSelectedJlpt(j);
          setDisplayCount(50);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        counts={counts}
        availableLessons={availableLessons}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-7 h-7 text-red-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Đang tải dữ liệu Kanji...</p>
          </div>
        ) : filteredKanji.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Không tìm thấy chữ Kanji phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Thử đổi từ khóa tìm kiếm, đặt lại bộ lọc, hoặc bấm nút <b>+ Thêm từ</b> để bổ sung chữ mới.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show subtle filter count ONLY when actively searching or filtering */}
            {hasActiveFilters && (
              <div className="text-xs text-slate-500">
                Tìm thấy <b>{filteredKanji.length}</b> chữ Kanji phù hợp
              </div>
            )}

            {/* Grid or Compact List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-3.5">
                {displayedItems.map((kanji) => (
                  <KanjiCard
                    key={kanji.id}
                    kanji={kanji}
                    isBookmarked={bookmarkedIds.has(kanji.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onClick={() => setActiveKanji(kanji)}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayedItems.map((kanji) => (
                  <KanjiCard
                    key={kanji.id}
                    kanji={kanji}
                    isBookmarked={bookmarkedIds.has(kanji.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onClick={() => setActiveKanji(kanji)}
                    viewMode="compact"
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {displayCount < filteredKanji.length && (
              <div className="flex justify-center pt-5 pb-10">
                <button
                  type="button"
                  onClick={() => setDisplayCount((prev) => prev + 50)}
                  className="px-5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-xl shadow-sm transition-all"
                >
                  Xem thêm ({filteredKanji.length - displayCount} chữ)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Toast Notification with Undo Button */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700/80">
          <span className="text-xs font-medium">{toastMessage.text}</span>
          {toastMessage.item && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Hoàn tác</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-0.5 text-slate-400 hover:text-white rounded-lg"
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
        onResetKanji={handleResetKanji}
        onEditKanji={handleOpenEditModal}
        hasPrev={activeKanjiIndex > 0}
        hasNext={activeKanjiIndex >= 0 && activeKanjiIndex < filteredKanji.length - 1}
        onPrev={() => {
          if (activeKanjiIndex > 0) {
            setActiveKanji(filteredKanji[activeKanjiIndex - 1]);
          }
        }}
        onNext={() => {
          if (activeKanjiIndex >= 0 && activeKanjiIndex < filteredKanji.length - 1) {
            setActiveKanji(filteredKanji[activeKanjiIndex + 1]);
          }
        }}
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
