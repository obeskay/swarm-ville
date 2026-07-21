export interface Point {
  x: number;
  y: number;
}

export class Pathfinder {
  readonly COLS = 28;
  readonly ROWS = 18;
  readonly TILE = 32;

  private grid: boolean[][]; // true = walkable, false = obstacle

  constructor() {
    this.grid = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(true));
  }

  setObstacle(col: number, row: number, isObstacle = true) {
    if (col >= 0 && col < this.COLS && row >= 0 && row < this.ROWS) {
      this.grid[row][col] = !isObstacle;
    }
  }

  isWalkable(col: number, row: number): boolean {
    if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return false;
    return this.grid[row][col];
  }

  // Convert pixel coordinate to grid cell
  toCell(x: number, y: number): Point {
    return {
      x: Math.max(0, Math.min(this.COLS - 1, Math.floor(x / this.TILE))),
      y: Math.max(0, Math.min(this.ROWS - 1, Math.floor(y / this.TILE)))
    };
  }

  // Convert grid cell to pixel center coordinate
  toWorld(col: number, row: number): Point {
    return {
      x: col * this.TILE + this.TILE / 2,
      y: row * this.TILE + this.TILE / 2
    };
  }

  // A* Pathfinding implementation
  findPath(startX: number, startY: number, targetX: number, targetY: number): Point[] {
    const start = this.toCell(startX, startY);
    const target = this.toCell(targetX, targetY);

    // If target cell is blocked, find closest walkable adjacent cell
    let endCell = target;
    if (!this.isWalkable(endCell.x, endCell.y)) {
      const neighbors = [
        { x: endCell.x + 1, y: endCell.y },
        { x: endCell.x - 1, y: endCell.y },
        { x: endCell.x, y: endCell.y + 1 },
        { x: endCell.x, y: endCell.y - 1 }
      ].filter(n => this.isWalkable(n.x, n.y));

      if (neighbors.length > 0) {
        endCell = neighbors[0];
      } else {
        return [{ x: targetX, y: targetY }];
      }
    }

    interface Node {
      x: number;
      y: number;
      g: number;
      h: number;
      f: number;
      parent: Node | null;
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();

    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: Math.abs(start.x - endCell.x) + Math.abs(start.y - endCell.y),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    while (openList.length > 0) {
      // Sort to get node with lowest f cost
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      if (current.x === endCell.x && current.y === endCell.y) {
        // Reconstruct path
        const path: Point[] = [];
        let curr: Node | null = current;
        while (curr) {
          path.unshift(this.toWorld(curr.x, curr.y));
          curr = curr.parent;
        }
        return path;
      }

      closedSet.add(`${current.x},${current.y}`);

      // 4-Directional Neighbors
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const n of neighbors) {
        if (!this.isWalkable(n.x, n.y) || closedSet.has(`${n.x},${n.y}`)) {
          continue;
        }

        const g = current.g + 1;
        const h = Math.abs(n.x - endCell.x) + Math.abs(n.y - endCell.y);
        const f = g + h;

        const existingOpen = openList.find(o => o.x === n.x && o.y === n.y);
        if (existingOpen) {
          if (g < existingOpen.g) {
            existingOpen.g = g;
            existingOpen.f = f;
            existingOpen.parent = current;
          }
        } else {
          openList.push({ x: n.x, y: n.y, g, h, f, parent: current });
        }
      }
    }

    // Direct path fallback if no grid route found
    return [{ x: targetX, y: targetY }];
  }
}
