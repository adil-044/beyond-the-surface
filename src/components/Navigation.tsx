import { useEffect, useState, useRef } from 'react';
import { useScene } from '../context/SceneContext';
import { useReducedMotion } from '../hooks';
import { motion } from 'framer-motion';

const sections = [
  { id: 'hero', label: 'OBJECT' },
  { id: 'materials', label: 'MATERIALS' },
  { id: 'transformation', label: 'TRANSFORMATION' },
  { id: 'playground', label: 'PLAYGROUND' },
  { id: 'experiments', label: 'EXPERIMENTS' },
];

export function Navigation() {
  const { isMobile, reducedMotion } = useScene();
  const prefersReduced = useReducedMotion();
  const [activeSection, setActiveSection] = useState('hero');

  const reducedMotionRef = useRef(reducedMotion || prefersReduced);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion || prefersReduced;
  }, [reducedMotion, prefersReduced]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;

    const attach = () => {
      const missing = sections.filter(({ id }) => !document.getElementById(id));
      if (missing.length > 0) return; // content not mounted yet (loading screen up)
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
            }
          });
        },
        {
          root: null,
          rootMargin: '-50% 0px -50% 0px',
          threshold: 0,
        }
      );
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer!.observe(el);
      });
    };

    attach();
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      if (observer) observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: reducedMotionRef.current ? 'auto' : 'smooth' });
    }
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-around gap-2 px-4 py-3" style={{
          background: 'rgba(17, 19, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-all duration-200 ${
                activeSection === id
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              }`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="overline" style={{ fontSize: '9px' }}>{label}</span>
              <div className="w-1.5 h-1.5 rounded-full transition-all duration-200" style={{
                background: activeSection === id ? 'var(--accent)' : 'transparent',
                border: '1px solid',
                borderColor: activeSection === id ? 'var(--accent)' : 'var(--border)',
              }} />
            </button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" style={{ pointerEvents: 'auto' }}>
      <div className="flex items-center justify-between px-6 py-4 max-w-[1440px] mx-auto" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center gap-8">
          <span className="overline" style={{ opacity: 0.5 }}>BEYOND THE SURFACE</span>
          <div className="flex items-center gap-6" style={{ pointerEvents: 'auto' }}>
            {sections.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`relative px-3 py-2 transition-all duration-200 ${
                  activeSection === id
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span className="overline">{label}</span>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: activeSection === id ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: 'var(--accent)',
                    transformOrigin: activeSection === id ? 'center' : 'left',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block w-32 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }} />
          <button
            className="relative px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              pointerEvents: 'auto',
            }}
          >
            <span className="overline">REPLAY</span>
          </button>
        </div>
      </div>

      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden md:block w-64">
        <div className="flex flex-col gap-3">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`relative w-24 text-left transition-all duration-200 ${
                activeSection === id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="overline block mb-1">{label}</span>
              <div className="h-0.5 rounded-full transition-all duration-300" style={{
                background: activeSection === id ? 'var(--accent)' : 'var(--border)',
                width: activeSection === id ? '100%' : '20%',
              }} />
            </button>
          ))}
        </div>
      </div>

      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden md:block">
        <div className="w-px h-32" style={{
          background: 'linear-gradient(180deg, transparent, var(--accent), transparent)',
          opacity: 0.3,
        }} />
        <div className="mt-2 text-right">
          <span className="overline" style={{ opacity: 0.5 }}>SCROLL</span>
          <motion.div
            className="w-4 h-4 rounded-full mt-2 mx-auto"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'var(--accent)', opacity: 0.5 }}
          />
        </div>
      </div>
    </nav>
  );
}