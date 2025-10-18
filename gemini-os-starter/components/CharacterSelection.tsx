/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, { useEffect, useState } from 'react';
import {CharacterClass} from '../characterClasses';
import { generateCharacterSprite } from '../services/spriteGenerator';

interface CharacterSelectionProps {
  characters: CharacterClass[];
  onSelectCharacter: (character: CharacterClass) => void;
  isStartingGame?: boolean;
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  characters,
  onSelectCharacter,
  isStartingGame = false,
  onLoadingStateChange,
}) => {
  const [enhancedCharacters, setEnhancedCharacters] = useState<CharacterClass[]>(characters);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const enhanceCharacters = async () => {
      onLoadingStateChange?.(true);
      const enhanced = await Promise.all(
        characters.map(async (char) => {
          const sprite = await generateCharacterSprite(
            char.name,
            char.description,
            char.icon,
            undefined
          );
          return {
            ...char,
            spriteUrl: sprite.url || undefined
          };
        })
      );
      setEnhancedCharacters(enhanced);
      setIsLoading(false);
      onLoadingStateChange?.(false);
    };

    enhanceCharacters();
  }, [characters, onLoadingStateChange]);

  if (isLoading || isStartingGame) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-full p-8"
        style={{
          backgroundColor: '#2d5a4e',
          fontFamily: 'monospace'
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <p style={{ color: '#f4e8d0', fontSize: '18px' }}>
            {isStartingGame ? 'Starting your adventure...' : 'Generating character sprites...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full p-8"
      style={{
        backgroundColor: '#2d5a4e',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
        fontFamily: 'monospace'
      }}
    >
      <div className="max-w-6xl w-full">
        {/* Title Box */}
        <div
          className="mb-8 p-8 text-center relative"
          style={{
            backgroundColor: '#f4e8d0',
            border: '8px solid #3d2817',
            boxShadow: '0 10px 0 #3d2817, inset 0 6px 0 #fff9e8',
            borderRadius: '4px'
          }}
        >
          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '4px solid #8b6f47', borderLeft: '4px solid #8b6f47' }}></div>
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '4px solid #8b6f47', borderRight: '4px solid #8b6f47' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '4px solid #8b6f47', borderLeft: '4px solid #8b6f47' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '4px solid #8b6f47', borderRight: '4px solid #8b6f47' }}></div>

          <div style={{ fontSize: '14px', color: '#8b6f47', marginBottom: '8px' }}>✦ ✦ ✦</div>
          <h1
            style={{
              color: '#5c3d2e',
              textShadow: '4px 4px 0px #d4a574',
              letterSpacing: '3px',
              fontSize: '42px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}
          >
            CHOOSE YOUR HERO
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div style={{ width: '60px', height: '4px', backgroundColor: '#8b6f47', borderRadius: '2px' }}></div>
            <span style={{ color: '#8b6f47', fontSize: '18px' }}>★</span>
            <div style={{ width: '60px', height: '4px', backgroundColor: '#8b6f47', borderRadius: '2px' }}></div>
          </div>
        </div>

        {/* Subtitle Box */}
        <div
          className="mb-8 p-5"
          style={{
            backgroundColor: '#c9b896',
            border: '5px solid #8b6f47',
            boxShadow: 'inset 0 3px 0 #e8d4b0',
            borderRadius: '4px'
          }}
        >
          <p style={{ color: '#3d2817', fontSize: '14px', lineHeight: '1.8', textAlign: 'center', fontWeight: '500' }}>
            ⚔️ Select a character class to begin your adventure<br/>
            Each class has unique abilities and playstyles
          </p>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {enhancedCharacters.map((character) => (
            <div
              key={character.id}
              onClick={() => onSelectCharacter(character)}
              className="cursor-pointer transition-all hover:scale-105"
              style={{
                backgroundColor: '#f4e8d0',
                border: '6px solid #3d2817',
                boxShadow: '0 8px 0 #3d2817',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 0 #3d2817';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 0 #3d2817';
              }}
            >
              <div className="p-6 text-center">
                {/* Character Icon or Sprite */}
                <div
                  className="mb-4 flex justify-center items-center"
                  style={{
                    height: '120px',
                    filter: 'drop-shadow(3px 3px 0px rgba(61,40,23,0.3))'
                  }}
                >
                  {character.spriteUrl ? (
                    <img 
                      src={character.spriteUrl} 
                      alt={character.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'contain',
                        imageRendering: 'pixelated'
                      }}
                    />
                  ) : (
                    <div className="text-7xl">{character.icon}</div>
                  )}
                </div>

                {/* Character Name */}
                <h2
                  className="mb-3"
                  style={{
                    color: '#5c3d2e',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    textShadow: '2px 2px 0px #d4a574'
                  }}
                >
                  {character.name}
                </h2>

                {/* Description */}
                <p
                  className="mb-4"
                  style={{
                    color: '#3d2817',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    minHeight: '60px'
                  }}
                >
                  {character.description}
                </p>

                {/* Stats Box */}
                <div
                  className="space-y-2"
                  style={{
                    backgroundColor: '#c9b896',
                    border: '4px solid #8b6f47',
                    borderRadius: '4px',
                    padding: '12px',
                    boxShadow: 'inset 0 2px 0 #e8d4b0'
                  }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#5c3d2e', fontWeight: 'bold' }}>❤️ Health:</span>
                    <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      {character.startingHP} HP
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#5c3d2e', fontWeight: 'bold' }}>⚔️ Attack:</span>
                    <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {character.attackType}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#5c3d2e', fontWeight: 'bold' }}>✨ Special:</span>
                    <span style={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                      {character.specialAbility.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div
          className="p-4 text-center"
          style={{
            backgroundColor: '#3d2817',
            border: '4px solid #5c3d2e',
            borderRadius: '4px',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.1)'
          }}
        >
          <p style={{ color: '#d4a574', fontSize: '12px', fontStyle: 'italic' }}>
            💀 Death is permanent, but the story changes every time
          </p>
        </div>
      </div>
    </div>
  );
};
