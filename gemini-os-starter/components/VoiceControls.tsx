/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { speechService } from '../services/speechService';
import { VoiceSettings } from '../types/voice';

interface VoiceControlsProps {
  compact?: boolean;
}

/**
 * Voice Controls Component
 * UI for controlling TTS speech settings
 */
export const VoiceControls: React.FC<VoiceControlsProps> = ({ compact = false }) => {
  const [settings, setSettings] = useState<VoiceSettings>(speechService.getSettings());
  const [isPlaying, setIsPlaying] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Update state when playback changes
  useEffect(() => {
    const interval = setInterval(() => {
      const playbackState = speechService.getPlaybackState();
      setIsPlaying(playbackState.isPlaying);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleToggleEnabled = () => {
    const newEnabled = speechService.toggleEnabled();
    setSettings({ ...settings, enabled: newEnabled });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    speechService.setVolume(volume);
    setSettings({ ...settings, volume });
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    speechService.updateSettings({ speed });
    setSettings({ ...settings, speed });
  };

  const handleToggleAutoPlay = () => {
    const newAutoPlay = !settings.autoPlay;
    speechService.updateSettings({ autoPlay: newAutoPlay });
    setSettings({ ...settings, autoPlay: newAutoPlay });
  };

  const handleToggleNarrator = () => {
    const newNarratorEnabled = !settings.narratorEnabled;
    speechService.updateSettings({ narratorEnabled: newNarratorEnabled });
    setSettings({ ...settings, narratorEnabled: newNarratorEnabled });
  };

  const handleStop = () => {
    speechService.stopSpeech();
  };

  const handleClearCache = () => {
    speechService.clearCache();
    alert('Speech cache cleared!');
  };

  const handleShowStats = () => {
    const stats = speechService.getCacheStats();
    setCacheStats(stats);
  };

  if (compact) {
    return (
      <div className="voice-controls-compact" style={styles.compactContainer}>
        <button
          onClick={handleToggleEnabled}
          style={{
            ...styles.button,
            backgroundColor: settings.enabled ? '#4CAF50' : '#f44336',
          }}
          title={settings.enabled ? 'Voice Enabled' : 'Voice Disabled'}
        >
          🔊 {settings.enabled ? 'ON' : 'OFF'}
        </button>
        {isPlaying && (
          <button onClick={handleStop} style={styles.button} title="Stop Speech">
            ⏹️
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="voice-controls" style={styles.container}>
      <h3 style={styles.header}>🎙️ Voice Settings</h3>

      <div style={styles.section}>
        <label style={styles.label}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={handleToggleEnabled}
          />
          <span style={styles.labelText}>Enable Voice Speech</span>
        </label>

        <label style={styles.label}>
          <input
            type="checkbox"
            checked={settings.autoPlay}
            onChange={handleToggleAutoPlay}
            disabled={!settings.enabled}
          />
          <span style={styles.labelText}>Auto-play Dialogue</span>
        </label>

        <label style={styles.label}>
          <input
            type="checkbox"
            checked={settings.narratorEnabled}
            onChange={handleToggleNarrator}
            disabled={!settings.enabled}
          />
          <span style={styles.labelText}>Enable Narrator Voice</span>
        </label>
      </div>

      <div style={styles.section}>
        <label style={styles.sliderLabel}>
          Volume: {(settings.volume * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={handleVolumeChange}
          disabled={!settings.enabled}
          style={styles.slider}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.sliderLabel}>
          Speed: {settings.speed.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.speed}
          onChange={handleSpeedChange}
          disabled={!settings.enabled}
          style={styles.slider}
        />
      </div>

      {isPlaying && (
        <div style={styles.playbackStatus}>
          <span>🎵 Playing...</span>
          <button onClick={handleStop} style={styles.smallButton}>
            Stop
          </button>
        </div>
      )}

      <div style={styles.buttonRow}>
        <button onClick={handleShowStats} style={styles.smallButton}>
          📊 Cache Stats
        </button>
        <button onClick={handleClearCache} style={styles.smallButton}>
          🗑️ Clear Cache
        </button>
      </div>

      {cacheStats && (
        <div style={styles.stats}>
          <h4 style={styles.statsHeader}>Cache Statistics</h4>
          <div style={styles.statItem}>Entries: {cacheStats.totalEntries}</div>
          <div style={styles.statItem}>Memory: {cacheStats.memoryUsedMB} MB</div>
          <div style={styles.statItem}>Avg Accesses: {cacheStats.avgAccessCount}</div>
          <button
            onClick={() => setCacheStats(null)}
            style={styles.smallButton}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid #555',
    borderRadius: '8px',
    padding: '16px',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '14px',
    maxWidth: '350px',
  } as React.CSSProperties,
  compactContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  } as React.CSSProperties,
  header: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    borderBottom: '1px solid #555',
    paddingBottom: '8px',
  } as React.CSSProperties,
  section: {
    marginBottom: '16px',
  } as React.CSSProperties,
  label: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  labelText: {
    marginLeft: '8px',
  } as React.CSSProperties,
  sliderLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
  } as React.CSSProperties,
  slider: {
    width: '100%',
    cursor: 'pointer',
  } as React.CSSProperties,
  button: {
    padding: '8px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  smallButton: {
    padding: '6px 10px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  } as React.CSSProperties,
  buttonRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  } as React.CSSProperties,
  playbackStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: '4px',
    marginBottom: '12px',
  } as React.CSSProperties,
  stats: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: '4px',
    fontSize: '12px',
  } as React.CSSProperties,
  statsHeader: {
    margin: '0 0 8px 0',
    fontSize: '14px',
  } as React.CSSProperties,
  statItem: {
    marginBottom: '4px',
  } as React.CSSProperties,
};

export default VoiceControls;
