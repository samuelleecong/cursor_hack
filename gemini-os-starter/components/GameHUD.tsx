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

  const hpColor = hpPercentage > 60 ? '#6fa85c' : hpPercentage > 30 ? '#d4a574' : '#c9534f';
  const manaColor = '#5a8fc9';
  const xpColor = '#9b7ac9';

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: '280px',
        backgroundColor: '#c9b896',
        borderRight: '6px solid #3d2817',
        padding: '20px',
        boxShadow: 'inset -3px 0 0 #e8d4b0',
        fontFamily: 'monospace',
        minHeight: '100%'
      }}
    >
      {/* Character Icon Section */}
      <div
        className="mb-6 p-6 text-center"
        style={{
          backgroundColor: '#f4e8d0',
          border: '5px solid #3d2817',
          borderRadius: '4px',
          boxShadow: 'inset 0 3px 0 #fff9e8'
        }}
      >
        <div
          className="text-7xl mb-3"
          style={{
            filter: 'drop-shadow(3px 3px 0px rgba(61,40,23,0.3))'
          }}
        >
          {character.icon}
        </div>
        <h2
          className="mb-2"
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#3d2817',
            letterSpacing: '1px',
            textShadow: '2px 2px 0px #d4a574'
          }}
        >
          {character.name}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#7b1fa2',
              color: '#f4e8d0',
              padding: '4px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              border: '2px solid #4a0e4e',
              boxShadow: '0 2px 0 #4a0e4e'
            }}
          >
            Level {level}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#5c3d2e' }}>
          {character.attackType}
        </p>
        <p style={{ fontSize: '11px', color: '#5c3d2e', marginTop: '4px' }}>
          Room {roomCounter}
        </p>
      </div>

      {/* Stats Section */}
      <div
        className="flex-1 p-4"
        style={{
          backgroundColor: '#f4e8d0',
          border: '5px solid #3d2817',
          borderRadius: '4px',
          boxShadow: 'inset 0 3px 0 #fff9e8'
        }}
      >
        <div
          className="mb-3 pb-2"
          style={{
            borderBottom: '3px solid #c9b896'
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#3d2817',
              letterSpacing: '1px',
              textAlign: 'center'
            }}
          >
            ⚔ STATS ⚔
          </h3>
        </div>

        {/* HP Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span
              style={{
                fontSize: '12px',
                color: '#3d2817',
                fontWeight: 'bold'
              }}
            >
              ❤️ HP
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#3d2817',
                fontWeight: 'bold'
              }}
            >
              {currentHP}/{actualMaxHP}
            </span>
          </div>
          <div
            className="w-full h-6 overflow-hidden"
            style={{
              backgroundColor: '#8b6f47',
              border: '3px solid #3d2817',
              borderRadius: '4px',
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.max(hpPercentage, 0)}%`,
                backgroundColor: hpColor
              }}
            ></div>
          </div>
        </div>

        {/* Mana Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span
              style={{
                fontSize: '12px',
                color: '#3d2817',
                fontWeight: 'bold'
              }}
            >
              💧 Mana
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#3d2817',
                fontWeight: 'bold'
              }}
            >
              {currentMana}/{maxMana}
            </span>
          </div>
          <div
            className="w-full h-6 overflow-hidden"
            style={{
              backgroundColor: '#8b6f47',
              border: '3px solid #3d2817',
              borderRadius: '4px',
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.max(manaPercentage, 0)}%`,
                backgroundColor: manaColor
              }}
            ></div>
          </div>
        </div>

        {/* XP Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              style={{
                fontSize: '12px',
                color: '#3d2817',
                fontWeight: 'bold'
              }}
            >
              ⭐ XP
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#3d2817',
                fontWeight: 'bold'
              }}
            >
              {experience}/{experienceToNextLevel}
            </span>
          </div>
          <div
            className="w-full h-6 overflow-hidden"
            style={{
              backgroundColor: '#8b6f47',
              border: '3px solid #3d2817',
              borderRadius: '4px',
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.max(xpPercentage, 0)}%`,
                backgroundColor: xpColor
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
