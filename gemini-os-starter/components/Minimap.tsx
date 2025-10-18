/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import React from 'react';
import { DungeonGrid, GridPosition, Room } from '../types';

interface MinimapProps {
  dungeonGrid: DungeonGrid;
  currentPosition: GridPosition;
  rooms: Map<string, Room>;
}

export const Minimap: React.FC<MinimapProps> = ({ dungeonGrid, currentPosition, rooms }) => {
  const cellSize = 24; // Size of each cell in pixels
  const gridSize = dungeonGrid.size;

  // Get room type color
  const getRoomTypeColor = (roomType: string, isVisited: boolean): string => {
    if (!isVisited) return '#1f2937'; // Dark gray for unvisited

    switch (roomType) {
      case 'start':
        return '#10b981'; // Green
      case 'boss':
        return '#ef4444'; // Red
      case 'treasure':
        return '#f59e0b'; // Amber
      case 'safe':
        return '#3b82f6'; // Blue
      case 'puzzle':
        return '#8b5cf6'; // Purple
      case 'combat':
      default:
        return '#6b7280'; // Gray
    }
  };

  // Get room ID from grid coordinates
  const getRoomId = (gridX: number, gridY: number): string => {
    return `room_${gridX}_${gridY}`;
  };

  // Check if a cell is accessible (has at least one exit)
  const isAccessible = (cell: any): boolean => {
    return cell.exits.north || cell.exits.south || cell.exits.east || cell.exits.west;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 shadow-lg">
      <div className="text-white text-sm font-bold mb-2 text-center">Dungeon Map</div>
      <svg
        width={gridSize * cellSize + 2}
        height={gridSize * cellSize + 2}
        className="border border-gray-600 rounded"
      >
        {/* Draw grid cells */}
        {dungeonGrid.cells.map((row, y) =>
          row.map((cell, x) => {
            const roomId = getRoomId(cell.gridX, cell.gridY);
            const room = rooms.get(roomId);
            const isVisited = room?.visited || false;
            const isCurrent = currentPosition.gridX === cell.gridX && currentPosition.gridY === cell.gridY;
            const accessible = isAccessible(cell);

            if (!accessible) {
              // Don't render inaccessible cells
              return null;
            }

            const fillColor = getRoomTypeColor(cell.roomType, isVisited);

            return (
              <g key={`${x}-${y}`}>
                {/* Cell background */}
                <rect
                  x={x * cellSize + 1}
                  y={y * cellSize + 1}
                  width={cellSize}
                  height={cellSize}
                  fill={fillColor}
                  stroke={isCurrent ? '#000000' : '#374151'}
                  strokeWidth={isCurrent ? '3' : '1'}
                />

                {/* Current position indicator */}
                {isCurrent && (
                  <circle
                    cx={x * cellSize + cellSize / 2 + 1}
                    cy={y * cellSize + cellSize / 2 + 1}
                    r="6"
                    fill="#fff"
                    className="animate-pulse"
                  />
                )}

                {/* Draw exits as small lines */}
                {isVisited && (
                  <>
                    {/* North exit */}
                    {cell.exits.north && (
                      <line
                        x1={x * cellSize + cellSize / 2 + 1}
                        y1={y * cellSize + 1}
                        x2={x * cellSize + cellSize / 2 + 1}
                        y2={y * cellSize + 1}
                        stroke="#60a5fa"
                        strokeWidth="2"
                      />
                    )}
                    {/* South exit */}
                    {cell.exits.south && (
                      <line
                        x1={x * cellSize + cellSize / 2 + 1}
                        y1={(y + 1) * cellSize + 1}
                        x2={x * cellSize + cellSize / 2 + 1}
                        y2={(y + 1) * cellSize + 1}
                        stroke="#60a5fa"
                        strokeWidth="2"
                      />
                    )}
                    {/* West exit */}
                    {cell.exits.west && (
                      <line
                        x1={x * cellSize + 1}
                        y1={y * cellSize + cellSize / 2 + 1}
                        x2={x * cellSize + 1}
                        y2={y * cellSize + cellSize / 2 + 1}
                        stroke="#60a5fa"
                        strokeWidth="2"
                      />
                    )}
                    {/* East exit */}
                    {cell.exits.east && (
                      <line
                        x1={(x + 1) * cellSize + 1}
                        y1={y * cellSize + cellSize / 2 + 1}
                        x2={(x + 1) * cellSize + 1}
                        y2={y * cellSize + cellSize / 2 + 1}
                        stroke="#60a5fa"
                        strokeWidth="2"
                      />
                    )}
                  </>
                )}

                {/* Room type icon (for special rooms) */}
                {isVisited && (
                  <text
                    x={x * cellSize + cellSize / 2 + 1}
                    y={y * cellSize + cellSize / 2 + 5}
                    fontSize="10"
                    textAnchor="middle"
                    fill="white"
                  >
                    {cell.roomType === 'boss' && '👑'}
                    {cell.roomType === 'treasure' && '💎'}
                    {cell.roomType === 'safe' && '🏛'}
                    {cell.roomType === 'puzzle' && '🧩'}
                    {cell.roomType === 'start' && '🏰'}
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div className="mt-3 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-700 rounded border-2 border-black"></div>
          <span className="text-gray-300">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-300">Start</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-300">Boss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span className="text-gray-300">Treasure</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-300">Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-gray-300">Puzzle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span className="text-gray-300">Combat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-800 rounded"></div>
          <span className="text-gray-300">Unexplored</span>
        </div>
      </div>
    </div>
  );
};
