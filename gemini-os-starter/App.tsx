/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useState} from 'react';
import {AnimationOverlay} from './components/AnimationOverlay';
import {CharacterSelection} from './components/CharacterSelection';
import {GameCanvas} from './components/GameCanvas';
import {GameHUD} from './components/GameHUD';
import {GeneratedContent} from './components/GeneratedContent';
import {Window} from './components/Window';
import {CHARACTER_CLASSES} from './characterClasses';
import {INITIAL_MAX_HISTORY_LENGTH} from './constants';
import {streamAppContent} from './services/geminiService';
import {generateRoom} from './services/roomGenerator';
import {
  GameState,
  InteractionData,
  Position,
  GameObject,
  Room,
  GameAnimation,
} from './types';
import {CharacterClass} from './characterClasses';

const App: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    selectedCharacter: null,
    currentHP: 0,
    isAlive: true,
    storySeed: Math.floor(Math.random() * 10000),
    isInGame: false,
    playerPosition: {x: 400, y: 300},
    currentRoomId: 'room_0',
    rooms: new Map(),
    roomCounter: 0,
    currentAnimation: null,
  });

  const [llmContent, setLlmContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<
    InteractionData[]
  >([]);
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] =
    useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [showAIDialog, setShowAIDialog] = useState<boolean>(false);
  const [currentInteractingObject, setCurrentInteractingObject] =
    useState<GameObject | null>(null);

  const internalHandleLlmRequest = useCallback(
    async (historyForLlm: InteractionData[], maxHistoryLength: number) => {
      if (historyForLlm.length === 0) {
        setError('No interaction data to process.');
        return;
      }

      setIsLoading(true);
      setError(null);

      let accumulatedContent = '';

      try {
        const stream = streamAppContent(
          historyForLlm,
          maxHistoryLength,
          gameState.selectedCharacter?.name,
          gameState.currentHP,
          gameState.storySeed,
        );
        for await (const chunk of stream) {
          accumulatedContent += chunk;
          setLlmContent((prev) => prev + chunk);
        }
      } catch (e: any) {
        setError('Failed to stream content from the API.');
        console.error(e);
        accumulatedContent = `<div class="p-4 text-red-600 bg-red-100 rounded-md">Error loading content.</div>`;
        setLlmContent(accumulatedContent);
      } finally {
        setIsLoading(false);
      }
    },
    [gameState.selectedCharacter, gameState.currentHP, gameState.storySeed],
  );

  // Handle character selection
  const handleCharacterSelect = useCallback(
    (character: CharacterClass) => {
      const storySeed = Math.floor(Math.random() * 10000);

      // Generate first room
      const firstRoom = generateRoom('room_0', storySeed, 0);
      const roomsMap = new Map<string, Room>();
      roomsMap.set('room_0', firstRoom);

      const newGameState: GameState = {
        selectedCharacter: character,
        currentHP: character.startingHP,
        isAlive: true,
        storySeed,
        isInGame: true,
        playerPosition: {x: 100, y: 300}, // Start on left side
        currentRoomId: 'room_0',
        rooms: roomsMap,
        roomCounter: 0,
      };
      setGameState(newGameState);
      setInteractionHistory([]);
      setLlmContent('');
      setError(null);
      setShowAIDialog(false);
    },
    [],
  );

  // Handle player movement
  const handlePlayerMove = useCallback((newPosition: Position) => {
    setGameState((prev) => ({
      ...prev,
      playerPosition: newPosition,
    }));
  }, []);

  // Handle screen exit (moving to edge)
  const handleScreenExit = useCallback(
    (direction: 'right' | 'left' | 'up' | 'down') => {
      setGameState((prev) => {
        const newRoomCounter = prev.roomCounter + 1;
        const newRoomId = `room_${newRoomCounter}`;

        // Generate new room
        const newRoom = generateRoom(
          newRoomId,
          prev.storySeed,
          newRoomCounter,
        );

        const newRooms = new Map(prev.rooms);
        newRooms.set(newRoomId, newRoom);

        // Set new player position based on exit direction
        let newPosition: Position;
        switch (direction) {
          case 'right':
            newPosition = {x: 100, y: 300}; // Enter from left
            break;
          case 'left':
            newPosition = {x: 700, y: 300}; // Enter from right
            break;
          case 'up':
            newPosition = {x: 400, y: 550}; // Enter from bottom
            break;
          case 'down':
            newPosition = {x: 400, y: 50}; // Enter from top
            break;
        }

        return {
          ...prev,
          currentRoomId: newRoomId,
          playerPosition: newPosition,
          rooms: newRooms,
          roomCounter: newRoomCounter,
        };
      });
    },
    [],
  );

  // Handle object interaction
  const handleObjectInteract = useCallback(
    (object: GameObject) => {
      setCurrentInteractingObject(object);

      // Mark object as interacted
      setGameState((prev) => {
        const room = prev.rooms.get(prev.currentRoomId);
        if (!room) return prev;

        const updatedObjects = room.objects.map((obj) =>
          obj.id === object.id ? {...obj, hasInteracted: true} : obj,
        );

        const updatedRoom = {...room, objects: updatedObjects};
        const newRooms = new Map(prev.rooms);
        newRooms.set(prev.currentRoomId, updatedRoom);

        return {...prev, rooms: newRooms};
      });

      // Create interaction data for AI
      const interactionData: InteractionData = {
        id: object.id,
        type: object.type,
        elementText: `${object.interactionText} (${object.sprite})`,
        elementType: 'game_object',
        appContext: 'roguelike_game',
      };

      const newHistory = [
        interactionData,
        ...interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      setInteractionHistory(newHistory);
      setLlmContent('');
      setError(null);
      setShowAIDialog(true);

      internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
    },
    [interactionHistory, currentMaxHistoryLength, internalHandleLlmRequest],
  );

  // Handle AI dialog interaction (choice buttons in AI response)
  const handleAIDialogInteraction = useCallback(
    async (interactionData: InteractionData) => {
      // Check for death
      if (
        interactionData.id === 'player_death' ||
        interactionData.type === 'death'
      ) {
        setGameState((prev) => ({...prev, isAlive: false}));
        setShowAIDialog(false);
        return;
      }

      // Check for conclude action - close dialog and return to exploration
      if (interactionData.type === 'conclude') {
        setShowAIDialog(false);
        setLlmContent('');
        setCurrentInteractingObject(null);
        return;
      }

      // Handle animations based on interaction type
      const damageValue = interactionData.value
        ? parseInt(interactionData.value)
        : undefined;

      if (
        interactionData.type === 'combat' ||
        interactionData.type === 'damage'
      ) {
        const damage = damageValue || 10;
        setGameState((prev) => {
          const newHP = Math.max(0, prev.currentHP - damage);
          return {
            ...prev,
            currentHP: newHP,
            currentAnimation: {
              type: 'damage',
              value: damage,
              text: interactionData.elementText,
              timestamp: Date.now(),
            },
            isAlive: newHP > 0,
          };
        });
      } else if (interactionData.type === 'heal') {
        const healAmount = damageValue || 15;
        setGameState((prev) => {
          const maxHP = prev.selectedCharacter?.startingHP || 100;
          const newHP = Math.min(maxHP, prev.currentHP + healAmount);
          return {
            ...prev,
            currentHP: newHP,
            currentAnimation: {
              type: 'heal',
              value: healAmount,
              text: interactionData.elementText,
              timestamp: Date.now(),
            },
          };
        });
      } else if (interactionData.type === 'loot') {
        setGameState((prev) => ({
          ...prev,
          currentAnimation: {
            type: 'loot',
            text: interactionData.elementText,
            timestamp: Date.now(),
          },
        }));
      } else if (interactionData.type === 'dialogue') {
        setGameState((prev) => ({
          ...prev,
          currentAnimation: {
            type: 'dialogue',
            text: interactionData.elementText,
            timestamp: Date.now(),
          },
        }));
      }

      const newHistory = [
        interactionData,
        ...interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      setInteractionHistory(newHistory);

      setLlmContent('');
      setError(null);

      internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
    },
    [interactionHistory, internalHandleLlmRequest, currentMaxHistoryLength],
  );

  // Close AI dialog
  const handleCloseAIDialog = useCallback(() => {
    setShowAIDialog(false);
    setLlmContent('');
    setCurrentInteractingObject(null);
  }, []);

  // Clear animation
  const handleAnimationComplete = useCallback(() => {
    setGameState((prev) => ({...prev, currentAnimation: null}));
  }, []);

  // Handle game restart after death
  const handleRestart = useCallback(() => {
    setGameState({
      selectedCharacter: null,
      currentHP: 0,
      isAlive: true,
      storySeed: Math.floor(Math.random() * 10000),
      isInGame: false,
      playerPosition: {x: 400, y: 300},
      currentRoomId: 'room_0',
      rooms: new Map(),
      roomCounter: 0,
      currentAnimation: null,
    });
    setLlmContent('');
    setError(null);
    setInteractionHistory([]);
    setShowAIDialog(false);
    setCurrentInteractingObject(null);
  }, []);

  // Get current room
  const currentRoom = gameState.rooms.get(gameState.currentRoomId);

  const windowTitle = gameState.isInGame
    ? `${gameState.selectedCharacter?.name}'s Adventure`
    : 'Roguelike RPG';
  const contentBgColor = '#1f2937';

  return (
    <div className="bg-gray-900 w-full min-h-screen flex items-center justify-center p-4">
      <AnimationOverlay
        animation={gameState.currentAnimation}
        onComplete={handleAnimationComplete}
      />
      <Window
        title={windowTitle}
        onClose={handleRestart}
        isAppOpen={gameState.isInGame}
        appId="roguelike_game"
        onToggleParameters={() => {}}
        onExitToDesktop={handleRestart}
        isParametersPanelOpen={false}>
        <div
          className="w-full h-full flex flex-col"
          style={{backgroundColor: contentBgColor}}>
          {!gameState.isInGame ? (
            <CharacterSelection
              characters={CHARACTER_CLASSES}
              onSelectCharacter={handleCharacterSelect}
            />
          ) : !gameState.isAlive ? (
            <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-red-900 to-black">
              <div className="text-8xl mb-6">💀</div>
              <h1 className="text-5xl font-bold text-red-400 mb-4">
                Game Over
              </h1>
              <p className="text-xl text-gray-300 mb-8 text-center max-w-md">
                Your journey has come to an end. But every death brings a new
                story...
              </p>
              <button
                onClick={handleRestart}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105">
                Begin a New Adventure
              </button>
            </div>
          ) : (
            <>
              {gameState.selectedCharacter && (
                <GameHUD
                  character={gameState.selectedCharacter}
                  currentHP={gameState.currentHP}
                />
              )}
              <div className="flex-1 overflow-hidden bg-gray-900 relative">
                {currentRoom && gameState.selectedCharacter && (
                  <GameCanvas
                    character={gameState.selectedCharacter}
                    playerPosition={gameState.playerPosition}
                    objects={currentRoom.objects}
                    onMove={handlePlayerMove}
                    onInteract={handleObjectInteract}
                    onScreenExit={handleScreenExit}
                    roomDescription={currentRoom.description}
                  />
                )}

                {/* AI Dialog Overlay */}
                {showAIDialog && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8 z-10">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80%] overflow-y-auto border-4 border-blue-500 shadow-2xl">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">
                          {currentInteractingObject?.sprite}{' '}
                          {currentInteractingObject?.interactionText}
                        </h3>
                        <button
                          onClick={handleCloseAIDialog}
                          className="text-white hover:text-red-400 font-bold text-2xl">
                          ✕
                        </button>
                      </div>
                      <div className="p-6">
                        {isLoading && llmContent.length === 0 && (
                          <div className="flex flex-col justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                            <p className="text-gray-400">
                              Generating story...
                            </p>
                          </div>
                        )}
                        {error && (
                          <div className="p-4 text-red-300 bg-red-900/50 rounded-md border border-red-700">
                            {error}
                          </div>
                        )}
                        {(!isLoading || llmContent) && (
                          <GeneratedContent
                            htmlContent={llmContent}
                            onInteract={handleAIDialogInteraction}
                            appContext="roguelike_game"
                            isLoading={isLoading}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Window>
    </div>
  );
};

export default App;
