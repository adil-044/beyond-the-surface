import { useEffect, useRef, useState } from 'react';
import { useScene } from '../context/SceneContext';
import { useWindowSize } from '../hooks';
import { motion } from 'framer-motion';
import { lerp } from '../utils/geometry';

interface CursorState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  borderWidth: number;
  opacity: number;
  isHovering: boolean;
  isDragging: boolean;
  isClicking: boolean;
}

export function CustomCursor() {
  const { isMobile, reducedMotion } = useScene();
  const { width, height } = useWindowSize();
  const [cursor, setCursor] = useState<CursorState>({
    x: width / 2,
    y: height / 2,
    targetX: width / 2,
    targetY: height / 2,
    scale: 1,
    borderWidth: 1,
    opacity: 0,
    isHovering: false,
    isDragging: false,
    isClicking: false,
  });

  const rafRef = useRef<number | null>(null);
  const isVisible = useRef(false);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    if (isMobile || reducedMotionRef.current) return;

    const updatePosition = (e: MouseEvent) => {
      setCursor(prev => ({
        ...prev,
        targetX: e.clientX,
        targetY: e.clientY,
      }));
    };

    const handleMouseDown = () => {
      setCursor(prev => ({ ...prev, isClicking: true, scale: 0.8, borderWidth: 2 }));
    };

    const handleMouseUp = () => {
      setCursor(prev => ({ ...prev, isClicking: false, scale: prev.isHovering ? 1.5 : 1, borderWidth: 1 }));
    };

    const handleMouseEnter = () => {
      setCursor(prev => ({ ...prev, opacity: 1 }));
      isVisible.current = true;
    };

    const handleMouseLeave = () => {
      setCursor(prev => ({ ...prev, opacity: 0 }));
      isVisible.current = false;
    };

    const handleDragStart = () => {
      setCursor(prev => ({ ...prev, isDragging: true, scale: 1.2, borderWidth: 2 }));
    };

    const handleDragEnd = () => {
      setCursor(prev => ({ ...prev, isDragging: false, scale: prev.isHovering ? 1.5 : 1, borderWidth: 1 }));
    };

    document.addEventListener('mousemove', updatePosition, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('dragstart', handleDragStart, { passive: true });
    document.addEventListener('dragend', handleDragEnd, { passive: true });

    const tick = () => {
      setCursor(prev => {
        const ease = 0.15;
        const newX = lerp(prev.x, prev.targetX, ease);
        const newY = lerp(prev.y, prev.targetY, ease);

        if (Math.abs(newX - prev.targetX) < 0.5 && Math.abs(newY - prev.targetY) < 0.5) {
          return prev;
        }

        return { ...prev, x: newX, y: newY };
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <motion.div
      className="custom-cursor fixed pointer-events-none z-[9999] mix-blend-difference"
      style={{
        left: cursor.x,
        top: cursor.y,
        transform: `translate(-50%, -50%) scale(${cursor.scale})`,
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: `${cursor.borderWidth}px solid`,
        borderColor: cursor.isHovering ? 'var(--accent)' : 'var(--text-primary)',
        background: cursor.isHovering ? 'rgba(200, 255, 69, 0.1)' : 'transparent',
        opacity: cursor.opacity,
        transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      animate={{
        scale: cursor.isClicking ? 0.8 : cursor.isDragging ? 1.2 : cursor.isHovering ? 1.5 : 1,
        borderWidth: cursor.isClicking || cursor.isDragging ? 2 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {cursor.isHovering && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ pointerEvents: 'none' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--accent)' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}