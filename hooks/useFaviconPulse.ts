'use client';

import { useEffect, useRef } from 'react';

/**
 * Animates the browser-tab favicon and title while a webcall is active.
 * - Draws the static favicon onto a canvas each frame.
 * - Adds two staggered expanding green rings (sonar effect) around it.
 * - Overlays a small pulsing green dot in the bottom-right corner.
 * - Alternates the tab title between the original and "🟢 Live Call · Knoxified".
 * Restores everything when the call ends.
 */
export function useFaviconPulse(active: boolean) {
  const rafRef  = useRef<number | null>(null);
  const imgRef  = useRef<HTMLImageElement | null>(null);
  const origHref  = useRef<string>('/favicon.png');
  const origTitle = useRef<string>('');

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      // Restore favicon
      const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      if (link) link.href = origHref.current;

      // Restore title
      if (origTitle.current) document.title = origTitle.current;
      return;
    }

    // Save originals once
    origTitle.current = document.title;
    const existingLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (existingLink?.href) origHref.current = existingLink.href;

    // Preload the favicon image
    if (!imgRef.current) {
      const img = new Image();
      img.src = '/favicon.png';
      imgRef.current = img;
    }

    const canvas = document.createElement('canvas');
    canvas.width  = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const RING_CYCLE  = 1600; // ms per ring expansion
    const RING_OFFSET = 800;  // stagger between the two rings
    const start = performance.now();

    let lastTitleFlip = start;
    let titleIsLive   = false;

    function frame(now: number) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, 32, 32);

      // Base favicon
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.drawImage(imgRef.current, 0, 0, 32, 32);
      }

      // Two sonar rings
      for (let r = 0; r < 2; r++) {
        const t = ((elapsed + r * RING_OFFSET) % RING_CYCLE) / RING_CYCLE; // 0 → 1
        const radius  = 14 + t * 10;      // 14 → 24 px
        const opacity = (1 - t) * 0.75;
        ctx.beginPath();
        ctx.arc(16, 16, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      // Corner live-dot (bottom-right, breathing)
      const dotPulse = 0.65 + Math.sin(elapsed / 280) * 0.35;
      ctx.beginPath();
      ctx.arc(26, 26, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16, 185, 129, ${dotPulse})`;
      ctx.fill();

      // Update <link rel="icon">
      let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = canvas.toDataURL('image/png');

      // Flip title every 2.5 s
      if (now - lastTitleFlip > 2500) {
        titleIsLive    = !titleIsLive;
        lastTitleFlip  = now;
        document.title = titleIsLive
          ? '🟢 Live Call · Knoxified'
          : origTitle.current;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      if (link) link.href = origHref.current;
      document.title = origTitle.current;
    };
  }, [active]);
}
