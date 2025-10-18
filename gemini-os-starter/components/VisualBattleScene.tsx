/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, {useState, useEffect} from 'react';
import {generateBattleScene, GeneratedImage} from '../services/falService';
import {getCachedImage, cacheImage} from '../utils/imageCache';
import { SpeakableText } from './SpeakableText';

export interface BattleSceneData {
  scene: string;
  imagePrompts: {
    background: string;
    enemy: string;
    character?: string;
  };
  choices: Array<{
    id: string;
    text: string;
    type: string;
    value?: number;
  }>;
}

interface VisualBattleSceneProps {
  sceneData: BattleSceneData | null;
  onChoice: (choiceId: string, choiceType: string, value?: number) => void;
  isLoading: boolean;
  characterClass?: string;
}

export const VisualBattleScene: React.FC<VisualBattleSceneProps> = ({
  sceneData,
  onChoice,
  isLoading,
  characterClass,
}) => {
  const [images, setImages] = useState<{
    background?: string;
    enemy?: string;
    character?: string;
  }>({});
  const [generatingImages, setGeneratingImages] = useState(false);

  // Generate or load cached images when scene data changes
  useEffect(() => {
    console.log('[VisualBattleScene] useEffect triggered. Scene data:', sceneData);

    if (!sceneData?.imagePrompts || !sceneData.imagePrompts.background || !sceneData.imagePrompts.enemy) {
      console.log('[VisualBattleScene] No image prompts found in scene data. Bailing out.');
      return;
    }

    const loadImages = async () => {
      console.log('[VisualBattleScene] loadImages started.');
      setGeneratingImages(true);

      try {
        // Check cache first
        console.log('[VisualBattleScene] Checking for cached images...');
        const backgroundPrompt = sceneData.imagePrompts.background;
        const enemyPrompt = sceneData.imagePrompts.enemy;

        const cachedBg = getCachedImage(backgroundPrompt);
        const cachedEnemy = getCachedImage(enemyPrompt);

        if (cachedBg && cachedEnemy) {
          console.log('[VisualBattleScene] Found cached images. Using them.', { background: cachedBg, enemy: cachedEnemy });
          setImages({
            background: cachedBg,
            enemy: cachedEnemy,
          });
          setGeneratingImages(false);
          return;
        }

        console.log('[VisualBattleScene] No cached images found. Generating new images...');
        // Generate new images
        const result = await generateBattleScene({
          backgroundPrompt: backgroundPrompt,
          enemyPrompt: enemyPrompt,
          characterPrompt: sceneData.imagePrompts.character,
        });

        console.log('[VisualBattleScene] Image generation result:', result);

        if (!result || !result.background || !result.enemy) {
            console.error('[VisualBattleScene] Image generation failed to return expected results.');
            throw new Error('Image generation failed.');
        }

        // Cache the generated images
        console.log('[VisualBattleScene] Caching new images.');
        cacheImage(backgroundPrompt, result.background.url);
        cacheImage(enemyPrompt, result.enemy.url);
        if (result.character && sceneData.imagePrompts.character) {
          cacheImage(sceneData.imagePrompts.character, result.character.url);
        }

        console.log('[VisualBattleScene] Setting images in state.');
        setImages({
          background: result.background.url,
          enemy: result.enemy.url,
          character: result.character?.url,
        });
      } catch (error) {
        console.error('[VisualBattleScene] Failed to generate or load battle scene images:', error);
      } finally {
        console.log('[VisualBattleScene] loadImages finished.');
        setGeneratingImages(false);
      }
    };

    loadImages();
  }, [sceneData]);

  if (isLoading || !sceneData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-purple-500 mb-6 mx-auto"></div>
          <p className="text-purple-300 text-2xl font-bold">Generating scene...</p>
        </div>
      </div>
    );
  }

  if (generatingImages) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-2xl px-8">
          <div className="animate-pulse mb-6">
            <div className="text-6xl mb-4">🎨</div>
            <div className="h-2 bg-purple-600 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 animate-shimmer"></div>
            </div>
          </div>
          <p className="text-purple-300 text-2xl font-bold mb-2">Creating pixel art...</p>
          <p className="text-gray-400 text-sm">This may take 5-10 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Battle Scene Display */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        {images.background && (
          <img
            src={images.background}
            alt="Battle background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{imageRendering: 'pixelated'}}
          />
        )}

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>

        {/* Character and Enemy Sprites */}
        <div className="relative z-10 w-full h-full flex items-center justify-between px-16">
          {/* Player Character (bottom-left) */}
          {characterClass && (
            <div className="flex flex-col items-center mb-16">
              <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg mb-4">
                <p className="text-green-400 font-bold text-lg">{characterClass}</p>
              </div>
              <div className="w-48 h-48 bg-black/30 backdrop-blur-sm rounded-lg border-4 border-green-500 flex items-center justify-center">
                <span className="text-8xl">{getCharacterEmoji(characterClass)}</span>
              </div>
            </div>
          )}

          {/* Enemy Sprite (top-right) */}
          {images.enemy && (
            <div className="flex flex-col items-center mt-16">
              <img
                src={images.enemy}
                alt="Enemy"
                className="w-64 h-64 object-contain drop-shadow-2xl"
                style={{imageRendering: 'pixelated', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))'}}
              />
            </div>
          )}
        </div>
      </div>

      {/* Story Text & Choices - Bottom Panel */}
      <div className="bg-gradient-to-t from-black via-gray-900/95 to-transparent p-8 border-t-4 border-purple-600">
        {/* Scene Description with Voice */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-6 border-2 border-purple-500/50">
            <div className="text-gray-100 text-xl leading-relaxed text-center font-medium">
              <SpeakableText
                text={sceneData.scene}
                characterType="narrator"
                emotion="neutral"
                buttonSize="medium"
                buttonPosition="left"
                style={{ justifyContent: 'center' }}
              >
                {sceneData.scene}
              </SpeakableText>
            </div>
          </div>
        </div>

        {/* Action Choices */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sceneData.choices.map((choice) => {
              const getButtonStyle = () => {
                switch (choice.type) {
                  case 'conclude':
                    return 'bg-purple-600 hover:bg-purple-700 border-purple-400 shadow-purple-500/50';
                  default:
                    return 'bg-gray-600 hover:bg-gray-700 border-gray-400 shadow-gray-500/50';
                }
              };

              return (
                <button
                  key={choice.id}
                  onClick={() => onChoice(choice.id, choice.type, choice.value)}
                  className={`${getButtonStyle()} text-white font-bold px-6 py-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 hover:-translate-y-1 shadow-lg active:scale-95`}
                  disabled={generatingImages}
                >
                  <div className="flex items-center justify-center gap-2">
                    <SpeakableText
                      text={choice.text}
                      characterType={choice.type === 'dialogue' ? 'hero' : choice.type === 'combat' || choice.type === 'damage' ? 'warrior' : 'hero'}
                      emotion={choice.type === 'combat' || choice.type === 'damage' ? 'heroic' : 'neutral'}
                      buttonSize="small"
                      showButton={true}
                      style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                      {choice.text}
                    </SpeakableText>
                  </div>
                  { (choice.type === 'damage' || choice.type === 'combat' || choice.type === 'heal') && choice.value !== undefined && (
                    <span className="block text-sm mt-1 opacity-90">
                      {choice.type === 'damage' || choice.type === 'combat'
                        ? `${choice.value} damage`
                        : `+${choice.value} HP`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get character emoji based on class
function getCharacterEmoji(characterClass: string): string {
  const classMap: Record<string, string> = {
    Warrior: '⚔️',
    Mage: '🔮',
    Thief: '🗡️',
    Cleric: '✝️',
    Ranger: '🏹',
  };
  return classMap[characterClass] || '🧙';
}
