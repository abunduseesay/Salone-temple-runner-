import React from 'react';
import { GameStatus } from '../types';

interface GameUIProps {
  score: number;
  gameStatus: GameStatus;
  onRestart: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ score, gameStatus, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-4xl font-bold tracking-wider">
        {Math.floor(score).toString()}
      </div>

      {/* Game Over UI */}
      {gameStatus === GameStatus.GameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50 pointer-events-auto">
          <h2 className="text-red-500 text-6xl font-extrabold mb-6 animate-pulse">GAME OVER</h2>
          <p className="text-white text-3xl mb-8">Final Score: {Math.floor(score)}</p>
          <button
            onClick={onRestart}
            className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-lg shadow-lg transform transition-transform duration-200 active:scale-95"
          >
            RESTART
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
