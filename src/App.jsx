import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSound } from './contexts/SoundContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Studio from './components/Studio';
import Profile from './components/Profile';
import Settings from './components/Settings';
import ApiKeys from './components/ApiKeys';
import Projects from './components/Projects';
import Logs from './components/Logs';
import TrainingHistory from './components/TrainingHistory';
import TrainingMonitoringDetail from './components/TrainingMonitoringDetail';
import ExportPage from './pages/ExportPage';
import CommunityPage from './pages/CommunityPage';
import CommunityTestPage from './pages/CommunityTestPage';
import DeploymentsPage from './pages/DeploymentsPage';
import PublicModelPage from './pages/PublicModelPage';
import PageBuilder from './pages/PageBuilder';
import DocumentationPage from './pages/DocumentationPage';
import Analytics from './components/Analytics';
import clickSoundAsset from './assets/sounds/click.mp3';
import writingSoundAsset from './assets/sounds/writing.mp3';

function App() {
  const { settings } = useSound();

  useEffect(() => {
    // Create base audio instances for preloading
    const baseClickAudio = new Audio(clickSoundAsset);
    const baseTypingAudio = new Audio(writingSoundAsset);

    const handleGlobalClick = () => {
      if (!settings.masterEnabled || !settings.clickSoundEnabled) return;

      // Clone the node to allow overlapping sounds for rapid clicks
      const sound = baseClickAudio.cloneNode();
      sound.volume = settings.volume;
      sound.play().catch(e => {
        console.debug('Click sound play failed', e);
      });
    };

    const handleGlobalKeyDown = (e) => {
      if (!settings.masterEnabled || !settings.typingSoundEnabled) return;

      // Optional: Ignore modifier keys if desired, but user said "prottekta key" (every key)
      // We might want to avoid holding down a key causing machine gun sound? 
      // But "no delay" implies rapid fire is okay.
      if (e.repeat) return; // Prevent machine gun effect on hold, or maybe user wants it? 
      // Usually typing sound is per keystroke. Let's block repeat for sanity unless requested otherwise.

      const sound = baseTypingAudio.cloneNode();
      // Typing sounds are often too loud if same volume as clicks, but let's stick to master volume for now
      // or maybe slightly lower? Let's use master volume as requested.
      sound.volume = settings.volume;
      sound.play().catch(e => {
        console.debug('Typing sound play failed', e);
      });
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [settings.masterEnabled, settings.clickSoundEnabled, settings.typingSoundEnabled, settings.volume]);

  return (
    <ThemeProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/test/:projectId" element={<CommunityTestPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/api-keys" element={<ApiKeys />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/training-history" element={<TrainingHistory />} />
        <Route path="/training-history/:sessionId" element={<TrainingMonitoringDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/studio/:projectId" element={<Studio />} />
        <Route path="/export/:projectId" element={<ExportPage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="/deployments/builder/:deploymentId" element={<PageBuilder />} />
        <Route path="/share/:username/:slug" element={<PublicModelPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
