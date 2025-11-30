import React, { useState, useEffect, useRef, useCallback } from 'react';
import Player from './components/Player';
import Obstacle from './components/Obstacle'; // This is the component
import GameUI from './components/GameUI';
import { useInput } from './services/InputManager';
import { lerp } from './utils/math';
import {
  GameStatus,
  InputAction,
  PlayerState,
  Obstacle as ObstacleInterface, // Renamed Obstacle interface to avoid naming conflict
  ObstacleType,
} from './types';
import {
  INITIAL_PLAYER_STATE,
  INITIAL_GAME_STATUS,
  INITIAL_SCORE,
  FORWARD_SPEED,
  LANE_DISTANCE,
  LANE_CHANGE_SPEED,
  JUMP_FORCE,
  GRAVITY,
  GROUND_Y_POS,
  PLAYER_HEIGHT_NORMAL,
  PLAYER_HEIGHT_SLIDING,
  PLAYER_WIDTH,
  PLAYER_DEPTH, // Added PLAYER_DEPTH import
  SLIDE_DURATION,
  OBSTACLE_SPAWN_DISTANCE_AHEAD,
  OBSTACLE_CULL_DISTANCE_BEHIND,
  MIN_SPAWN_INTERVAL,
  MAX_SPAWN_INTERVAL,
  COLLISION_Z_THRESHOLD,
  COLLISION_BUFFER_Y,
  SCORE_PER_SECOND,
  CAMERA_OFFSET_Y,
  CAMERA_OFFSET_Z,
  CAMERA_TILT_X,
  OBSTACLE_BASE_WIDTH,
  OBSTACLE_BASE_DEPTH,
} from './constants'; // Corrected import source for initial states and PLAYER_DEPTH

const App: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [obstacles, setObstacles] = useState<ObstacleInterface[]>([]); // Use the aliased interface
  const [score, setScore] = useState<number>(INITIAL_SCORE);
  const [gameStatus, setGameStatus] = useState<GameStatus>(INITIAL_GAME_STATUS);

  const lastFrameTime = useRef(performance.now());
  const animationFrameId = useRef<number | null>(null);
  const obstacleSpawnTimerRef = useRef<number>(0);
  const slideTimeoutRef = useRef<number | null>(null);

  const { lastAction, resetAction } = useInput();

  const resetGame = useCallback(() => {
    setPlayerState(INITIAL_PLAYER_STATE);
    setObstacles([]);
    setScore(INITIAL_SCORE);
    setGameStatus(GameStatus.Playing);
    lastFrameTime.current = performance.now();
    obstacleSpawnTimerRef.current = 0; // Reset spawn timer
    if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = null;
    }
  }, []);

  const gameOver = useCallback(() => {
    setGameStatus(GameStatus.GameOver);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = null;
    }
  }, []);

  // Game Loop
  const gameLoop = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTime.current) / 1000;
    lastFrameTime.current = currentTime;

    if (gameStatus !== GameStatus.Playing) {
      return;
    }

    setPlayerState((prevPlayerState) => {
      let newPlayerState = { ...prevPlayerState };

      // 1. Apply forward motion
      newPlayerState.zPos += FORWARD_SPEED * deltaTime;

      // 2. Handle Inputs & Lane Changes
      if (lastAction !== InputAction.None) {
        switch (lastAction) {
          case InputAction.Left:
            newPlayerState.currentLane = Math.max(0, newPlayerState.currentLane - 1);
            break;
          case InputAction.Right:
            newPlayerState.currentLane = Math.min(2, newPlayerState.currentLane + 1);
            break;
          case InputAction.Up:
            if (newPlayerState.isGrounded) {
              newPlayerState.verticalVelocity = JUMP_FORCE;
              newPlayerState.isGrounded = false;
            }
            break;
          case InputAction.Down:
            if (newPlayerState.isGrounded && !newPlayerState.isSliding) {
              newPlayerState.isSliding = true;
              slideTimeoutRef.current = window.setTimeout(() => {
                setPlayerState((p) => ({ ...p, isSliding: false }));
                slideTimeoutRef.current = null;
              }, SLIDE_DURATION * 1000);
            }
            break;
        }
        resetAction(); // Consume the action
      }

      // Calculate target X position for current lane
      const desiredX = (newPlayerState.currentLane - 1) * LANE_DISTANCE;
      newPlayerState.xPos = lerp(newPlayerState.xPos, desiredX, LANE_CHANGE_SPEED * deltaTime);

      // 3. Apply Gravity and Vertical Movement
      newPlayerState.verticalVelocity += GRAVITY * deltaTime;
      newPlayerState.yPos += newPlayerState.verticalVelocity * deltaTime;

      // Ground check
      if (newPlayerState.yPos <= GROUND_Y_POS) {
        newPlayerState.yPos = GROUND_Y_POS;
        if (newPlayerState.verticalVelocity < 0) {
          newPlayerState.verticalVelocity = 0;
          newPlayerState.isGrounded = true;
        }
      } else {
        newPlayerState.isGrounded = false;
      }
      return newPlayerState;
    });

    // 4. Update Obstacles (spawn, move, remove, collision check)
    setObstacles((prevObstacles) => {
      const playerCurrentHeight = playerState.isSliding ? PLAYER_HEIGHT_SLIDING : PLAYER_HEIGHT_NORMAL;

      // Filter out obstacles that are too far behind the player
      const newObstacles = prevObstacles.filter(
        (obs) => obs.zPos > playerState.zPos - OBSTACLE_CULL_DISTANCE_BEHIND
      );

      // Collision detection
      const playerFrontZ = playerState.zPos + PLAYER_DEPTH / 2;
      const playerBackZ = playerState.zPos - PLAYER_DEPTH / 2;
      const playerBottomY = playerState.yPos;
      const playerTopY = playerState.yPos + playerCurrentHeight;

      for (const obs of newObstacles) {
        const obstacleFrontZ = obs.zPos + obs.depth / 2;
        const obstacleBackZ = obs.zPos - obs.depth / 2;
        const obstacleBottomY = obs.zPos; // Obstacles yPos is ground for simplicity
        const obstacleTopY = obs.zPos + obs.height;

        // Check Z-overlap and Lane match
        const zOverlap = playerFrontZ > obstacleBackZ && playerBackZ < obstacleFrontZ;
        const laneMatch = obs.lane === playerState.currentLane;

        if (zOverlap && laneMatch) {
          // Check Y-overlap, considering player sliding
          let yOverlap = playerTopY > (obs.yPos + COLLISION_BUFFER_Y) && playerBottomY < (obs.yPos + obs.height - COLLISION_BUFFER_Y);

          // Specific logic for sliding
          if (playerState.isSliding && obs.type === 'tall') {
            // If sliding, can pass under tall obstacles
            yOverlap = playerTopY > (obs.yPos + obs.height - playerCurrentHeight - COLLISION_BUFFER_Y); // player top must be below obstacle's top part
          } else if (playerState.isSliding && obs.type === 'short') {
            // Sliding still collides with short obstacles
            // The yOverlap should already handle this.
          } else if (!playerState.isSliding && obs.type === 'short') {
            // Not sliding, collides with short obstacles
            // The yOverlap should already handle this.
          } else if (!playerState.isSliding && obs.type === 'tall') {
            // Not sliding, collides with tall obstacles
            // The yOverlap should already handle this.
          }


          if (yOverlap) {
            gameOver();
            break;
          }
        }
      }
      return newObstacles;
    });

    // 5. Update Score
    setScore((prevScore) => prevScore + SCORE_PER_SECOND * deltaTime);

    animationFrameId.current = requestAnimationFrame(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, playerState.isSliding, playerState.currentLane, lastAction, resetAction, gameOver]); // Minimal dependencies for gameLoop

  // Effect to start/stop game loop
  useEffect(() => {
    if (gameStatus === GameStatus.Playing) {
      lastFrameTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop, gameStatus]);

  // Obstacle Spawning Effect
  useEffect(() => {
    if (gameStatus !== GameStatus.Playing) return;

    const spawnObstacle = () => {
      setObstacles((prevObstacles) => {
        const lane = Math.floor(Math.random() * 3); // 0, 1, or 2
        const obstacleTypes: ObstacleType[] = ['short', 'tall'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

        let obstacleHeight;
        let obstacleWidth;
        let obstacleDepth;

        if (type === 'short') {
          obstacleHeight = 30;
          obstacleWidth = OBSTACLE_BASE_WIDTH;
          obstacleDepth = OBSTACLE_BASE_DEPTH;
        } else { // tall
          obstacleHeight = 80;
          obstacleWidth = OBSTACLE_BASE_WIDTH;
          obstacleDepth = OBSTACLE_BASE_DEPTH;
        }

        const newObstacle: ObstacleInterface = { // Use the aliased interface
          id: Date.now() + Math.random(),
          lane,
          zPos: playerState.zPos + OBSTACLE_SPAWN_DISTANCE_AHEAD,
          type,
          width: obstacleWidth,
          height: obstacleHeight,
          depth: obstacleDepth,
        };
        return [...prevObstacles, newObstacle];
      });
      obstacleSpawnTimerRef.current = Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * 1000 + MIN_SPAWN_INTERVAL * 1000;
    };

    const intervalLoop = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastFrameTime.current) / 1000; // Using lastFrameTime to sync with game loop
      obstacleSpawnTimerRef.current -= deltaTime * 1000; // Convert to ms

      if (obstacleSpawnTimerRef.current <= 0) {
        spawnObstacle();
      }
      if (gameStatus === GameStatus.Playing) {
        requestAnimationFrame(intervalLoop);
      }
    };

    // Initialize the first spawn timer and start loop
    obstacleSpawnTimerRef.current = Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * 1000 + MIN_SPAWN_INTERVAL * 1000;
    const initialSpawnFrame = requestAnimationFrame(intervalLoop);

    return () => {
      cancelAnimationFrame(initialSpawnFrame);
    };
  }, [gameStatus, playerState.zPos]); // Re-run if gameStatus changes or playerZ for relative spawn

  // Calculate camera position relative to player
  const cameraZ = playerState.zPos + CAMERA_OFFSET_Z;
  const cameraY = playerState.yPos + CAMERA_OFFSET_Y;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-blue-400 to-blue-800 flex items-center justify-center cursor-pointer"
      style={{ perspective: '800px', WebkitPerspective: '800px' }}
    >
      {/* Game Scene */}
      <div
        className="game-world absolute inset-0 transform-gpu transition-transform duration-75 ease-linear"
        style={{
          transform: `
            translateZ(${cameraZ}px)
            translateY(${cameraY - (window.innerHeight / 2)}px)
            rotateX(${CAMERA_TILT_X}deg)
          `,
          transformOrigin: 'center center',
          WebkitTransform: `
            translateZ(${cameraZ}px)
            translateY(${cameraY - (window.innerHeight / 2)}px)
            rotateX(${CAMERA_TILT_X}deg)
          `,
          WebkitTransformOrigin: 'center center',
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Road (Ground Plane) */}
        <div
          className="absolute w-full h-[2000px] bg-gray-700 left-1/2 -translate-x-1/2"
          style={{
            transform: `translateZ(0px) translateY(calc(50% + ${GROUND_Y_POS}px)) rotateX(90deg)`,
            transformOrigin: 'top center',
            // Repeating texture for road lines
            backgroundImage: `repeating-linear-gradient(
                90deg,
                #222 0%,
                #222 1%,
                transparent 1%,
                transparent 3%
            )`,
            backgroundSize: `${LANE_DISTANCE}px 100%`, // Each lane segment for vertical lines
            backgroundPosition: `center center`,
          }}
        >
          {/* Lane Dividers */}
          <div className="absolute inset-0 flex justify-evenly items-center">
            {Array(2).fill(null).map((_, i) => (
                <div key={i} className="w-4 h-full bg-white opacity-50 shadow-md"
                    style={{
                        transform: 'translateZ(1px)', // Slightly above road
                        left: `${(i + 1) * (100 / 3)}%`, // Position for two dividers
                        marginLeft: '-8px', // Center the divider
                        boxShadow: '0 0 5px rgba(255,255,255,0.7)',
                        position: 'absolute',
                    }}></div>
            ))}
          </div>
        </div>

        <Player playerState={playerState} />
        {obstacles.map((obstacle) => (
          <Obstacle key={obstacle.id} obstacle={obstacle} />
        ))}
      </div>

      {/* Game UI */}
      <GameUI score={score} gameStatus={gameStatus} onRestart={resetGame} />
    </div>
  );
};

export default App;