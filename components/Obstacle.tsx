import React from 'react';
import { Obstacle, ObstacleType } from '../types';
import {
  LANE_DISTANCE,
  OBSTACLE_BASE_WIDTH,
  OBSTACLE_BASE_DEPTH,
  GROUND_Y_POS,
  Z_INDEX_OBSTACLE,
} from '../constants';

interface ObstacleProps {
  obstacle: Obstacle;
}

const Obstacle: React.FC<ObstacleProps> = ({ obstacle }) => {
  const { lane, zPos, type, width, height, depth } = obstacle;

  const xPos = (lane - 1) * LANE_DISTANCE;
  const obstacleBottomOffset = GROUND_Y_POS; // Obstacles sit directly on the ground

  // Tailwind classes for different obstacle types
  const obstacleClasses = {
    short: 'bg-red-600',
    tall: 'bg-yellow-600',
  };

  const currentObstacleClass = obstacleClasses[type] || 'bg-gray-600';

  return (
    <div
      className={`absolute transition-transform ease-linear ${currentObstacleClass}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: '50%',
        bottom: '50%', // Relative to the center of the game-scene
        transform: `
          translateX(calc(-50% + ${xPos}px))
          translateY(${-(obstacleBottomOffset + height / 2)}px)
          translateZ(${zPos}px)
        `,
        zIndex: Z_INDEX_OBSTACLE,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        transitionProperty: 'transform',
        transitionDuration: '75ms', // Match game loop responsiveness
      }}
    ></div>
  );
};

export default Obstacle;
