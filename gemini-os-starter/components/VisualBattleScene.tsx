/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, {useState, useEffect} from 'react';
import {generateBattleScene, GeneratedImage} from '../services/falService';
import {getCachedImage, cacheImage} from '../utils/imageCache';
import {composeInteractionScene} from '../services/sceneComposer';

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
  characterSprite?: string;
  enemySprite?: string;
  biome?: string;
  interactionContext?: string;
}

interface VisualBattleSceneProps {
  sceneData: BattleSceneData | null;
  onChoice: (choiceId: string, choiceType: string, value?: number) => void;
  isLoading: boolean;
  characterClass?: string;
  characterSprite?: string;
}

export const VisualBattleScene: React.FC<VisualBattleSceneProps> = ({
  sceneData,
  onChoice,
  isLoading,
  characterClass,
  characterSprite,
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

    if (!sceneData) {
      return;
    }

    const hasImagePrompts = sceneData.imagePrompts?.background && sceneData.imagePrompts?.enemy;
    const hasSprites = sceneData.characterSprite && sceneData.enemySprite && sceneData.biome;

    if (!hasImagePrompts && !hasSprites) {
      console.log('[VisualBattleScene] No image prompts or sprites available.');
      return;
    }

    const loadImages = async () => {
      console.log('[VisualBattleScene] loadImages started.');
      setGeneratingImages(true);

      try {
        if (hasSprites) {
          console.log('[VisualBattleScene] Composing scene with sprites...');
          console.log('[VisualBattleScene] Scene context:', sceneData.interactionContext);
          
          const sceneContext = sceneData.interactionContext || 'meeting';
          const contextHash = sceneContext.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0).toString(36);
          const cacheKey = `composed_${sceneData.characterSprite}_${sceneData.enemySprite}_${contextHash}`;
          const cachedComposed = getCachedImage(cacheKey);
          
          if (cachedComposed) {
            console.log('[VisualBattleScene] Found cached composed scene');
            setImages({
              background: cachedComposed,
            });
            setGeneratingImages(false);
            return;
          }

          const composedScene = await composeInteractionScene(
            sceneData.characterSprite!,
            sceneData.enemySprite!,
            sceneData.biome!,
            sceneContext
          );

          console.log('[VisualBattleScene] Scene composed successfully');
          cacheImage(cacheKey, composedScene.url);

          setImages({
            background: composedScene.url,
          });
        } else if (hasImagePrompts) {
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

          console.log('[VisualBattleScene] No cached images found. Generating...');
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

          cacheImage(backgroundPrompt, result.background.url);
          cacheImage(enemyPrompt, result.enemy.url);
          if (result.character && sceneData.imagePrompts.character) {
            cacheImage(sceneData.imagePrompts.character, result.character.url);
          }

          setImages({
            background: result.background.url,
            enemy: result.enemy.url,
            character: result.character?.url,
          });
        }
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
      </div>

      {/* Story Text & Choices - Bottom Panel */}
      <div className="bg-gradient-to-t from-black via-gray-900/95 to-transparent p-8 border-t-4 border-purple-600">
        {/* Scene Description */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-6 border-2 border-purple-500/50">
            <p className="text-gray-100 text-xl leading-relaxed text-center font-medium">
              {sceneData.scene}
            </p>
          </div>
        </div>

        {/* Action Choices */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
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
                  className={`${getButtonStyle()} text-white font-bold px-6 py-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 hover:-translate-y-1 shadow-lg active:scale-95 min-w-[160px]`}
                  disabled={generatingImages}
                >
                  <span className="block text-center">{choice.text}</span>
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
