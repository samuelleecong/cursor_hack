/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React, { useState } from 'react';

interface StoryInputProps {
  onSubmit: (story: string | null) => void;
}

export const StoryInput: React.FC<StoryInputProps> = ({ onSubmit }) => {
  const [storyText, setStoryText] = useState('');

  const handleSubmit = () => {
    if (storyText.trim()) {
      onSubmit(storyText.trim());
    }
  };

  const handleSkip = () => {
    onSubmit(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl w-full bg-gray-900/90 backdrop-blur rounded-lg shadow-2xl p-8 border-2 border-purple-500">
        <h1 className="text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Story-Based Game Mode
        </h1>

        <p className="text-gray-300 text-center mb-6">
          Paste a story, book excerpt, or narrative below to generate a unique game world based on that text.
          The AI will use your story as inspiration for encounters, characters, and atmosphere.
        </p>

        <div className="mb-6">
          <label className="block text-purple-300 font-semibold mb-2">
            Your Story (optional)
          </label>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="Paste your story here... For example:

'In the ancient kingdom of Eldergrove, where magic flows through the trees and shadows whisper secrets, a prophecy speaks of a hero who will restore balance to the realm. Dark forces have awakened in the northern mountains, and the crystal that protects the land grows dim...'

Or leave blank to use random generation."
            className="w-full h-64 p-4 bg-gray-800/80 text-gray-100 rounded border-2 border-purple-600 focus:border-pink-500 focus:outline-none resize-none font-mono text-sm"
            maxLength={5000}
          />
          <div className="text-right text-gray-400 text-sm mt-1">
            {storyText.length} / 5000 characters
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 border-2 border-gray-600"
          >
            Skip (Random Generation)
          </button>

          <button
            onClick={handleSubmit}
            disabled={!storyText.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 border-2 ${
              storyText.trim()
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-purple-400'
                : 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed'
            }`}
          >
            Create Game from Story
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-900/30 rounded border border-blue-500/50">
          <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
            <span>💡</span> Tips for Best Results
          </h3>
          <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
            <li>Include setting details (locations, atmosphere, time period)</li>
            <li>Mention key themes or conflicts in your story</li>
            <li>Describe the type of world (fantasy, sci-fi, horror, etc.)</li>
            <li>Reference characters or creatures that could appear</li>
            <li>Longer stories (500+ words) provide richer context</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
