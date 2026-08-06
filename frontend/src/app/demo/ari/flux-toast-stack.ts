import { useRef, useState, useMemo, useEffect, useCallback, createElement } from 'react';
import type { CSSProperties, PointerEventHandler, ReactNode } from 'react';

type CSSVars = Record<string, string | number | undefined> & CSSProperties;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduced(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

export interface FluxToast {
  id: string;
  title: string;
  message: string;
  time?: string;
  variant?: 'info' | 'success' | 'warning';
}

const defaultItems: FluxToast[] = [
  {
    id: 'orbit-synced',
    title: 'Orbit synced',
    message: 'Telemetry stream is now live across your workspace.',
    time: 'Just now',
    variant: 'info',
  },
  {
    id: 'snapshot-ready',
    title: 'Snapshot ready',
    message: 'Your weekly launch snapshot finished rendering.',
    time: '2m ago',
    variant: 'success',
  },
  {
    id: 'billing-alert',
    title: 'Billing alert',
    message: 'Usage hit 92% of the current plan threshold.',
    time: '10m ago',
    variant: 'warning',
  },
  {
    id: 'handoff-complete',
    title: 'Handoff complete',
    message: 'The new release bundle is ready for review.',
    time: '1h ago',
    variant: 'info',
  },
];

interface FluxToastStackProps {
  items?: FluxToast[];
  onDismiss?: (id: string) => void;
  colors?: string[];
  intensity?: number;
  tilt?: number;
  parallax?: number;
  stackGap?: number;
  expandedGap?: number;
  stackDepth?: number;
  minHeight?: number | string;
  className?: string;
}

type ToastState = FluxToast & { status: 'open' | 'closing' };

const h = createElement;

export function FluxToastStack({
  items = defaultItems,
  onDismiss,
  colors = ['#020617', '#38bdf8', '#a855f7'],
  intensity = 0.9,
  tilt = 1,
  parallax = 1,
  stackGap = 18,
  expandedGap = 32,
  stackDepth = 28,
  minHeight = 420,
  className,
}: FluxToastStackProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const resolvedItems = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) return items;
    return defaultItems;
  }, [items]);

  const [toastItems, setToastItems] = useState<ToastState[]>(() =>
    resolvedItems.map((item) => ({ ...item, status: 'open' }))
  );

  useEffect(() => {
    setToastItems(resolvedItems.map((item) => ({ ...item, status: 'open' })));
  }, [resolvedItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const palette = useMemo(() => {
    const base = colors[0] || '#020617';
    const accent = colors[1] || '#38bdf8';
    const highlight = colors[2] || colors[1] || '#a855f7';
    return { base, accent, highlight };
  }, [colors]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const nx = x - 0.5;
      const ny = y - 0.5;

      const baseTilt = Number.isFinite(tilt) ? tilt : 1;
      const baseParallax = Number.isFinite(parallax) ? parallax : 1;
      const tiltStrength = prefersReducedMotion ? baseTilt * 0.5 : baseTilt;
      const parallaxStrength = prefersReducedMotion ? baseParallax * 0.55 : baseParallax;

      const rotateX = ny * -10 * tiltStrength;
      const rotateY = nx * 12 * tiltStrength;
      const shiftX = nx * 14 * parallaxStrength;
      const shiftY = ny * 10 * parallaxStrength;

      root.style.setProperty('--fts-tilt-x', `${rotateX}deg`);
      root.style.setProperty('--fts-tilt-y', `${rotateY}deg`);
      root.style.setProperty('--fts-shift-x', `${shiftX}px`);
      root.style.setProperty('--fts-shift-y', `${shiftY}px`);
      root.style.setProperty('--fts-glow-x', `${x * 100}%`);
      root.style.setProperty('--fts-glow-y', `${y * 100}%`);
    },
    [tilt, parallax, prefersReducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--fts-tilt-x', '0deg');
    root.style.setProperty('--fts-tilt-y', '0deg');
    root.style.setProperty('--fts-shift-x', '0px');
    root.style.setProperty('--fts-shift-y', '0px');
    root.style.setProperty('--fts-glow-x', '50%');
    root.style.setProperty('--fts-glow-y', '50%');
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      const closeDuration = prefersReducedMotion ? 180 : 420;
      setToastItems((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, status: 'closing' } : toast))
      );

      window.setTimeout(() => {
        setToastItems((prev) => prev.filter((toast) => toast.id !== id));
        if (onDismiss) {
          onDismiss(id);
        }
      }, closeDuration);
    },
    [onDismiss, prefersReducedMotion]
  );

  const safeIntensity = Number.isFinite(intensity) ? intensity : 0.9;
  const adjustedIntensity = prefersReducedMotion ? safeIntensity * 0.75 : safeIntensity;
  const safeGap = Number.isFinite(stackGap) ? stackGap : 18;
  const safeExpandedGap = Number.isFinite(expandedGap) ? expandedGap : 32;
  const safeDepth = Number.isFinite(stackDepth) ? stackDepth : 28;
  const toastCount = Math.max(toastItems.length, 1);
  const activeGap = isExpanded ? safeExpandedGap : safeGap;
  const maxGap = Math.max(safeGap, safeExpandedGap);
  const stackHeight = 140 + (toastCount - 1) * maxGap;
  const scaleStep = isExpanded ? 0.02 : 0.04;
  const opacityStep = isExpanded ? 0.08 : 0.16;

  const rootStyle: CSSVars = {
    '--fts-min-height': typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    '--fts-color-base': palette.base,
    '--fts-color-accent': palette.accent,
    '--fts-color-highlight': palette.highlight,
    '--fts-intensity': adjustedIntensity,
    '--fts-stack-height': `${stackHeight}px`,
  };

  const toasts: ReactNode[] = toastItems.map((toast, index) => {
    const isActive = index === 0;
    const offset = index * activeGap;
    const depth = index * safeDepth * -1;
    const scale = 1 - index * scaleStep;
    const opacity = 1 - index * opacityStep;
    const style: CSSVars = {
      '--fts-offset': `${offset}px`,
      '--fts-offset-enter': `${offset + 22}px`,
      '--fts-depth-offset': `${depth}px`,
      '--fts-scale': scale,
      '--fts-opacity': opacity,
      animationDelay: `${index * 70}ms`,
    };

    return h(
      'article',
      {
        key: toast.id,
        className: toast.status === 'closing' ? 'fts-toast fts-toastClosing' : 'fts-toast',
        'data-variant': toast.variant || 'info',
        'data-active': isActive ? 'true' : 'false',
        style,
      },
      h('span', { className: 'fts-toastGlow', 'aria-hidden': 'true' }),
      h('span', { className: 'fts-toastParticle', 'aria-hidden': 'true' }),
      h(
        'div',
        { className: 'fts-toastBody' },
        h(
          'div',
          { className: 'fts-toastHeader' },
          h('span', { className: 'fts-toastTitle' }, toast.title),
          h('span', { className: 'fts-toastTime' }, toast.time || '')
        ),
        h('p', { className: 'fts-toastMessage' }, toast.message)
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'fts-toastClose',
          onClick: () => handleDismiss(toast.id),
          'aria-label': 'Dismiss notification',
        },
        h('span', { 'aria-hidden': 'true' }, 'x')
      )
    );
  });

  const handleSectionLeave = useCallback(() => {
    handlePointerLeave();
    setIsExpanded(false);
  }, [handlePointerLeave]);

  return h(
    'section',
    {
      ref: rootRef,
      className: className || 'fts-root',
      style: rootStyle,
      'data-expanded': isExpanded ? 'true' : 'false',
      'data-ready': isReady ? 'true' : 'false',
      onPointerMove: handlePointerMove as unknown as PointerEventHandler<HTMLElement>,
      onPointerLeave: handleSectionLeave,
      onPointerEnter: () => setIsExpanded(true),
      'aria-label': 'Flux toast stack',
    },
    h(
      'div',
      { className: 'fts-stack', 'aria-live': 'polite' },
      h('div', { className: 'fts-stackInner' }, toasts)
    )
  );
}

export default FluxToastStack;
