/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React from 'react';

interface RoomGenerationLoadingProps {
  currentStep?: string;
  progress?: number;
}

export const RoomGenerationLoading: React.FC<RoomGenerationLoadingProps> = ({
  currentStep = 'Generating room...',
  progress = 0,
}) => {
  const steps = [
    { label: 'Analyzing story context', emoji: '📖' },
    { label: 'Creating NPCs and enemies', emoji: '👥' },
    { label: 'Generating sprites', emoji: '🎨' },
    { label: 'Building environment', emoji: '🏗️' },
  ];

  const currentStepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);

  return (
    <div
      className="flex items-center justify-center h-full"
      style={{
        backgroundColor: '#2d5a4e',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
        fontFamily: 'monospace'
      }}
    >
      <div className="max-w-2xl w-full px-8">
        {/* Title Box */}
        <div
          className="mb-6 p-8 text-center relative"
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

          <div className="text-6xl mb-4 animate-bounce">⚙️</div>
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
            GENERATING ROOM
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div style={{ width: '60px', height: '4px', backgroundColor: '#8b6f47', borderRadius: '2px' }}></div>
            <span style={{ color: '#8b6f47', fontSize: '18px' }}>★</span>
            <div style={{ width: '60px', height: '4px', backgroundColor: '#8b6f47', borderRadius: '2px' }}></div>
          </div>
        </div>

        {/* Progress Steps */}
        <div
          className="mb-6 p-6"
          style={{
            backgroundColor: '#f4e8d0',
            border: '6px solid #3d2817',
            boxShadow: 'inset 0 4px 0 #fff9e8',
            borderRadius: '4px'
          }}
        >
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div
                key={index}
                className="flex items-center mb-4 last:mb-0"
                style={{
                  opacity: isCompleted ? 0.6 : isActive ? 1 : 0.4,
                  transition: 'opacity 0.3s'
                }}
              >
                {/* Step indicator */}
                <div
                  className={isActive ? 'animate-pulse' : ''}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: isCompleted ? '#6fa85c' : isActive ? '#d4a574' : '#8b6f47',
                    border: '3px solid #3d2817',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    marginRight: '16px',
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? '✓' : step.emoji}
                </div>

                {/* Step label */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: '#3d2817',
                      fontSize: '16px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      lineHeight: '1.5'
                    }}
                  >
                    {step.label}
                  </div>
                  {isActive && (
                    <div
                      style={{
                        color: '#8b6f47',
                        fontSize: '12px',
                        marginTop: '4px'
                      }}
                    >
                      In progress...
                    </div>
                  )}
                </div>

                {/* Checkmark for completed */}
                {isCompleted && (
                  <div
                    style={{
                      color: '#6fa85c',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            backgroundColor: '#c9b896',
            border: '5px solid #8b6f47',
            borderRadius: '4px',
            padding: '16px',
            boxShadow: 'inset 0 3px 0 #e8d4b0'
          }}
        >
          <div
            className="mb-2 text-center"
            style={{
              color: '#3d2817',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {currentStep}
          </div>
          <div
            style={{
              width: '100%',
              height: '24px',
              backgroundColor: '#8b6f47',
              border: '3px solid #3d2817',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.max(progress, 5)}%`,
                backgroundColor: '#6fa85c',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2)'
              }}
            ></div>
          </div>
          <div
            className="mt-2 text-center"
            style={{
              color: '#5c3d2e',
              fontSize: '12px',
              fontStyle: 'italic'
            }}
          >
            ⏱ This may take 10-30 seconds...
          </div>
        </div>
      </div>
    </div>
  );
};
