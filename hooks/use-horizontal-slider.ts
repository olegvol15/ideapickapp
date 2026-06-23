'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// UI/DOM orchestration for a horizontal snap-scroll slider: tracks scroll
// position to drive prev/next controls and scrolls one card at a time.
export function useHorizontalSlider(itemCount: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setHasOverflow(maxScrollLeft > 1);
    setCanScrollBack(track.scrollLeft > 1);
    setCanScrollForward(track.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    update();
    const observer = new ResizeObserver(update);
    observer.observe(track);

    return () => observer.disconnect();
  }, [itemCount, update]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (firstCard.offsetWidth + gap),
      behavior: 'smooth',
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      scrollByCard(event.key === 'ArrowLeft' ? -1 : 1);
    },
    [scrollByCard]
  );

  return {
    trackRef,
    canScrollBack,
    canScrollForward,
    hasOverflow,
    scrollByCard,
    handleKeyDown,
    update,
  };
}
