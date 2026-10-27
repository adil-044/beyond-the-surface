import { Component, useEffect, useState, type ReactNode } from 'react';
import { SceneProvider } from './context/SceneContext';
import { Navigation } from './components/Navigation';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/UIComponents';
import { SceneMount } from './components/SceneMount';
import { HeroScene } from './scenes/HeroScene';
import { MaterialLabScene } from './scenes/MaterialLabScene';
import { TransformationScene } from './scenes/TransformationScene';
import { ParticlePlaygroundScene } from './scenes/ParticlePlaygroundScene';
import { GravityScene } from './scenes/GravityScene';
import { RefractionScene } from './scenes/RefractionScene';
import { KineticScene } from './scenes/KineticScene';
import { FinalScene } from './scenes/FinalScene';

/** Top-level guard: any crashed subtree must not blank the whole page. Retries once. */
class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[AppBoundary] crash contained:', error);
  }

  componentDidUpdate() {
    if (this.state.failed) {
      // One retry after the dust settles, then show content skeleton no matter what.
      window.setTimeout(() => this.setState({ failed: false }), 700);
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div style={{ padding: '10vh 6vw', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>BEYOND THE SURFACE.</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Something hit a snag — reloading the experience…</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Hard reveal. Never let the loader sit on 100%: force content after max 4s. */
const MAX_LOADING_MS = 4000;
const COMPLETE_DELAY_MS = 900;

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [0.15, 0.35, 0.55, 0.75, 0.9, 1];
    let i = 0;
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      setLoading(false);
    };

    // Progress simulation — 6 steps, 200ms apart.
    const interval = window.setInterval(() => {
      setProgress(steps[i]);
      i += 1;
      if (i >= steps.length) {
        window.clearInterval(interval);
        // Brief beat at 100% so the bar reads complete, then reveal.
        window.setTimeout(finish, COMPLETE_DELAY_MS);
      }
    }, 200);

    // Watchdog: whatever happens to timers/effects, reveal content on time.
    const watchdog = window.setTimeout(finish, MAX_LOADING_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(watchdog);
    };
  }, []);

  return (
    <>
      <Navigation />
      <CustomCursor />
      {loading && <LoadingScreen progress={progress} />}
      {!loading && (
        <>
          <section id="hero" className="relative min-h-screen">
            <SceneMount immediate>
              <HeroScene />
            </SceneMount>
          </section>
          <section id="materials" className="relative min-h-screen">
            <SceneMount>
              <MaterialLabScene />
            </SceneMount>
          </section>
          <section id="transformation" className="relative min-h-screen">
            <SceneMount>
              <TransformationScene />
            </SceneMount>
          </section>
          <section id="playground" className="relative min-h-screen">
            <SceneMount>
              <ParticlePlaygroundScene />
            </SceneMount>
          </section>
          <section id="experiments" className="relative min-h-screen">
            <SceneMount>
              <GravityScene />
            </SceneMount>
            <SceneMount>
              <RefractionScene />
            </SceneMount>
            <SceneMount>
              <KineticScene />
            </SceneMount>
          </section>
          <section id="final" className="relative min-h-screen">
            <SceneMount>
              <FinalScene />
            </SceneMount>
          </section>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AppBoundary>
      <SceneProvider>
        <AppContent />
      </SceneProvider>
    </AppBoundary>
  );
}

export default App;