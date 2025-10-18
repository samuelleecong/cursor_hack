/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, { useCallback, useEffect, useState } from 'react';
import { CHARACTER_CLASSES, CharacterClass } from './characterClasses';
import { AnimationOverlay } from './components/AnimationOverlay';
import { AudioManager } from './components/AudioManager';
import { BattleUI } from './components/BattleUI';
import { CharacterSelection } from './components/CharacterSelection';
import { ClassGenerationLoading } from './components/ClassGenerationLoading';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { StoryInput } from './components/StoryInput';
import { BattleSceneData, VisualBattleScene } from './components/VisualBattleScene';
import { Window } from './components/Window';
import { INITIAL_MAX_HISTORY_LENGTH } from './constants';
import { generateCharacterClasses } from './services/classGenerator';
import { streamAppContent } from './services/geminiService';
import { generateRoom } from './services/roomGenerator';
import { generateRoomPair } from './services/roomPairGenerator';
import {
  BattleAnimation,
  BattleState,
  GameObject,
  GameState,
  InteractionData,
  Position,
  Room
} from './types';
// Voice speech components
import { SpeakableText, DialogueBox, NPCInteraction } from './components/SpeakableText';
import { VoiceControls } from './components/VoiceControls';
import { SpeechButton } from './components/SpeechButton';

// Track rooms currently being generated to prevent duplicate calls
const generatingRooms = new Set<string>();

// Utility Functions
const calculateDamage = (
  baseDamage: number,
  critChance: number,
  enemyDefense: number = 0
): { damage: number; isCrit: boolean } => {
  const isCrit = Math.random() < critChance;
  const rawDamage = baseDamage - enemyDefense;
  const finalDamage = isCrit ? Math.floor(rawDamage * 1.5) : rawDamage;
  return { damage: Math.max(1, finalDamage), isCrit };
};

const calculateExperienceGain = (enemyLevel: number, playerLevel: number): number => {
  const baseXP = 50;
  const levelDiff = Math.max(0, enemyLevel - playerLevel);
  return baseXP + (levelDiff * 20);
};

const calculateLevelUp = (currentLevel: number): number => {
  return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
};

const App: React.FC = () => {
  // Track whether to show story input screen
  const [showStoryInput, setShowStoryInput] = useState<boolean>(true);
  const [isGeneratingClasses, setIsGeneratingClasses] = useState<boolean>(false);
  const [availableClasses, setAvailableClasses] = useState<CharacterClass[]>(CHARACTER_CLASSES);

  // Game state with pixel art battles
  const [gameState, setGameState] = useState<GameState>({
    selectedCharacter: null,
    currentHP: 0,
    maxHP: 0,
    currentMana: 0,
    maxMana: 0,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    isAlive: true,
    storySeed: Math.floor(Math.random() * 10000),
    storyContext: null,
    storyMode: 'inspiration',
    isInGame: false,
    playerPosition: {x: 400, y: 300},
    currentRoomId: 'room_0',
    rooms: new Map(),
    roomCounter: 0,
    currentAnimation: null,
    battleState: null,
    inventory: [],
    storyConsequences: [],
  });

  const [sceneData, setSceneData] = useState<BattleSceneData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<InteractionData[]>([]);
  const [currentMaxHistoryLength] = useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [showAIDialog, setShowAIDialog] = useState<boolean>(false);
  const [currentInteractingObject, setCurrentInteractingObject] = useState<GameObject | null>(null);

  // Handle story input submission
  const handleStorySubmit = useCallback(async (story: string | null, mode: 'inspiration' | 'recreation' | 'continuation') => {
    setGameState((prev) => ({
      ...prev,
      storyContext: story,
      storyMode: mode,
    }));
    setShowStoryInput(false);

    // Generate character classes based on story and mode
    setIsGeneratingClasses(true);
    try {
      const generatedClasses = await generateCharacterClasses(story, mode);
      setAvailableClasses(generatedClasses);
    } catch (error) {
      console.error('Failed to generate classes:', error);
      setAvailableClasses(CHARACTER_CLASSES); // Fallback to defaults
    } finally {
      setIsGeneratingClasses(false);
    }
  }, []);

  // Handle character selection
  const handleCharacterSelect = useCallback(async (character: CharacterClass) => {
    try {
      setIsLoading(true);
      console.log('[App] Generating initial room pair (0 + 1)...');

      // Generate room 0 and room 1 together with panorama scene
      const { currentRoom: room0, nextRoom: room1 } = await generateRoomPair(
        'room_0',
        'room_1',
        gameState.storySeed,
        0,
        1,
        gameState.storyContext,
        gameState.storyMode
      );

      console.log('[App] Room pair generated, room0 has scene:', !!room0.sceneImage);
      console.log('[App] Room pair generated, room1 has scene:', !!room1.sceneImage);

      const rooms = new Map<string, Room>();
      rooms.set('room_0', room0);
      rooms.set('room_1', room1);

      // Set player spawn position from tile map
      const spawnPosition = room0.tileMap?.spawnPoint || {x: 400, y: 300};

      setGameState((prev) => ({
        ...prev,
        selectedCharacter: character,
        currentHP: character.startingHP,
        maxHP: character.startingHP,
        currentMana: character.startingMana,
        maxMana: character.startingMana,
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        isInGame: true,
        rooms,
        playerPosition: spawnPosition,
        battleState: null,
        inventory: [],
        storyConsequences: [],
        previousRoomId: undefined,
      }));

      console.log('[App] Initial room pair (0 + 1) generated successfully, game starting!');
    } catch (error) {
      console.error('[App] Failed to generate initial rooms:', error);
      setError('Failed to generate initial rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [gameState.storySeed, gameState.storyContext, gameState.storyMode]);

  // Handle player movement
  const handlePlayerMove = useCallback((newPosition: Position) => {
    setGameState((prev) => ({...prev, playerPosition: newPosition}));
  }, []);

  // Handle screen exit (moving to edge)
  const handleScreenExit = useCallback(
    async (direction: 'right' | 'left' | 'up' | 'down') => {
      const newRoomCounter = gameState.roomCounter + 1;
      const newRoomId = `room_${newRoomCounter}`;

      // Check if room already exists (pre-generated)
      let newRoom = gameState.rooms.get(newRoomId);

      if (!newRoom) {
        // Room not pre-generated, generate it now
        console.log(`[App] Room ${newRoomId} not pre-generated, generating now...`);
        const currentRoom = gameState.rooms.get(gameState.currentRoomId);

        newRoom = await generateRoom(
          newRoomId,
          gameState.storySeed,
          newRoomCounter,
          undefined,
          gameState.storyContext,
          gameState.storyMode,
          currentRoom?.description
        );
      }

      const tileMap = newRoom.tileMap;
      let newPosition = tileMap?.spawnPoint || { x: 400, y: 300 };

      if (tileMap) {
        const { width, height, tileSize, spawnPoint } = tileMap;
        const mapWidth = width * tileSize;
        const mapHeight = height * tileSize;
        const edgeBuffer = Math.max(tileSize * 2, 60);

        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

        switch (direction) {
          case 'left':
            newPosition = {
              x: clamp(mapWidth - spawnPoint.x, edgeBuffer, mapWidth - edgeBuffer),
              y: spawnPoint.y,
            };
            break;
          case 'right':
            newPosition = spawnPoint;
            break;
          case 'up':
            newPosition = {
              x: spawnPoint.x,
              y: clamp(mapHeight - spawnPoint.y, edgeBuffer, mapHeight - edgeBuffer),
            };
            break;
          case 'down':
            newPosition = {
              x: spawnPoint.x,
              y: clamp(spawnPoint.y, edgeBuffer, mapHeight - edgeBuffer),
            };
            break;
        }
      }

      // Update state with new room
      setGameState((prev) => {
        const newRooms = new Map(prev.rooms);
        if (newRoom) {
          newRooms.set(newRoomId, newRoom);
        }

        return {
          ...prev,
          currentRoomId: newRoomId,
          playerPosition: newPosition,
          rooms: newRooms,
          roomCounter: newRoomCounter,
          previousRoomId: prev.currentRoomId,
        };
      });

      // Pre-generate next room pair (N+1 and N+2) in the background with panorama
      const nextRoomCounter = newRoomCounter + 1;
      const nextNextRoomCounter = newRoomCounter + 2;
      const nextRoomId = `room_${nextRoomCounter}`;
      const nextNextRoomId = `room_${nextNextRoomCounter}`;

      // Check if these rooms are already being generated or exist
      const roomsAlreadyExist = gameState.rooms.has(nextRoomId) && gameState.rooms.has(nextNextRoomId);
      const roomsBeingGenerated = generatingRooms.has(nextRoomId) || generatingRooms.has(nextNextRoomId);

      if (!roomsAlreadyExist && !roomsBeingGenerated) {
        console.log(`[App] Pre-generating room pair ${nextRoomId} + ${nextNextRoomId}...`);

        // Mark both rooms as being generated
        generatingRooms.add(nextRoomId);
        generatingRooms.add(nextNextRoomId);

        generateRoomPair(
          nextRoomId,
          nextNextRoomId,
          gameState.storySeed,
          nextRoomCounter,
          nextNextRoomCounter,
          gameState.storyContext,
          gameState.storyMode,
          newRoom?.description
        ).then(({ currentRoom: nextRoom, nextRoom: nextNextRoom }) => {
          setGameState((prev) => {
            const newRooms = new Map(prev.rooms);
            newRooms.set(nextRoomId, nextRoom);
            newRooms.set(nextNextRoomId, nextNextRoom);
            return { ...prev, rooms: newRooms };
          });
          console.log(`[App] Room pair ${nextRoomId} + ${nextNextRoomId} pre-generated successfully`);

          // Remove from generating set
          generatingRooms.delete(nextRoomId);
          generatingRooms.delete(nextNextRoomId);
        }).catch((error) => {
          console.error(`[App] Failed to pre-generate room pair:`, error);

          // Remove from generating set on error too
          generatingRooms.delete(nextRoomId);
          generatingRooms.delete(nextNextRoomId);
        });
      } else if (roomsAlreadyExist) {
        console.log(`[App] Rooms ${nextRoomId} + ${nextNextRoomId} already exist, skipping pre-generation`);
      } else {
        console.log(`[App] Rooms ${nextRoomId} + ${nextNextRoomId} already being generated, skipping duplicate call`);
      }
    },
    [gameState.roomCounter, gameState.rooms, gameState.currentRoomId, gameState.storySeed, gameState.storyContext, gameState.storyMode],
  );

  // Handle adding experience and leveling up
  const handleAddExperience = useCallback((xpGained: number) => {
    setGameState((prev) => {
      let newXP = prev.experience + xpGained;
      let newLevel = prev.level;
      let newMaxHP = prev.maxHP;
      let newMaxMana = prev.maxMana;
      let leveledUp = false;

      // Check for level up
      while (newXP >= prev.experienceToNextLevel) {
        newXP -= prev.experienceToNextLevel;
        newLevel += 1;
        newMaxHP += 10;
        newMaxMana += 10;
        leveledUp = true;
      }

      if (leveledUp) {
        // Show level up animation
        setTimeout(() => {
          setGameState((state) => ({
            ...state,
            currentAnimation: {
              type: 'levelup',
              value: newLevel,
              text: `Level Up! Now Level ${newLevel}`,
              timestamp: Date.now(),
            },
          }));
        }, 500);
      }

      return {
        ...prev,
        experience: newXP,
        level: newLevel,
        maxHP: newMaxHP,
        maxMana: newMaxMana,
        // Fully restore HP and mana on level up
        currentHP: leveledUp ? newMaxHP : Math.min(prev.currentHP, newMaxHP),
        currentMana: leveledUp ? newMaxMana : Math.min(prev.currentMana, newMaxMana),
        experienceToNextLevel: calculateLevelUp(newLevel),
      };
    });
  }, []);

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
          gameState.level,
          gameState.storyConsequences,
          gameState.storyContext,
          gameState.storyMode,
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
    [gameState.selectedCharacter, gameState.currentHP, gameState.storySeed, gameState.level, gameState.storyConsequences, gameState.storyContext, gameState.storyMode],
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

      // Track story consequences based on choice
      const choiceText = sceneData?.choices.find((c) => c.id === choiceId)?.text || '';
      let consequenceType: 'merciful' | 'violent' | 'clever' | 'diplomatic' | 'greedy' | null = null;

      // Categorize choices
      if (choiceType === 'combat' || choiceType === 'damage') {
        consequenceType = 'violent';
      } else if (choiceType === 'dialogue') {
        if (choiceText.toLowerCase().includes('spare') || choiceText.toLowerCase().includes('mercy')) {
          consequenceType = 'merciful';
        } else if (choiceText.toLowerCase().includes('negotiate') || choiceText.toLowerCase().includes('talk')) {
          consequenceType = 'diplomatic';
        } else {
          consequenceType = 'clever';
        }
      } else if (choiceType === 'loot') {
        consequenceType = 'greedy';
      }

      if (consequenceType) {
        const consequence = {
          id: `consequence_${Date.now()}`,
          description: choiceText,
          type: consequenceType,
          timestamp: Date.now(),
        };
        setGameState((prev) => ({
          ...prev,
          storyConsequences: [...prev.storyConsequences, consequence],
        }));
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
    if (!gameState.battleState || gameState.battleState.turn !== 'player' || !gameState.selectedCharacter) return;

    const character = gameState.selectedCharacter;
    let playerDamage = 0;
    let isCrit = false;
    let manaCost = 0;
    let actionText = '';

    // Determine action
    if (action === 'attack') {
      const result = calculateDamage(character.baseDamage, character.critChance);
      playerDamage = result.damage;
      isCrit = result.isCrit;
      actionText = isCrit ? 'Critical Hit!' : 'Attack';
    } else if (action === 'special') {
      // Special ability
      const ability = character.specialAbility;
      manaCost = ability.manaCost;

      // Check if enough mana
      if (gameState.currentMana < manaCost) {
        setGameState(prev => ({
          ...prev,
          currentAnimation: {
            type: 'dialogue',
            text: 'Not enough mana!',
            timestamp: Date.now(),
          },
        }));
        return;
      }

      // Handle healing ability
      if (ability.healing) {
        const healAmount = ability.healing;
        const newHP = Math.min(gameState.maxHP, gameState.currentHP + healAmount);

        setGameState(prev => ({
          ...prev,
          currentHP: newHP,
          currentMana: prev.currentMana - manaCost,
          currentAnimation: {
            type: 'heal',
            value: healAmount,
            text: `${ability.name}! Healed ${healAmount} HP`,
            timestamp: Date.now(),
          },
          battleState: prev.battleState ? {
            ...prev.battleState,
            turn: 'enemy',
          } : null,
        }));

        // Enemy's turn after healing
        setTimeout(() => {
          handleEnemyTurn();
        }, 1500);
        return;
      }

      // Damage abilities
      if (ability.baseDamage) {
        const hasGuaranteedCrit = ability.effects?.includes('guaranteed_crit');
        if (hasGuaranteedCrit) {
          playerDamage = Math.floor(ability.baseDamage * 1.5);
          isCrit = true;
        } else {
          const result = calculateDamage(ability.baseDamage, character.critChance);
          playerDamage = result.damage;
          isCrit = result.isCrit;
        }
        actionText = ability.name;
      }
    }

    // Apply damage to enemy
    if (playerDamage > 0) {
      const newEnemyHP = Math.max(0, gameState.battleState.enemyHP - playerDamage);
      const playerAnimations: BattleAnimation[] = [
        { type: 'slash', target: 'enemy', timestamp: Date.now() },
        {
          type: 'damageNumber',
          target: 'enemy',
          value: isCrit ? `${playerDamage} CRIT!` : playerDamage,
          timestamp: Date.now()
        },
      ];

      const newBattleState: BattleState = {
        ...gameState.battleState,
        enemyHP: newEnemyHP,
        status: newEnemyHP <= 0 ? 'player_won' : 'ongoing',
        turn: 'enemy',
        animationQueue: [...gameState.battleState.animationQueue, ...playerAnimations],
      };

      setGameState(prev => ({
        ...prev,
        battleState: newBattleState,
        currentMana: prev.currentMana - manaCost,
      }));

      // Enemy's turn (after a delay) if still alive
      if (newEnemyHP > 0) {
        setTimeout(() => {
          handleEnemyTurn();
        }, 1000);
      } else {
        // Enemy defeated - award XP
        const enemyLevel = gameState.battleState.enemy.enemyLevel || 1;
        const xpGained = calculateExperienceGain(enemyLevel, gameState.level);

        setTimeout(() => {
          handleAddExperience(xpGained);

          // Check for item drop
          if (gameState.battleState?.enemy.itemDrop) {
            setGameState(prev => ({
              ...prev,
              inventory: [...prev.inventory, gameState.battleState!.enemy.itemDrop!],
              currentAnimation: {
                type: 'item_acquired',
                text: `Found ${gameState.battleState!.enemy.itemDrop!.name}!`,
                timestamp: Date.now(),
              },
            }));
          }
        }, 500);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.battleState, gameState.currentHP, gameState.selectedCharacter, gameState.currentMana, gameState.maxHP, gameState.level]);

  // Handle enemy turn
  const handleEnemyTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev.battleState || !prev.selectedCharacter) return prev;

      const enemyLevel = prev.battleState.enemy.enemyLevel || 1;
      const enemyBaseDamage = 10 + (enemyLevel * 3);
      const enemyDefenseIgnored = Math.max(0, enemyBaseDamage - prev.selectedCharacter.defense);
      const enemyDamage = Math.max(5, enemyDefenseIgnored);

      const newPlayerHP = Math.max(0, prev.currentHP - enemyDamage);
      const enemyAnimations: BattleAnimation[] = [
        { type: 'slash', target: 'player', timestamp: Date.now() },
        { type: 'damageNumber', target: 'player', value: enemyDamage, timestamp: Date.now() },
      ];

      return {
        ...prev,
        currentHP: newPlayerHP,
        isAlive: newPlayerHP > 0,
        battleState: {
          ...prev.battleState,
          status: newPlayerHP <= 0 ? 'player_lost' : 'ongoing',
          turn: 'player',
          animationQueue: [...prev.battleState.animationQueue, ...enemyAnimations],
        },
        currentAnimation: {
          type: 'damage',
          value: enemyDamage,
          text: `Took ${enemyDamage} damage!`,
          timestamp: Date.now(),
        },
      };
    });
  }, []);

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
      const newObjects: GameObject[] = (currentRoom as Room).objects.filter(
        (obj) => obj.id !== gameState.battleState?.enemy.id
      );
      const updatedRoom: Room = { ...(currentRoom as Room), objects: newObjects };
      updatedRooms.set(gameState.currentRoomId, updatedRoom);
    }

    setGameState(prev => ({
      ...prev,
      battleState: null,
      rooms: updatedRooms,
      // Restore mana after battle (50% of max mana)
      currentMana: Math.min(prev.maxMana, prev.currentMana + Math.floor(prev.maxMana * 0.5)),
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
      maxHP: 0,
      currentMana: 0,
      maxMana: 0,
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      isAlive: true,
      storySeed: newSeed,
      storyContext: null,
      storyMode: 'inspiration',
      isInGame: false,
      playerPosition: {x: 400, y: 300},
      currentRoomId: 'room_0',
      rooms: new Map(),
      roomCounter: 0,
      currentAnimation: null,
      battleState: null,
      inventory: [],
      storyConsequences: [],
    });
    setSceneData(null);
    setError(null);
    setInteractionHistory([]);
    setShowAIDialog(false);
    setCurrentInteractingObject(null);
    setAvailableClasses(CHARACTER_CLASSES); // Reset to default classes
    setShowStoryInput(true);
  }, []);

  // Get current room
  const currentRoom = gameState.rooms.get(gameState.currentRoomId);

  return (
    <div className="w-screen h-screen overflow-hidden" style={{backgroundColor: '#2d5a4e'}}>
      <AnimationOverlay
        animation={gameState.currentAnimation}
        onComplete={handleAnimationComplete}
      />
      <AudioManager gameState={gameState} />
      <Window title="Roguelike Adventure">
        {/* Voice Controls - positioned at top right */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
        }}>
          <VoiceControls compact />
        </div>

        <div className="w-full h-full" style={{backgroundColor: '#2d5a4e'}}>
          {showStoryInput ? (
            <StoryInput onSubmit={handleStorySubmit} />
          ) : isGeneratingClasses ? (
            <ClassGenerationLoading />
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl mb-4 animate-bounce">🎨</div>
              <div className="text-2xl text-white mb-2">Generating Your Adventure...</div>
              <div className="text-lg text-gray-300">Creating panoramic scenes with AI</div>
            </div>
          ) : !gameState.selectedCharacter ? (
            <CharacterSelection
              characters={availableClasses}
              onSelectCharacter={handleCharacterSelect}
            />
          ) : !gameState.isAlive ? (
            <div
              className="flex flex-col items-center justify-center h-full p-8"
              style={{
                backgroundColor: '#2d5a4e',
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
                fontFamily: 'monospace'
              }}
            >
              <div className="max-w-2xl w-full">
                {/* Title Box */}
                <div
                  className="mb-8 p-10 text-center relative"
                  style={{
                    backgroundColor: '#3d2817',
                    border: '8px solid #5c3d2e',
                    boxShadow: '0 12px 0 #1a1410, inset 0 6px 0 rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '4px solid #c9534f', borderLeft: '4px solid #c9534f' }}></div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '4px solid #c9534f', borderRight: '4px solid #c9534f' }}></div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '4px solid #c9534f', borderLeft: '4px solid #c9534f' }}></div>
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '4px solid #c9534f', borderRight: '4px solid #c9534f' }}></div>

                  <div className="text-8xl mb-6 animate-pulse">💀</div>
                  <h1
                    style={{
                      color: '#c9534f',
                      textShadow: '4px 4px 0px #8b3a34',
                      letterSpacing: '4px',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      marginBottom: '12px'
                    }}
                  >
                    GAME OVER
                  </h1>
                  <div className="flex items-center justify-center gap-3">
                    <div style={{ width: '60px', height: '4px', backgroundColor: '#c9534f', borderRadius: '2px' }}></div>
                    <span style={{ color: '#c9534f', fontSize: '18px' }}>☠</span>
                    <div style={{ width: '60px', height: '4px', backgroundColor: '#c9534f', borderRadius: '2px' }}></div>
                  </div>
                </div>

                {/* Message Box */}
                <div
                  className="mb-8 p-6 text-center"
                  style={{
                    backgroundColor: '#c9b896',
                    border: '6px solid #8b6f47',
                    boxShadow: 'inset 0 4px 0 #e8d4b0',
                    borderRadius: '4px'
                  }}
                >
                  <p style={{ color: '#3d2817', fontSize: '16px', lineHeight: '1.8', fontWeight: '500' }}>
                    Your journey has come to an end.<br/>
                    But every death brings a new story...
                  </p>
                </div>

                {/* Restart Button */}
                <button
                  onClick={handleRestart}
                  className="w-full py-6 transition-all active:translate-y-2"
                  style={{
                    backgroundColor: '#c9534f',
                    border: '6px solid #8b3a34',
                    borderRadius: '6px',
                    boxShadow: '0 10px 0 #8b3a34',
                    color: '#f4e8d0',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    letterSpacing: '3px',
                    cursor: 'pointer'
                  }}
                >
                  ⚔ BEGIN A NEW ADVENTURE ⚔
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Sidebar HUD */}
              {gameState.selectedCharacter && (
                <GameHUD
                  character={gameState.selectedCharacter}
                  currentHP={gameState.currentHP}
                  maxHP={gameState.maxHP}
                  currentMana={gameState.currentMana}
                  maxMana={gameState.maxMana}
                  level={gameState.level}
                  experience={gameState.experience}
                  experienceToNextLevel={gameState.experienceToNextLevel}
                  roomCounter={gameState.roomCounter}
                />
              )}

              {/* Game Area */}
              <div className="flex-1 overflow-hidden relative" style={{backgroundColor: '#1a1a1a'}}>
                {/* Room Description with Voice */}
                {currentRoom && !showAIDialog && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    border: '2px solid #8B5CF6',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    maxWidth: '700px',
                  }}>
                    <SpeakableText
                      text={currentRoom.description}
                      characterType="narrator"
                      emotion="mysterious"
                      buttonSize="small"
                      style={{
                        color: '#e5e7eb',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        display: 'block',
                      }}
                    >
                      {currentRoom.description}
                    </SpeakableText>
                  </div>
                )}

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

                <BattleUI
                  battleState={gameState.battleState}
                  onPlayerAction={handleBattleAction}
                  character={gameState.selectedCharacter}
                  currentMana={gameState.currentMana}
                />

                {/* Visual Battle Scene Overlay */}
                {showAIDialog && (
                  <div className="absolute inset-0 z-10">
                    {error ? (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(61,40,23,0.95)',
                          fontFamily: 'monospace'
                        }}
                      >
                        <div
                          className="max-w-lg p-8"
                          style={{
                            backgroundColor: '#f4e8d0',
                            border: '6px solid #c9534f',
                            borderRadius: '4px',
                            boxShadow: '0 8px 0 #8b3a34, inset 0 4px 0 #fff9e8'
                          }}
                        >
                          <h2
                            className="mb-4"
                            style={{
                              fontSize: '28px',
                              fontWeight: 'bold',
                              color: '#c9534f',
                              letterSpacing: '2px',
                              textShadow: '2px 2px 0px #8b3a34'
                            }}
                          >
                            ⚠ ERROR ⚠
                          </h2>
                          <p style={{ color: '#3d2817', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                            {error}
                          </p>
                          <button
                            onClick={handleCloseAIDialog}
                            className="w-full py-4 transition-all active:translate-y-2"
                            style={{
                              backgroundColor: '#c9534f',
                              border: '4px solid #8b3a34',
                              borderRadius: '4px',
                              boxShadow: '0 6px 0 #8b3a34',
                              color: '#f4e8d0',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              letterSpacing: '2px',
                              cursor: 'pointer'
                            }}
                          >
                            CLOSE
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
            </div>
          )}
        </div>
      </Window>
    </div>
  );
};

export default App;
