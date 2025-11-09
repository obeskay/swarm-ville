import { Position } from "./types";

interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // g + h
  parent?: Node;
}

export class Pathfinder {
  private width: number;
  private height: number;
  private obstacles: Set<string>;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.obstacles = new Set();
  }

  public addObstacle(pos: Position): void {
    this.obstacles.add(`${pos.x},${pos.y}`);
  }

  public removeObstacle(pos: Position): void {
    this.obstacles.delete(`${pos.x},${pos.y}`);
  }

  public findPath(start: Position, goal: Position): Position[] {
    const openSet = new Set<string>();
    const cameFrom = new Map<string, Position>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    const key = (pos: Position) => `${pos.x},${pos.y}`;
    const heuristic = (pos: Position) => {
      const dx = Math.abs(pos.x - goal.x);
      const dy = Math.abs(pos.y - goal.y);
      return dx + dy; // Manhattan distance
    };

    const startKey = key(start);
    openSet.add(startKey);
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start));

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      let current = start;
      let currentKey = startKey;
      let lowestF = Infinity;

      openSet.forEach((k) => {
        const f = fScore.get(k) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          currentKey = k;
          const [x, y] = k.split(",").map(Number);
          current = { x, y };
        }
      });

      if (current.x === goal.x && current.y === goal.y) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(currentKey);

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (this.obstacles.has(key(neighbor))) continue;

        const tentativeG = (gScore.get(currentKey) || 0) + 1;
        const neighborKey = key(neighbor);
        const currentG = gScore.get(neighborKey) || Infinity;

        if (tentativeG < currentG) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(
            neighborKey,
            tentativeG + heuristic(neighbor)
          );

          if (!openSet.has(neighborKey)) {
            openSet.add(neighborKey);
          }
        }
      }
    }

    // No path found, return direct line
    return this.getDirectPath(start, goal);
  }

  private getNeighbors(pos: Position): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      // Diagonals
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: -1 },
      { x: -1, y: 1 },
    ];

    for (const dir of directions) {
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (
        newPos.x >= 0 &&
        newPos.x < this.width &&
        newPos.y >= 0 &&
        newPos.y < this.height
      ) {
        neighbors.push(newPos);
      }
    }

    return neighbors;
  }

  private reconstructPath(
    cameFrom: Map<string, Position>,
    current: Position
  ): Position[] {
    const path: Position[] = [current];

    while (cameFrom.has(`${current.x},${current.y}`)) {
      current = cameFrom.get(`${current.x},${current.y}`)!;
      path.unshift(current);
    }

    return path;
  }

  private getDirectPath(start: Position, goal: Position): Position[] {
    const path: Position[] = [start];
    let current = { ...start };

    while (current.x !== goal.x || current.y !== goal.y) {
      if (current.x < goal.x) current.x++;
      else if (current.x > goal.x) current.x--;

      if (current.y < goal.y) current.y++;
      else if (current.y > goal.y) current.y--;

      path.push({ ...current });
    }

    return path;
  }
}
