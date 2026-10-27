import { useEffect, useState } from 'react';
import { SceneProvider } from './context/SceneContext';
import { Navigation } from './components/Navigation';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/UIComponents';
import { HeroScene } from './scenes/HeroScene';
import { MaterialLabScene } from './scenes/MaterialLabScene';
import { TransformationScene } from './scenes/TransformationScene';
import { ParticlePlaygroundScene } from './scenes/ParticlePlaygroundScene';
import { GravityScene } from './scenes/GravityScene';
import { RefractionScene } from './scenes/RefractionScene';
import { KineticScene } from './scenes/KineticScene';
import { FinalScene } from './scenes/FinalScene';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const simulateLoading = () => {
      const steps = [0.15, 0.35, 0.55, 0.75, 0.9, 1];
      let i = 0;
      const interval = setInterval(() => {
        setProgress(steps[i]);
        i++;
        if (i >= steps.length) {
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    };
    simulateLoading();
  }, []);

  return (
    <>
      <Navigation />
      <CustomCursor />
      <LoadingScreen progress={progress} onComplete={() => setLoading(false)} />
      {!loading && (
        <>
          <section id="hero" className="relative min-h-screen">
            <HeroScene />
          </section>
          <section id="materials" className="relative min-h-screen">
            <MaterialLabScene />
          </section>
          <section id="transformation" className="relative">
            <TransformationScene />
          </section>
          <section id="playground" className="relative min-h-screen">
            <ParticlePlaygroundScene />
          </section>
          <section id="experiments" className="relative min-h-screen">
            <GravityScene />
            <RefractionScene />
            <KineticScene />
          </section>
          <section id="final" className="relative min-h-screen">
            <FinalScene />
          </section>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <SceneProvider>
      <AppContent />
    </SceneProvider>
  );
}

export default App;