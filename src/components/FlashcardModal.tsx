'use client';

import React, { useState, useEffect } from 'react';
import { X, RotateCw, Volume2, Check, ArrowRight, Shuffle, Sparkles, Lightbulb } from 'lucide-react';
import { KanjiEntry } from '@/types/kanji';
import { speakJapanese } from '@/lib/speech';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  kanjiList: KanjiEntry[];
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  kanjiList,
}) => {
  const [cards, setCards] = useState<KanjiEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);

  useEffect(() => {
    if (isOpen && kanjiList.length > 0) {
      setCards([...kanjiList]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setRememberedCount(0);
    }
  }, [isOpen, kanjiList]);

  // Spacebar to flip card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext(true);
      } else if (e.code === 'ArrowLeft') {
        handleNext(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, cards]);

  if (!isOpen || cards.length === 0) return null;

  const current = cards[currentIndex];

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNext = (remembered: boolean) => {
    if (remembered) {
      setRememberedCount((prev) => prev + 1);
    }
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all
      setCurrentIndex(cards.length);
    }
  };

  const isCompleted = currentIndex >= cards.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Luyện tập Flashcard</h3>
            <span className="text-xs text-slate-400 font-mono">
              ({Math.min(currentIndex + 1, cards.length)}/{cards.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Xáo trộn thẻ"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>

        {/* Card Content Area */}
        <div className="p-6">
          {!isCompleted ? (
            <div className="space-y-6">
              {/* Flashcard Box */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative w-full min-h-[340px] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl p-6 cursor-pointer shadow-md hover:border-red-300 transition-all flex flex-col items-center justify-center select-none"
              >
                {!isFlipped ? (
                  /* FRONT FACE: Big Kanji */
                  <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {current.book === 1 ? 'Quyển 1' : current.book === 2 ? 'Quyển 2' : 'Tự thêm'} • Bài {current.lesson}
                    </span>
                    <span className="text-9xl font-bold font-serif text-slate-900 leading-none">
                      {current.kanji}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <span>{current.strokes} nét</span>
                      {current.jlpt && <span>• {current.jlpt}</span>}
                    </div>
                    <span className="text-xs text-slate-400 font-medium pt-2">
                      (Bấm vào thẻ hoặc phím Space để lật)
                    </span>
                  </div>
                ) : (
                  /* BACK FACE: Look & Learn Illustration + Story + Han Viet */
                  <div className="flex flex-col items-center text-center space-y-3 w-full animate-in fade-in">
                    {/* Illustration Image */}
                    {current.mnemonic.image_url && (
                      <div className="w-28 h-28 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={current.mnemonic.image_url}
                          alt={current.kanji}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <h4 className="text-2xl font-bold text-red-700 tracking-wider uppercase">
                          {current.han_viet}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakJapanese(current.kanji);
                          }}
                          className="p-1 text-slate-400 hover:text-red-700"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {current.meaning_vi}
                      </p>
                    </div>

                    {/* Mnemonic Story */}
                    {current.mnemonic.story && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-left w-full text-xs text-amber-950 font-medium">
                        💡 {current.mnemonic.story}
                      </div>
                    )}

                    {/* First 2 examples */}
                    {current.examples && current.examples.length > 0 && (
                      <div className="text-left w-full pt-1 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ví dụ:</span>
                        {current.examples.slice(0, 2).map((ex, i) => (
                          <div key={i} className="text-xs text-slate-700 flex justify-between bg-slate-100/60 p-1.5 rounded-lg">
                            <span className="font-bold">{ex.word} ({ex.reading})</span>
                            <span className="text-slate-600">{ex.meaning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNext(false)}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Chưa thuộc (←)
                </button>
                <button
                  onClick={() => handleNext(true)}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
                >
                  Đã nhớ (→)
                </button>
              </div>
            </div>
          ) : (
            /* Completed Screen */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Hoàn thành bài ôn tập!</h4>
              <p className="text-sm text-slate-500">
                Bạn đã ghi nhớ được <b>{rememberedCount}</b> / {cards.length} chữ Kanji.
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setRememberedCount(0);
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Luyện tập lại
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
