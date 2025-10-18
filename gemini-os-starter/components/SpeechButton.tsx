/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { CharacterArchetype, VoiceEmotion } from '../types/voice';

interface SpeechButtonProps {
  text: string;
  characterType?: CharacterArchetype;
  emotion?: VoiceEmotion;
  size?: 'small' | 'medium' | 'large';
  style?: React.CSSProperties;
  disabled?: boolean;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

/**
 * Clickable button that plays speech when clicked
 * Shows loading/playing states
 */
export const SpeechButton: React.FC<SpeechButtonProps> = ({
  text,
  characterType = 'narrator',
  emotion,
  size = 'medium',
  style,
  disabled = false,
  onSpeechStart,
  onSpeechEnd,
}) => {
  const { speak, isGenerating, isPlaying, stop } = useSpeech();
  const [isThisPlaying, setIsThisPlaying] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Track when this specific button's speech is playing
  useEffect(() => {
    if (isPlaying && hasGenerated) {
      setIsThisPlaying(true);
      onSpeechStart?.();
    } else if (!isPlaying && isThisPlaying) {
      setIsThisPlaying(false);
      onSpeechEnd?.();
    }
  }, [isPlaying, hasGenerated]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (disabled) return;

    // If already playing this speech, stop it
    if (isThisPlaying) {
      stop();
      setIsThisPlaying(false);
      setHasGenerated(false);
      return;
    }

    // Generate and play speech
    setHasGenerated(true);
    await speak(text, characterType, emotion, true);
  };

  const getIcon = () => {
    if (isGenerating) return '⏳';
    if (isThisPlaying) return '⏹️';
    return '🔊';
  };

  const getTitle = () => {
    if (isGenerating) return 'Generating speech...';
    if (isThisPlaying) return 'Click to stop';
    return 'Click to play speech';
  };

  const sizes = {
    small: {
      width: '24px',
      height: '24px',
      fontSize: '12px',
    },
    medium: {
      width: '32px',
      height: '32px',
      fontSize: '16px',
    },
    large: {
      width: '40px',
      height: '40px',
      fontSize: '20px',
    },
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isGenerating}
      title={getTitle()}
      style={{
        ...styles.button,
        ...sizes[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isThisPlaying ? '#f44336' : '#4CAF50',
        ...style,
      }}
    >
      {getIcon()}
    </button>
  );
};

const styles = {
  button: {
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
};

export default SpeechButton;
