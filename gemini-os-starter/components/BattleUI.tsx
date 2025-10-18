/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import { BattleState } from '../types';

interface BattleUIProps {
  battleState: BattleState | null;
  onPlayerAction: (action: string) => void;
}

export const BattleUI: React.FC<BattleUIProps> = ({ battleState, onPlayerAction }) => {
  if (!battleState || battleState.status !== 'ongoing') {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 border-t-4 border-red-500 p-4">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onPlayerAction('attack')}
          className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          ⚔️ Attack
        </button>
        <button
          onClick={() => onPlayerAction('spell')}
          className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          ✨ Spell
        </button>
        <button
          onClick={() => onPlayerAction('item')}
          className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          🧪 Item
        </button>
        <button
          onClick={() => onPlayerAction('flee')}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          🏃 Flee
        </button>
      </div>
    </div>
  );
};
