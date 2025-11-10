import { Position } from "./types";

/**
 * Pathfinder class wrapper for grid-based pathfinding
 * Provides BFS pathfinding for agent movement
 */
export class Pathfinder {
  private width: number;
  private height: number;
  private blocked: Set<string> = new Set();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Set blocked tiles (colliders)
   */
  public setBlocked(positions: Position[]): void {
    this.blocked.clear();
    positions.forEach((pos) => {
      this.blocked.add(`${pos.x},${pos.y}`);
    });
  }

  /**
   * Add a blocked tile
   */
  public addBlocked(pos: Position): void {
    this.blocked.add(`${pos.x},${pos.y}`);
  }

  /**
   * Remove a blocked tile
   */
  public removeBlocked(pos: Position): void {
    this.blocked.delete(`${pos.x},${pos.y}`);
  }

  /**
   * Find path between two positions using BFS
   */
  public findPath(start: Position, goal: Position): Position[] {
    return findPath(start, goal, this.width, this.height, this.blocked);
  }

  /**
   * Check if a position is blocked
   */
  public isBlocked(pos: Position): boolean {
    return this.blocked.has(`${pos.x},${pos.y}`);
  }

  /**
   * Check if position is valid (within bounds)
   */
  public isValid(pos: Position): boolean {
    return (
      pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height
    );
  }
}

/**
 * Breadth-First Search pathfinding (from Gather Clone)
 * Finds shortest path between two points on the grid
 * Avoids colliders and boundaries
 */
export function findPath(
  start: Position,
  goal: Position,
  width: number,
  height: number,
  blocked: Set<string> = new Set(),
): Position[] {
  // Check if goal is blocked
  if (blocked.has(`${goal.x},${goal.y}`)) {
    return [];
  }

  // If start equals goal, return empty path
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  // BFS queue: [position, path]
  const queue: [Position, Position[]][] = [[start, [start]]];
  const visited = new Set<string>(blocked);
  visited.add(`${start.x},${start.y}`);

  // 4-directional movement (up, down, left, right)
  const directions: Position[] = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
  ];

  while (queue.length > 0) {
    const [currentPos, path] = queue.shift()!;

    // Check if we reached the goal
    if (currentPos.x === goal.x && currentPos.y === goal.y) {
      // Return path excluding the starting position
      return path.slice(1);
    }

    // Explore neighbors
    for (const dir of directions) {
      const nextPos: Position = {
        x: currentPos.x + dir.x,
        y: currentPos.y + dir.y,
      };

      const key = `${nextPos.x},${nextPos.y}`;

      // Skip if already visited
      if (visited.has(key)) continue;

      // Skip if out of bounds
      if (
        nextPos.x < 0 ||
        nextPos.x >= width ||
        nextPos.y < 0 ||
        nextPos.y >= height
      ) {
        continue;
      }

      visited.add(key);
      queue.push([nextPos, path.concat([nextPos])]);
    }
  }

  // No path found
  return [];
}

/**
 * Check if a tile position has line of sight to another
 * Useful for proximity-based actions
 */
export function hasLineOfSight(
  from: Position,
  to: Position,
  width: number,
  height: number,
  blocked: Set<string> = new Set(),
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) return true;

  for (let i = 0; i <= steps; i++) {
    const x = Math.round(from.x + (dx * i) / steps);
    const y = Math.round(from.y + (dy * i) / steps);

    // Check bounds
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return false;
    }

    // Check if blocked
    if (blocked.has(`${x},${y}`)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(from: Position, to: Position): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

/**
 * Get all tiles in a circular radius (for proximity checks)
 */
export function getTilesInRadius(center: Position, radius: number): Position[] {
  const tiles: Position[] = [];

  for (let x = center.x - radius; x <= center.x + radius; x++) {
    for (let y = center.y - radius; y <= center.y + radius; y++) {
      const dist = manhattanDistance(center, { x, y });
      if (dist <= radius) {
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
}

/**
 * Get all adjacent tiles (4-directional)
 */
export function getAdjacentTiles(pos: Position): Position[] {
  return [
    { x: pos.x, y: pos.y - 1 }, // up
    { x: pos.x, y: pos.y + 1 }, // down
    { x: pos.x - 1, y: pos.y }, // left
    { x: pos.x + 1, y: pos.y }, // right
  ];
}
