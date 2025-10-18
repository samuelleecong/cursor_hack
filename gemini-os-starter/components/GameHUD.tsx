/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {CharacterClass} from '../characterClasses';

interface GameHUDProps {
  character: CharacterClass;
  currentHP: number;
  maxHP?: number;
  currentMana?: number;
  maxMana?: number;
  level?: number;
  experience?: number;
  experienceToNextLevel?: number;
  roomCounter?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  character,
  currentHP,
  maxHP,
  currentMana = 0,
  maxMana = 100,
  level = 1,
  experience = 0,
  experienceToNextLevel = 100,
  roomCounter = 0,
}) => {
  const actualMaxHP = maxHP || character.startingHP;
  const hpPercentage = (currentHP / actualMaxHP) * 100;
  const manaPercentage = (currentMana / maxMana) * 100;
  const xpPercentage = (experience / experienceToNextLevel) * 100;

  const hpColor =
    hpPercentage > 60 ? '#22c55e' : hpPercentage > 30 ? '#eab308' : '#ef4444';
  const manaColor = '#3b82f6';
  const xpColor = '#a855f7';

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b-2 border-gray-700 p-3 shadow-lg">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Character Info */}
        <div className="flex items-center gap-3">
          <div className="text-4xl">{character.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{character.name}</h2>
              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded font-bold">
                Lv {level}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {character.attackType} • Room {roomCounter}
            </p>
          </div>
        </div>

        {/* Stats Bars */}
        <div className="flex flex-col gap-1.5 min-w-[300px]">
          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 w-12">HP</span>
            <div className="flex-1 h-5 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${Math.max(hpPercentage, 0)}%`,
                  backgroundColor: hpColor,
                }}>
                {currentHP > 0 && (
                  <span className="drop-shadow-md text-xs">
                    {currentHP}/{actualMaxHP}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mana Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 w-12">Mana</span>
            <div className="flex-1 h-5 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${Math.max(manaPercentage, 0)}%`,
                  backgroundColor: manaColor,
                }}>
                <span className="drop-shadow-md text-xs">
                  {currentMana}/{maxMana}
                </span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 w-12">XP</span>
            <div className="flex-1 h-5 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${Math.max(xpPercentage, 0)}%`,
                  backgroundColor: xpColor,
                }}>
                <span className="drop-shadow-md text-xs">
                  {experience}/{experienceToNextLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
