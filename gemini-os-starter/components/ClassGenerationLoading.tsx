/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React from 'react';

export const ClassGenerationLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-md w-full bg-gray-900/90 backdrop-blur rounded-lg shadow-2xl p-8 border-2 border-purple-500 text-center">
        <div className="text-6xl mb-6 animate-bounce">🎮</div>

        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Generating Character Classes
        </h1>

        <p className="text-gray-300 mb-6">
          The AI is analyzing your story and creating unique character classes that fit your world...
        </p>

        <div className="flex justify-center items-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-150"></div>
        </div>

        <p className="text-gray-400 text-sm">
          This may take a few seconds...
        </p>
      </div>
    </div>
  );
};
