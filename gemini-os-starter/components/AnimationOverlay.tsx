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

  const getAnimationContent = () => {
    switch (animation.type) {
      case 'damage':
        return (
          <div className="animate-bounce">
            <div className="text-8xl mb-4">⚔️</div>
            <div className="text-6xl font-bold text-red-500 animate-pulse">
              -{animation.value} HP
            </div>
            {animation.text && (
              <div className="text-xl text-red-300 mt-4">{animation.text}</div>
            )}
          </div>
        );

      case 'heal':
        return (
          <div className="animate-bounce">
            <div className="text-8xl mb-4">✨</div>
            <div className="text-6xl font-bold text-green-500 animate-pulse">
              +{animation.value} HP
            </div>
            {animation.text && (
              <div className="text-xl text-green-300 mt-4">{animation.text}</div>
            )}
          </div>
        );

      case 'combat':
        return (
          <div className="animate-pulse">
            <div className="text-9xl mb-4">💥</div>
            <div className="text-3xl font-bold text-yellow-400">
              {animation.text || 'Combat!'}
            </div>
          </div>
        );

      case 'loot':
        return (
          <div className="animate-bounce">
            <div className="text-9xl mb-4">💎</div>
            <div className="text-3xl font-bold text-purple-400">
              {animation.text || 'Item Found!'}
            </div>
          </div>
        );

      case 'dialogue':
        return (
          <div className="animate-pulse">
            <div className="text-9xl mb-4">💬</div>
            <div className="text-3xl font-bold text-blue-400">
              {animation.text || 'Conversation'}
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
      }`}>
      <div className="bg-black/80 backdrop-blur-sm rounded-3xl p-12 text-center">
        {getAnimationContent()}
      </div>
    </div>
  );
};
