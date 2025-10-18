/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, {useCallback, useEffect, useState} from 'react';
import {AnimationOverlay} from './components/AnimationOverlay';
import {CharacterSelection} from './components/CharacterSelection';
import {VisualBattleScene, BattleSceneData} from './components/VisualBattleScene';
import {BattleUI} from './components/BattleUI';
import {GameCanvas} from './components/GameCanvas';
import {GameHUD} from './components/GameHUD';
import {Window} from './components/Window';
import {CHARACTER_CLASSES, CharacterClass} from './characterClasses';
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
  BattleState
} from './types';

const App: React.FC = () => {
  // Game state with pixel art battles
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
    battleState: null,
  });

  const [sceneData, setSceneData] = useState<BattleSceneData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<InteractionData[]>([]);
  const [currentMaxHistoryLength] = useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [showAIDialog, setShowAIDialog] = useState<boolean>(false);
  const [currentInteractingObject, setCurrentInteractingObject] = useState<GameObject | null>(null);

  // Handle character selection
  const handleCharacterSelect = useCallback((character: CharacterClass) => {
    // Generate initial room
    const initialRoom = generateRoom('room_0', gameState.storySeed, 0);
    const rooms = new Map<string, Room>();
    rooms.set('room_0', initialRoom);

    // Set player spawn position from tile map
    const spawnPosition = initialRoom.tileMap?.spawnPoint || {x: 400, y: 300};

    setGameState((prev) => ({
      ...prev,
      selectedCharacter: character,
      currentHP: character.startingHP,
      isInGame: true,
      rooms,
      playerPosition: spawnPosition,
      battleState: null,
    }));
  }, [gameState.storySeed]);

  // Handle player movement
  const handlePlayerMove = useCallback((newPosition: Position) => {
    setGameState((prev) => ({...prev, playerPosition: newPosition}));
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

        // Use spawn point from new room
        const newPosition = newRoom.tileMap?.spawnPoint || {x: 400, y: 300};

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

  const internalHandleLlmRequest = useCallback(
    async (historyForLlm: InteractionData[], maxHistoryLength: number, updatedHP?: number) => {
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
          updatedHP ?? gameState.currentHP, // Use updatedHP if provided
          gameState.storySeed,
        );
        for await (const chunk of stream) {
          accumulatedContent += chunk;
        }

        // Parse JSON response
        try {
          // Remove markdown code blocks if present
          let jsonText = accumulatedContent.trim();
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
          }

          const parsedScene: BattleSceneData = JSON.parse(jsonText);

          // Validate that required fields exist
          if (!parsedScene.scene || !parsedScene.imagePrompts || !parsedScene.choices) {
            throw new Error('Missing required fields in AI response');
          }

          setSceneData(parsedScene);
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError);
          console.log('Raw content:', accumulatedContent);
          setError('Failed to parse scene data. The AI response was not valid JSON.');
        }
      } catch (e: any) {
        setError('Failed to stream content from the API.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [gameState.selectedCharacter, gameState.currentHP, gameState.storySeed],
  );

  // Handle object interaction
  const handleObjectInteract = useCallback(
    (object: GameObject) => {
      if (object.type === 'enemy') {
        // Start a battle
        setGameState(prev => ({
          ...prev,
          battleState: {
            enemy: object,
            enemyHP: 100,
            maxEnemyHP: 100,
            status: 'ongoing',
            turn: 'player',
            history: [],
            animationQueue: [],
          }
        }));
      } else {
        // Handle other interactions (NPCs, items)
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
        setSceneData(null);
        setError(null);
        setShowAIDialog(true);

        internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
      }
    },
    [interactionHistory, currentMaxHistoryLength, internalHandleLlmRequest],
  );

  const handleCombatChoice = useCallback(
    async (choiceId: string, choiceType: string, value?: number) => {
      // Check for conclude action - close dialog and return to exploration
      if (choiceType === 'conclude') {
        setShowAIDialog(false);
        setSceneData(null);
        setCurrentInteractingObject(null);
        return;
      }

      // Check for death
      if (choiceType === 'death' || choiceId === 'player_death') {
        setGameState((prev) => ({...prev, isAlive: false}));
        setShowAIDialog(false);
        return;
      }

      let newHP = gameState.currentHP;

      // Handle animations and HP changes based on choice type
      if (choiceType === 'combat' || choiceType === 'damage') {
        const damage = value || 10;
        newHP = Math.max(0, gameState.currentHP - damage);
        setGameState((prev) => ({
          ...prev,
          currentHP: newHP,
          currentAnimation: {
            type: 'damage',
            value: damage,
            text: `Took ${damage} damage!`,
            timestamp: Date.now(),
          },
          isAlive: newHP > 0,
        }));
      } else if (choiceType === 'heal') {
        const healAmount = value || 15;
        const maxHP = gameState.selectedCharacter?.startingHP || 100;
        newHP = Math.min(maxHP, gameState.currentHP + healAmount);
        setGameState((prev) => ({
          ...prev,
          currentHP: newHP,
          currentAnimation: {
            type: 'heal',
            value: healAmount,
            text: `Healed ${healAmount} HP!`,
            timestamp: Date.now(),
          },
        }));
      } else if (choiceType === 'loot') {
        setGameState((prev) => ({
          ...prev,
          currentAnimation: {
            type: 'loot',
            text: 'Found loot!',
            timestamp: Date.now(),
          },
        }));
      } else if (choiceType === 'dialogue') {
        setGameState((prev) => ({
          ...prev,
          currentAnimation: {
            type: 'dialogue',
            text: 'Talking...',
            timestamp: Date.now(),
          },
        }));
      }

      // Create interaction data for history
      const interactionData: InteractionData = {
        id: choiceId,
        type: choiceType,
        elementText: sceneData?.choices.find((c) => c.id === choiceId)?.text || '',
        elementType: 'choice_button',
        appContext: 'roguelike_game',
        value: value?.toString(),
      };

      const newHistory = [
        interactionData,
        ...interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      setInteractionHistory(newHistory);
      setSceneData(null);
      setError(null);

      // Call LLM with the updated HP value
      internalHandleLlmRequest(newHistory, currentMaxHistoryLength, newHP);
    },
    [interactionHistory, currentMaxHistoryLength, internalHandleLlmRequest, sceneData, gameState.currentHP, gameState.selectedCharacter],
  );

  const handleBattleAction = useCallback((action: string) => {
    if (!gameState.battleState || gameState.battleState.turn !== 'player') return;

    const playerDamage = 25; // Hardcoded for now

    // Player's turn
    if (action === 'attack') {
      const newEnemyHP = Math.max(0, gameState.battleState.enemyHP - playerDamage);
      const playerAnimations: BattleAnimation[] = [
        { type: 'slash', target: 'enemy', timestamp: Date.now() },
        { type: 'damageNumber', target: 'enemy', value: playerDamage, timestamp: Date.now() },
      ];

      const newBattleState: BattleState = {
        ...gameState.battleState,
        enemyHP: newEnemyHP,
        status: newEnemyHP <= 0 ? 'player_won' : 'ongoing',
        turn: 'enemy',
        animationQueue: [...gameState.battleState.animationQueue, ...playerAnimations],
      };

      setGameState(prev => ({ ...prev, battleState: newBattleState }));

      // Enemy's turn (after a delay)
      if (newEnemyHP > 0) {
        setTimeout(() => {
          const enemyDamage = 15; // Hardcoded for now
          const newPlayerHP = Math.max(0, gameState.currentHP - enemyDamage);
          const enemyAnimations: BattleAnimation[] = [
            { type: 'slash', target: 'player', timestamp: Date.now() },
            { type: 'damageNumber', target: 'player', value: enemyDamage, timestamp: Date.now() },
          ];

          setGameState(prev => ({
            ...prev,
            currentHP: newPlayerHP,
            battleState: {
              ...newBattleState,
              status: newPlayerHP <= 0 ? 'player_lost' : 'ongoing',
              turn: 'player',
              animationQueue: [...newBattleState.animationQueue, ...enemyAnimations],
            },
            currentAnimation: {
              type: 'damage',
              value: enemyDamage,
              text: `Took ${enemyDamage} damage!`,
              timestamp: Date.now(),
            },
          }));
        }, 1000);
      }
    }
  }, [gameState.battleState, gameState.currentHP]);

  // Effect to clear animation queue after processing
  useEffect(() => {
    if (gameState.battleState?.animationQueue && gameState.battleState.animationQueue.length > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          if (!prev.battleState) return prev;
          return {
            ...prev,
            battleState: {
              ...prev.battleState,
              animationQueue: [],
            },
          };
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gameState.battleState?.animationQueue]);

  const handleBattleEnd = useCallback(() => {
    if (!gameState.battleState) return;

    const updatedRooms = new Map(gameState.rooms);
    const currentRoom = updatedRooms.get(gameState.currentRoomId);

    if (currentRoom && gameState.battleState.status === 'player_won') {
      // Remove defeated enemy from the room
      const newObjects = currentRoom.objects.filter(
        (obj) => obj.id !== gameState.battleState?.enemy.id
      );
      const updatedRoom = { ...currentRoom, objects: newObjects };
      updatedRooms.set(gameState.currentRoomId, updatedRoom);
    }

    setGameState(prev => ({
      ...prev,
      battleState: null,
      rooms: updatedRooms,
    }));
  }, [gameState.battleState, gameState.rooms, gameState.currentRoomId]);

  // Clear animation
  const handleAnimationComplete = useCallback(() => {
    setGameState((prev) => ({...prev, currentAnimation: null}));
  }, []);

  // Close AI dialog
  const handleCloseAIDialog = useCallback(() => {
    setShowAIDialog(false);
    setSceneData(null);
    setCurrentInteractingObject(null);
  }, []);

  // Restart game
  const handleRestart = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    setGameState({
      selectedCharacter: null,
      currentHP: 0,
      isAlive: true,
      storySeed: newSeed,
      isInGame: false,
      playerPosition: {x: 400, y: 300},
      currentRoomId: 'room_0',
      rooms: new Map(),
      roomCounter: 0,
      currentAnimation: null,
      battleState: null,
    });
    setSceneData(null);
    setError(null);
    setInteractionHistory([]);
    setShowAIDialog(false);
    setCurrentInteractingObject(null);
  }, []);

  // Get current room
  const currentRoom = gameState.rooms.get(gameState.currentRoomId);

  return (
    <div className="bg-gray-900 w-screen h-screen overflow-hidden">
      <AnimationOverlay
        animation={gameState.currentAnimation}
        onComplete={handleAnimationComplete}
      />
      <Window title="Roguelike Adventure">
        <div className="w-full h-full" style={{backgroundColor: '#1a1a2e'}}>
          {!gameState.selectedCharacter ? (
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
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105"
              >
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
                    currentHP={gameState.currentHP}
                    playerPosition={gameState.playerPosition}
                    objects={currentRoom.objects}
                    onMove={handlePlayerMove}
                    onInteract={handleObjectInteract}
                    onScreenExit={handleScreenExit}
                    onBattleEnd={handleBattleEnd}
                    roomDescription={currentRoom.description}
                    room={currentRoom}
                    battleState={gameState.battleState}
                  />
                )}

                <BattleUI battleState={gameState.battleState} onPlayerAction={handleBattleAction} />

                {/* Visual Battle Scene Overlay */}
                {showAIDialog && (
                  <div className="absolute inset-0 z-10">
                    {error ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/90">
                        <div className="bg-red-900/80 p-8 rounded-lg border-4 border-red-500 max-w-lg">
                          <h2 className="text-2xl font-bold text-red-200 mb-4">Error</h2>
                          <p className="text-red-100 mb-4">{error}</p>
                          <button
                            onClick={handleCloseAIDialog}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ) : (
                      <VisualBattleScene
                        sceneData={sceneData}
                        onChoice={handleCombatChoice}
                        isLoading={isLoading}
                        characterClass={gameState.selectedCharacter?.name}
                      />
                    )}
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
