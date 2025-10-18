/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React from 'react';

export const ClassGenerationLoading: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{
        backgroundColor: '#2d5a4e',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
        fontFamily: 'monospace'
      }}
    >
      <div className="max-w-2xl w-full">
        {/* Title Box */}
        <div
          className="mb-8 p-8 text-center relative"
          style={{
            backgroundColor: '#f4e8d0',
            border: '8px solid #3d2817',
            boxShadow: '0 10px 0 #3d2817, inset 0 6px 0 #fff9e8',
            borderRadius: '4px'
          }}
        >
          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '4px solid #8b6f47', borderLeft: '4px solid #8b6f47' }}></div>
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '4px solid #8b6f47', borderRight: '4px solid #8b6f47' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '4px solid #8b6f47', borderLeft: '4px solid #8b6f47' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '4px solid #8b6f47', borderRight: '4px solid #8b6f47' }}></div>

          <div style={{ fontSize: '14px', color: '#8b6f47', marginBottom: '8px' }}>✦ ✦ ✦</div>
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <h1
            style={{
              color: '#5c3d2e',
              textShadow: '4px 4px 0px #d4a574',
              letterSpacing: '3px',
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}
          >
            GENERATING CLASSES
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div style={{ width: '60px', height: '4px', backgroundColor: '#8b6f47', borderRadius: '2px' }}></div>
            <span style={{ color: '#8b6f47', fontSize: '18px' }}>★</span>
            <div style={{ width: '60px', height: '4px', backgroundColor: '#8b6f47', borderRadius: '2px' }}></div>
          </div>
        </div>

        {/* Content Box */}
        <div
          className="p-6 text-center"
          style={{
            backgroundColor: '#c9b896',
            border: '6px solid #8b6f47',
            boxShadow: 'inset 0 4px 0 #e8d4b0',
            borderRadius: '4px'
          }}
        >
          <p style={{ color: '#3d2817', fontSize: '16px', lineHeight: '1.8', marginBottom: '20px', fontWeight: '500' }}>
            The AI is analyzing your story and creating unique character classes that fit your world...
          </p>

          {/* Loading dots */}
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div
              className="animate-pulse"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#5c3d2e',
                border: '3px solid #3d2817',
                borderRadius: '50%'
              }}
            ></div>
            <div
              className="animate-pulse"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#5c3d2e',
                border: '3px solid #3d2817',
                borderRadius: '50%',
                animationDelay: '0.2s'
              }}
            ></div>
            <div
              className="animate-pulse"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#5c3d2e',
                border: '3px solid #3d2817',
                borderRadius: '50%',
                animationDelay: '0.4s'
              }}
            ></div>
          </div>

          <p style={{ color: '#5c3d2e', fontSize: '13px', fontStyle: 'italic' }}>
            ⏱ This may take a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
};
