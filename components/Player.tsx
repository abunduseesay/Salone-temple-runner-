import React from 'react';
import { PlayerState } from '../types';
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT_NORMAL,
  PLAYER_HEIGHT_SLIDING,
  PLAYER_DEPTH,
  LANE_DISTANCE,
  GROUND_Y_POS,
  Z_INDEX_PLAYER,
} from '../constants';

interface PlayerProps {
  playerState: PlayerState;
}

const Player: React.FC<PlayerProps> = ({ playerState }) => {
  const { xPos, yPos, isSliding } = playerState;

  const playerHeight = isSliding ? PLAYER_HEIGHT_SLIDING : PLAYER_HEIGHT_NORMAL;
  const playerBottomOffset = GROUND_Y_POS + playerHeight / 2; // Adjust to sit on the ground visual

  return (
    <div
      className="absolute bg-blue-500 rounded-full transition-all ease-linear"
      style={{
        width: `${PLAYER_WIDTH}px`,
        height: `${playerHeight}px`,
        left: '50%',
        bottom: '50%', // Relative to the center of the game-scene
        transform: `
          translateX(calc(-50% + ${xPos}px))
          translateY(${-(yPos - GROUND_Y_POS) - (isSliding ? 0 : playerHeight / 2)}px)
          translateZ(${PLAYER_DEPTH / 2}px)
        `,
        zIndex: Z_INDEX_PLAYER,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        transitionProperty: 'transform, height',
        transitionDuration: '75ms',
      }}
    >
        {/* Optional: Add a simple face/details to the player */}
        <div className="absolute w-2 h-2 bg-white rounded-full left-1/4 top-1/4"></div>
        <div className="absolute w-2 h-2 bg-white rounded-full right-1/4 top-1/4"></div>
        <div className="absolute w-4 h-1 bg-white rounded-full left-1/2 -translate-x-1/2 bottom-1/4"></div>
    </div>
  );
};

export default Player;
