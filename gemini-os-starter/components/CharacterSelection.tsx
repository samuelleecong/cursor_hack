/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {CharacterClass} from '../characterClasses';

interface CharacterSelectionProps {
  characters: CharacterClass[];
  onSelectCharacter: (character: CharacterClass) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  characters,
  onSelectCharacter,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <h1 className="text-4xl font-bold text-white mb-4">Choose Your Hero</h1>
      <p className="text-gray-300 mb-8 text-center max-w-2xl">
        Select a character class to begin your adventure. Each class has unique
        abilities and playstyles. Your choices will shape your journey through
        an ever-changing story.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {characters.map((character) => (
          <div
            key={character.id}
            onClick={() => onSelectCharacter(character)}
            className="cursor-pointer bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200 transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${character.color}22 0%, #1f293722 100%)`,
            }}>
            <div className="text-center">
              <div className="text-6xl mb-3">{character.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {character.name}
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                {character.description}
              </p>

              <div className="space-y-2 text-left bg-gray-900/50 rounded p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Health:</span>
                  <span className="text-green-400 font-semibold">
                    {character.startingHP} HP
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Attack Type:</span>
                  <span className="text-blue-400 font-semibold">
                    {character.attackType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Special:</span>
                  <span className="text-purple-400 font-semibold">
                    {character.specialAbility.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-500 text-sm mt-8 italic">
        Tip: Each playthrough will be different. Death is permanent, but the
        story changes every time.
      </p>
    </div>
  );
};
