/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useState} from 'react';
import {GameAnimation} from '../types';

interface AnimationOverlayProps {
  animation: GameAnimation | null;
  onComplete: () => void;
}

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  animation,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (animation) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300); // Wait for fade out
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [animation, onComplete]);

  if (!animation || !visible) return null;

  // Skip loot and dialogue animations, but show damage
  if (animation.type === 'loot' || animation.type === 'dialogue') {
    return null;
  }

  const getAnimationContent = () => {
    switch (animation.type) {
      case 'heal':
        return (
          <div className="animate-bounce">
            <div className="text-8xl mb-4">✨</div>
            <div
              className="animate-pulse"
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#6fa85c',
                textShadow: '4px 4px 0px #4a7a3d',
                fontFamily: 'monospace'
              }}
            >
              +{animation.value} HP
            </div>
            {animation.text && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#f4e8d0',
                  marginTop: '16px',
                  fontFamily: 'monospace'
                }}
              >
                {animation.text}
              </div>
            )}
          </div>
        );

      case 'damage':
        return (
          <div className="animate-pulse">
            <div className="text-9xl mb-4">⚔️</div>
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#c9534f',
                textShadow: '4px 4px 0px #8b3a34',
                fontFamily: 'monospace'
              }}
            >
              -{animation.value} HP
            </div>
            {animation.text && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#f4e8d0',
                  marginTop: '16px',
                  fontFamily: 'monospace'
                }}
              >
                {animation.text}
              </div>
            )}
          </div>
        );

      case 'combat':
        return (
          <div className="animate-pulse">
            <div className="text-9xl mb-4">💥</div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#d4a574',
                textShadow: '3px 3px 0px #8b6f47',
                fontFamily: 'monospace'
              }}
            >
              {animation.text || 'Combat!'}
            </div>
          </div>
        );

      case 'dialogue':
        return (
          <div className="animate-pulse">
            <div className="text-9xl mb-4">💬</div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#5a8fc9',
                textShadow: '3px 3px 0px #3d5f82',
                fontFamily: 'monospace'
              }}
            >
              {animation.text || 'Conversation'}
            </div>
          </div>
        );

      case 'levelup':
        return (
          <div className="animate-bounce">
            <div className="text-9xl mb-4">⭐</div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#d4a574',
                textShadow: '4px 4px 0px #8b6f47',
                fontFamily: 'monospace',
                letterSpacing: '2px'
              }}
            >
              {animation.text || 'Level Up!'}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="text-center"
        style={{
          backgroundColor: 'rgba(61,40,23,0.95)',
          border: '8px solid #3d2817',
          borderRadius: '4px',
          padding: '48px',
          boxShadow: '0 12px 0 #3d2817, inset 0 6px 0 rgba(255,255,255,0.1)'
        }}
      >
        {getAnimationContent()}
      </div>
    </div>
  );
};
