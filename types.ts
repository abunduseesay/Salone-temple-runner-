export enum GameStatus {
  Playing = 'playing',
  GameOver = 'gameOver',
  Paused = 'paused',
}

export enum InputAction {
  None,
  Left,
  Right,
  Up,
  Down,
}

export interface PlayerState {
  xPos: number; // Horizontal position on the road
  yPos: number; // Vertical position (jump/gravity)
  zPos: number; // Forward progress in the game world
  currentLane: number; // 0=left, 1=center, 2=right
  verticalVelocity: number;
  isGrounded: boolean;
  isSliding: boolean;
}

export type ObstacleType = 'short' | 'tall';

export interface Obstacle {
  id: number;
  lane: number; // 0=left, 1=center, 2=right
  zPos: number; // Z position in the game world
  type: ObstacleType;
  width: number; // Visual width
  height: number; // Visual height
  depth: number; // Visual depth
}
