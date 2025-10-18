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
    <div
      className="absolute bottom-0 left-0 right-0 p-6"
      style={{
        backgroundColor: 'rgba(26,26,26,0.95)',
        borderTop: '6px solid #5c3d2e',
        fontFamily: 'monospace'
      }}
    >
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onPlayerAction('attack')}
          className="transition-all active:translate-y-2"
          style={{
            backgroundColor: '#c9534f',
            border: '5px solid #8b3a34',
            borderRadius: '4px',
            boxShadow: '0 8px 0 #8b3a34',
            color: '#f4e8d0',
            fontSize: '20px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            padding: '16px 32px',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 0 #8b3a34';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 0 #8b3a34';
          }}
        >
          ⚔️ Attack
        </button>

        {ability && (
          <button
            onClick={() => onPlayerAction('special')}
            disabled={!canUseAbility}
            className="transition-all active:translate-y-2"
            style={{
              backgroundColor: canUseAbility ? '#7b1fa2' : '#5c3d2e',
              border: canUseAbility ? '5px solid #4a0e4e' : '5px solid #3d2817',
              borderRadius: '4px',
              boxShadow: canUseAbility ? '0 8px 0 #4a0e4e' : '0 4px 0 #3d2817',
              color: canUseAbility ? '#f4e8d0' : '#8b6f47',
              fontSize: '20px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              padding: '16px 32px',
              cursor: canUseAbility ? 'pointer' : 'not-allowed',
              opacity: canUseAbility ? 1 : 0.6
            }}
            title={ability.description}
            onMouseEnter={(e) => {
              if (canUseAbility) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 0 #4a0e4e';
              }
            }}
            onMouseLeave={(e) => {
              if (canUseAbility) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 0 #4a0e4e';
              }
            }}
          >
            <span style={{ display: 'block' }}>
              {character.icon} {ability.name}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '14px',
                marginTop: '4px',
                color: canUseAbility ? '#e8d4b0' : '#8b6f47'
              }}
            >
              {ability.manaCost} Mana
            </span>
          </button>
        )}
      </div>

      {/* Battle info */}
      <div className="mt-4 text-center">
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#3d2817',
            border: '4px solid #5c3d2e',
            borderRadius: '4px',
            padding: '8px 16px',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.1)'
          }}
        >
          <p style={{ color: '#f4e8d0', fontSize: '18px', fontWeight: 'bold' }}>
            Enemy HP: <span style={{ color: '#c9534f' }}>{battleState.enemyHP}/{battleState.maxEnemyHP}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
