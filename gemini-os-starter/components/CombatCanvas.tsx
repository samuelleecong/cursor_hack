/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, {useEffect, useRef, useState} from 'react';

export interface SceneDescription {
  scene: string; // Text description of the scene
  character?: {
    type: string; // 'player' | 'enemy' | 'npc'
    position: {x: number; y: number}; // Normalized 0-1
    size: number; // Normalized 0-1
    emoji: string;
  };
  objects?: Array<{
    type: string; // 'weapon' | 'item' | 'effect'
    position: {x: number; y: number};
    size: number;
    emoji: string;
  }>;
  environment?: {
    type: string; // 'forest' | 'dungeon' | 'cave' | 'castle'
    color: string; // Background color
  };
  effects?: Array<{
    type: 'sparkle' | 'blood' | 'heal' | 'magic';
    position: {x: number; y: number};
    emoji: string;
  }>;
  choices: Array<{
    id: string;
    text: string;
    type: string; // 'combat' | 'heal' | 'loot' | 'dialogue' | 'conclude'
    value?: number; // For damage/heal amounts
  }>;
}

interface CombatCanvasProps {
  sceneData: SceneDescription | null;
  onChoice: (choiceId: string, choiceType: string, value?: number) => void;
  isLoading: boolean;
}

export const CombatCanvas: React.FC<CombatCanvasProps> = ({
  sceneData,
  onChoice,
  isLoading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<
    Array<{x: number; y: number; vx: number; vy: number; emoji: string; life: number}>
  >([]);

  // Render scene on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sceneData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw environment background
    const envColor = sceneData.environment?.color || '#2a2a3e';
    ctx.fillStyle = envColor;
    ctx.fillRect(0, 0, width, height);

    // Add gradient for depth
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw objects
    sceneData.objects?.forEach((obj) => {
      const x = obj.position.x * width;
      const y = obj.position.y * height;
      const size = obj.size * Math.min(width, height);

      ctx.font = `${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.emoji, x, y);
    });

    // Draw character
    if (sceneData.character) {
      const char = sceneData.character;
      const x = char.position.x * width;
      const y = char.position.y * height;
      const size = char.size * Math.min(width, height);

      // Add shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.font = `${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char.emoji, x, y);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw effects
    sceneData.effects?.forEach((effect) => {
      const x = effect.position.x * width;
      const y = effect.position.y * height;

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(effect.emoji, x, y);
    });

    // Draw particles
    particles.forEach((particle) => {
      ctx.font = '16px Arial';
      ctx.globalAlpha = particle.life / 100;
      ctx.fillText(particle.emoji, particle.x, particle.y);
    });
    ctx.globalAlpha = 1;
  }, [sceneData, particles]);

  // Particle animation
  useEffect(() => {
    if (!sceneData?.effects) return;

    // Create particles from effects
    const newParticles = sceneData.effects.flatMap((effect) => {
      const particleCount = 5;
      return Array.from({length: particleCount}, () => ({
        x: effect.position.x * (canvasRef.current?.width || 600),
        y: effect.position.y * (canvasRef.current?.height || 400),
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1,
        emoji: effect.emoji,
        life: 100,
      }));
    });

    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // Gravity
            life: p.life - 2,
          }))
          .filter((p) => p.life > 0),
      );
    }, 30);

    return () => clearInterval(interval);
  }, [sceneData?.effects]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 p-4">
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border-4 border-purple-600 rounded-lg shadow-2xl"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
              <p className="text-purple-300 text-lg">Generating scene...</p>
            </div>
          </div>
        )}
      </div>

      {sceneData && (
        <div className="w-full max-w-2xl">
          <div className="bg-gray-800 p-4 rounded-lg mb-4 border-2 border-purple-500">
            <p className="text-gray-200 text-lg leading-relaxed">{sceneData.scene}</p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {sceneData.choices.map((choice) => {
              const getButtonColor = () => {
                switch (choice.type) {
                  case 'combat':
                  case 'damage':
                    return 'bg-red-600 hover:bg-red-700 border-red-400';
                  case 'heal':
                    return 'bg-green-600 hover:bg-green-700 border-green-400';
                  case 'loot':
                    return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-400';
                  case 'dialogue':
                    return 'bg-blue-600 hover:bg-blue-700 border-blue-400';
                  case 'conclude':
                    return 'bg-purple-600 hover:bg-purple-700 border-purple-400';
                  default:
                    return 'bg-gray-600 hover:bg-gray-700 border-gray-400';
                }
              };

              return (
                <button
                  key={choice.id}
                  onClick={() => onChoice(choice.id, choice.type, choice.value)}
                  className={`${getButtonColor()} text-white font-bold px-6 py-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 shadow-lg`}
                  disabled={isLoading}
                >
                  {choice.text}
                  {choice.value && (
                    <span className="ml-2 text-sm">
                      {choice.type === 'damage' || choice.type === 'combat'
                        ? `-${choice.value}`
                        : `+${choice.value}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
