'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export function LuxuryReveal({
  children,
  className = '',
  delayMs = 0,
  variant = 'up',
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: 'up' | 'scale';
  as?: 'div' | 'section' | 'article';
}) {
  const [visible, setVisible] = useState(false);
  const revealRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = revealRef.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      {
        rootMargin: '0px',
        threshold: 0.04,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const Tag = as;
  const classes = [
    'luxury-reveal',
    variant === 'scale' ? 'luxury-scale' : '',
    visible ? 'is-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={revealRef}
      className={classes}
      style={{ transitionDelay: delayMs ? `${delayMs}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
