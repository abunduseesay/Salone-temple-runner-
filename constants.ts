import { PlayerState, GameStatus } from './types';

// Game Mechanics
export const FORWARD_SPEED = 8; // Units per second
export const LANE_DISTANCE = 50; // Pixels distance between lanes
export const LANE_CHANGE_SPEED = 10; // How fast player moves horizontally
export const JUMP_FORCE = 100; // Initial upward velocity for jump
export const GRAVITY = -300; // Pixels per second squared

export const GROUND_Y_POS = 0; // The Y position considered "grounded"
export const PLAYER_HEIGHT_NORMAL = 50;
export const PLAYER_HEIGHT_SLIDING = 20;
export const PLAYER_WIDTH = 30;
export const PLAYER_DEPTH = 30;

export const SLIDE_DURATION = 0.8; // Seconds

// Obstacle Spawning
export const OBSTACLE_SPAWN_DISTANCE_AHEAD = -500; // How far ahead of player to spawn (negative Z, so further away)
export const OBSTACLE_CULL_DISTANCE_BEHIND = 50; // How far behind player to remove obstacles
export const MIN_SPAWN_INTERVAL = 0.8; // Seconds
export const MAX_SPAWN_INTERVAL = 1.6; // Seconds
export const OBSTACLE_Z_OFFSET_PER_UNIT = 1; // 1 unit in game Z = 1px in CSS translateZ

// Collision Detection
export const COLLISION_Z_THRESHOLD = 50; // How close in Z before collision check
export const COLLISION_BUFFER_Y = 10; // Vertical buffer for collisions

// Score
export const SCORE_PER_SECOND = 5;

// Camera
export const CAMERA_OFFSET_Y = 150; // Camera Y offset from player
export const CAMERA_OFFSET_Z = 200; // Camera Z offset from player (positive means camera is behind player, so world moves less negative)
export const CAMERA_TILT_X = 10; // Degrees rotation around X axis for perspective

// Input
export const SWIPE_THRESHOLD = 50; // Pixels for swipe detection

// Initial States
export const INITIAL_PLAYER_STATE: PlayerState = {
  xPos: 0,
  yPos: GROUND_Y_POS,
  zPos: 0,
  currentLane: 1, // 0 = left, 1 = center, 2 = right
  verticalVelocity: 0,
  isGrounded: true,
  isSliding: false,
};

export const INITIAL_GAME_STATUS = GameStatus.Playing;
export const INITIAL_SCORE = 0;

// Visuals
export const ROAD_WIDTH = LANE_DISTANCE * 3; // Total visual width of the road
export const ROAD_DEPTH = 2000; // Visual depth of the road plane
export const OBSTACLE_BASE_WIDTH = 40;
export const OBSTACLE_BASE_DEPTH = 40;

// Z-index for rendering order (closer objects have higher Z-index)
export const Z_INDEX_PLAYER = 100;
export const Z_INDEX_OBSTACLE = 50;

