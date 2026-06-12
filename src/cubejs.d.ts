// cubejs ships no types; we only use the static solver entry points.
declare module "cubejs" {
  export default class Cube {
    static initSolver(): void;
    static fromString(facelets: string): Cube;
    solve(maxDepth?: number): string;
    isSolved(): boolean;
  }
}
