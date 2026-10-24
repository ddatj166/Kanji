'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { X, Volume2, Check, Shuffle, Sparkles } from 'lucide-react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [cards, setCards] = useState<KanjiEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);

  // Open/close native <dialog> and bind light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && kanjiList.length > 0 && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    const handleLightDismissFallback = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      dialog.close();
    };

    dialog.addEventListener('click', handleLightDismissFallback);
    return () => {
      dialog.removeEventListener('click', handleLightDismissFallback);
    };
  }, [isOpen, kanjiList.length]);

  useEffect(() => {
    if (isOpen && kanjiList.length > 0) {
      setCards([...kanjiList]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setRememberedCount(0);
    }
  }, [isOpen, kanjiList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext(true);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
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
    if (currentIndex >= cards.length) return;
    if (remembered) {
      setRememberedCount((prev) => prev + 1);
    }
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const isCompleted = currentIndex >= cards.length;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto p-0 w-[calc(100%-1.5rem)] max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm outline-none"
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 id={titleId} className="text-sm font-bold text-slate-800">
              Flashcard
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {Math.min(currentIndex + 1, cards.length)} / {cards.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShuffle}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Xáo trộn thẻ"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thin Progress Bar */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${(currentIndex / cards.length) * 100}%` }}
          />
        </div>

        {/* Card Content Area */}
        <div className="p-5 sm:p-6">
          {!isCompleted ? (
            <div className="space-y-4">
              {/* Fixed-Height Flashcard Box */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative w-full h-[350px] bg-slate-50/60 hover:bg-slate-50 border border-slate-200/90 hover:border-red-300 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center justify-between select-none"
              >
                {!isFlipped ? (
                  /* FRONT FACE */
                  <>
                    <div className="w-full flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {current.book === 1 ? 'Q1' : current.book === 2 ? 'Q2' : 'Tự thêm'} • Bài {current.lesson}
                      </span>
                      <span>
                        {current.strokes} nét {current.jlpt ? `• ${current.jlpt}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-center my-auto">
                      <span className="text-8xl sm:text-9xl font-bold font-serif text-slate-900 leading-none">
                        {current.kanji}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Chạm hoặc nhấn <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Space</kbd> để lật
                    </span>
                  </>
                ) : (
                  /* BACK FACE: Look & Learn Illustration + Han Viet + Story */
                  <div className="flex flex-col items-center justify-between text-center w-full h-full">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-2xl font-bold font-serif text-slate-800">
                        {current.kanji}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakJapanese(current.kanji);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {current.mnemonic.image_url && (
                      <div className="w-32 h-32 rounded-xl bg-white p-1.5 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={current.mnemonic.image_url}
                          alt={current.kanji}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}

                    <div>
                      <h4 className="text-xl font-bold text-red-700 tracking-wide uppercase">
                        {current.han_viet}
                      </h4>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">
                        {current.meaning_vi}
                      </p>
                    </div>

                    {current.mnemonic.story ? (
                      <p className="text-xs text-amber-950 bg-amber-50/90 border border-amber-200/60 px-3 py-2 rounded-xl w-full line-clamp-3">
                        💡 {current.mnemonic.story}
                      </p>
                    ) : (
                      <div />
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleNext(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
                >
                  Chưa thuộc (←)
                </button>
                <button
                  type="button"
                  onClick={() => handleNext(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                >
                  Đã nhớ (→)
                </button>
              </div>
            </div>
          ) : (
            /* Completed Screen */
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Hoàn thành phiên ôn tập!</h4>
              <p className="text-xs text-slate-500">
                Đã nhớ <b>{rememberedCount}</b> / {cards.length} chữ Kanji.
              </p>
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setRememberedCount(0);
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Ôn tập lại
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
