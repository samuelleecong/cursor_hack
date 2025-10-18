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
}

export const GameHUD: React.FC<GameHUDProps> = ({character, currentHP}) => {
  const hpPercentage = (currentHP / character.startingHP) * 100;
  const hpColor =
    hpPercentage > 60 ? '#22c55e' : hpPercentage > 30 ? '#eab308' : '#ef4444';

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{character.icon}</div>
          <div>
            <h2 className="text-xl font-bold text-white">{character.name}</h2>
            <p className="text-sm text-gray-400">
              {character.attackType} • {character.specialAbility}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Health:</span>
            <div className="w-48 h-6 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${Math.max(hpPercentage, 0)}%`,
                  backgroundColor: hpColor,
                }}>
                {currentHP > 0 && (
                  <span className="drop-shadow-md">
                    {currentHP}/{character.startingHP}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
