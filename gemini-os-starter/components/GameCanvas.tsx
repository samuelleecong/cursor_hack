/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef, useState} from 'react';
import {CharacterClass} from '../characterClasses';
import {Position, GameObject} from '../types';

interface GameCanvasProps {
  character: CharacterClass;
  playerPosition: Position;
  objects: GameObject[];
  onMove: (newPosition: Position) => void;
  onInteract: (object: GameObject) => void;
  onScreenExit: (direction: 'right' | 'left' | 'up' | 'down') => void;
  roomDescription: string;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;
const PLAYER_SIZE = 35;
const MOVE_SPEED = 5;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  character,
  playerPosition,
  objects,
  onMove,
  onInteract,
  onScreenExit,
  roomDescription,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const animationRef = useRef<number>();

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
        setKeys((prev) => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.delete(key);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Calculate new position based on keys pressed
      let newX = playerPosition.x;
      let newY = playerPosition.y;

      if (keys.has('w') || keys.has('arrowup')) newY -= MOVE_SPEED;
      if (keys.has('s') || keys.has('arrowdown')) newY += MOVE_SPEED;
      if (keys.has('a') || keys.has('arrowleft')) newX -= MOVE_SPEED;
      if (keys.has('d') || keys.has('arrowright')) newX += MOVE_SPEED;

      // Check screen boundaries and trigger screen exit
      if (newX > CANVAS_WIDTH - PLAYER_SIZE / 2) {
        onScreenExit('right');
        return;
      }
      if (newX < PLAYER_SIZE / 2) {
        onScreenExit('left');
        return;
      }
      if (newY > CANVAS_HEIGHT - PLAYER_SIZE / 2) {
        onScreenExit('down');
        return;
      }
      if (newY < PLAYER_SIZE / 2) {
        onScreenExit('up');
        return;
      }

      // Keep player within bounds
      newX = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, newX));
      newY = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_HEIGHT - PLAYER_SIZE / 2, newY));

      // Update position if changed
      if (newX !== playerPosition.x || newY !== playerPosition.y) {
        onMove({x: newX, y: newY});
      }

      // Check for interactions with space bar
      if (keys.has(' ')) {
        objects.forEach((obj) => {
          const distance = Math.sqrt(
            Math.pow(playerPosition.x - obj.position.x, 2) +
              Math.pow(playerPosition.y - obj.position.y, 2),
          );
          if (distance < 50 && !obj.hasInteracted) {
            onInteract(obj);
          }
        });
      }

      // Render
      render(ctx);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    const render = (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid
      ctx.strokeStyle = '#2a2a3e';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw objects
      objects.forEach((obj) => {
        // Draw object shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(obj.position.x, obj.position.y + 20, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw object sprite
        ctx.font = '35px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.sprite, obj.position.x, obj.position.y);

        // Draw interaction indicator if close
        const distance = Math.sqrt(
          Math.pow(playerPosition.x - obj.position.x, 2) +
            Math.pow(playerPosition.y - obj.position.y, 2),
        );
        if (distance < 50 && !obj.hasInteracted) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '12px Arial';
          ctx.fillText('SPACE', obj.position.x, obj.position.y - 30);
        }
      });

      // Draw player shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(playerPosition.x, playerPosition.y + 25, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw player
      ctx.font = `${PLAYER_SIZE}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(character.icon, playerPosition.x, playerPosition.y);

      // Draw player glow
      ctx.strokeStyle = character.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.font = `${PLAYER_SIZE + 4}px Arial`;
      ctx.strokeText(character.icon, playerPosition.x, playerPosition.y);
      ctx.globalAlpha = 1;

      // Draw room description at top
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 60);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(roomDescription, CANVAS_WIDTH / 2, 30);

      // Draw controls hint at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px Arial';
      ctx.fillText(
        'WASD/Arrows: Move | SPACE: Interact | Move to edge to enter new area',
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 20,
      );
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playerPosition, objects, keys, character, onMove, onInteract, onScreenExit, roomDescription]);

  return (
    <div className="flex items-center justify-center bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-700 rounded-lg shadow-2xl"
        style={{imageRendering: 'pixelated'}}
      />
    </div>
  );
};
