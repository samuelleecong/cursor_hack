/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import { BattleState } from '../types';
import { CharacterClass } from '../characterClasses';

interface BattleUIProps {
  battleState: BattleState | null;
  onPlayerAction: (action: string) => void;
  character?: CharacterClass | null;
  currentMana?: number;
}

export const BattleUI: React.FC<BattleUIProps> = ({
  battleState,
  onPlayerAction,
  character,
  currentMana = 0,
}) => {
  if (!battleState || battleState.status !== 'ongoing' || battleState.turn !== 'player') {
    return null;
  }

  const ability = character?.specialAbility;
  const canUseAbility = ability && currentMana >= ability.manaCost;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 border-t-4 border-red-500 p-6">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onPlayerAction('attack')}
          className="bg-red-700 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 shadow-lg"
        >
          ⚔️ Attack
        </button>

        {ability && (
          <button
            onClick={() => onPlayerAction('special')}
            disabled={!canUseAbility}
            className={`font-bold py-4 px-8 rounded-lg text-xl transition-transform transform shadow-lg ${
              canUseAbility
                ? 'bg-purple-700 hover:bg-purple-600 text-white hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }`}
            title={ability.description}
          >
            {character.icon} {ability.name}
            <span className="block text-sm mt-1">
              {ability.manaCost} Mana
            </span>
          </button>
        )}
      </div>

      {/* Battle info */}
      <div className="mt-4 text-center">
        <p className="text-white text-lg">
          Enemy HP: <span className="text-red-400 font-bold">{battleState.enemyHP}/{battleState.maxEnemyHP}</span>
        </p>
      </div>
    </div>
  );
};
