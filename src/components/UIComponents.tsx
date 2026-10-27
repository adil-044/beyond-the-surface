import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  progress: number;
  onComplete: () => void;
}

export function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (progress > 0) setShowProgress(true);
    if (progress >= 1) {
      setTimeout(() => {
        onComplete();
      }, 800);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--surface))',
            border: '1px solid var(--border)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--accent)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <p className="overline mb-2" style={{ color: 'var(--accent)' }}>INTERACTIVE EXPERIMENT No. 001</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-4" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            lineHeight: 1.02,
          }}>
            BEYOND
            <br />
            <span style={{ color: 'var(--accent)' }}>THE SURFACE.</span>
          </h1>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-12">
            An exploration of light, matter, motion, and the space between.
          </p>
        </motion.div>

        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="overline">LOADING</span>
              <span className="overline tabular-nums" style={{ color: 'var(--accent)' }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: 'linear-gradient(90deg, var(--accent), var(--cyan))',
                  transformOrigin: 'left',
                }}
              />
            </div>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: showProgress ? 0 : 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-[var(--text-muted)]"
        >
          Initializing WebGL context...
        </motion.p>
      </div>
    </div>
  );
}

export function SectionHeading({ label, title, subtitle }: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-[1440px] mx-auto px-6 mb-12">
      <span className="overline block mb-4" style={{ color: 'var(--accent)' }}>{label}</span>
      <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4" style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)',
        lineHeight: 1.05,
      }}>
        {title.split('\n').map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl max-w-2xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function TechnicalLabel({ label, value, unit = '' }: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="technical-label">{label}</span>
      <span className="font-mono text-[var(--text-primary)] tabular-nums">{value}</span>
      {unit && <span className="technical-label">{unit}</span>}
    </div>
  );
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}) {
  return (
    <div className="w-full" style={{ opacity: disabled ? 0.5 : 1 }}>
      <div className="flex items-center justify-between mb-2">
        <span className="technical-label">{label}</span>
        <span className="font-mono text-[var(--text-primary)] tabular-nums" style={{ minWidth: '5ch' }}>
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full cursor-pointer"
        style={{ accentColor: 'var(--accent)' }}
      />
    </div>
  );
}

export function ToggleControl({
  label,
  checked,
  onChange,
  disabled = false,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="flex items-center justify-between w-full p-4 rounded-xl transition-all duration-200"
      style={{
        background: checked ? 'rgba(200, 255, 69, 0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-11 h-6 rounded-full transition-all duration-200 flex items-center" style={{
          background: checked ? 'var(--accent)' : 'var(--border)',
        }}>
          <motion.div
            className="w-5 h-5 rounded-full"
            animate={{ x: checked ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
              background: checked ? 'var(--bg)' : 'var(--text-muted)',
              boxShadow: checked ? '0 0 12px var(--accent-glow)' : 'none',
            }}
          />
        </div>
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
          {description && <span className="technical-label block mt-0.5">{description}</span>}
        </div>
      </div>
      <span className="technical-label">{checked ? 'ON' : 'OFF'}</span>
    </button>
  );
}

export function SelectControl({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full" style={{ opacity: disabled ? 0.5 : 1 }}>
      <span className="technical-label block mb-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          accentColor: 'var(--accent)',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function StatusIndicator({ label, value, status = 'normal' }: {
  label: string;
  value: string | number;
  status?: 'normal' | 'warning' | 'error' | 'active';
}) {
  const statusColors = {
    normal: 'var(--text-muted)',
    warning: 'var(--accent)',
    error: '#FF4444',
    active: 'var(--cyan)',
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${status === 'normal' ? 'var(--border)' : statusColors[status]}`,
    }}>
      <span className="technical-label">{label}</span>
      <span className="font-mono text-[var(--text-primary)] tabular-nums" style={{ color: statusColors[status] }}>
        {value}
      </span>
      <div className="w-2 h-2 rounded-full" style={{
        background: statusColors[status],
        boxShadow: status === 'active' ? '0 0 8px var(--cyan)' : 'none',
        animation: status === 'active' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
      }} />
    </div>
  );
}

export function ResetButton({ onClick, label = 'RESET', disabled = false }: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 12a9 9 0 1 0 9-9.975L3 12z" />
        <path d="M3 12h6v6" />
      </svg>
      <span className="overline">{label}</span>
    </button>
  );
}

export function FullscreenButton({ onClick, isFullscreen = false }: {
  onClick: () => void;
  isFullscreen?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {isFullscreen ? (
          <>
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 0 2-2v-3M3 8h3a2 2 0 0 1 2-2V3" />
          </>
        ) : (
          <>
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </>
        )}
      </svg>
      <span className="overline">{isFullscreen ? 'EXIT' : 'FULLSCREEN'}</span>
    </button>
  );
}

export function RandomizeButton({ onClick, label = 'RANDOMIZE', disabled = false }: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
      style={{
        background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
        border: 'none',
        color: 'var(--bg)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
      <span className="overline">{label}</span>
    </button>
  );
}