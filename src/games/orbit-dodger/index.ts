import type { Game, GameInitContext, InputState, Theme, Viewport } from '../../core/types';
import { checkCollisions } from './collision';
import { moveFallers, nextSpawnDelay, shouldSpawn, spawnFaller } from './fallers';
import { stepShip } from './movement';
import { renderOrbit } from './render';
import { BASE_FALL_SPEED, createInitialState, type OrbitState } from './state';
import { ORBIT_DEFAULT_THEME } from './theme';

const FALL_SPEED_RAMP_PER_SEC = 2;
const SCORE_PER_SEC = 8;

export class OrbitDodgerGame implements Game<OrbitState> {
  readonly id = 'orbit-dodger';
  private theme: Theme = ORBIT_DEFAULT_THEME;
  private spawnDelay = 0;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private bestScore = 0;

  init(ctx: GameInitContext): OrbitState {
    this.theme = { ...ORBIT_DEFAULT_THEME, ...ctx.theme };
    this.viewportWidth = ctx.viewport.width;
    this.viewportHeight = ctx.viewport.height;
    this.bestScore = ctx.highScore ?? 0;
    const state = createInitialState(
      ctx.viewport.width,
      ctx.viewport.height,
      ctx.seed,
      this.bestScore,
    );
    this.spawnDelay = nextSpawnDelay(state.rng, state.fallSpeed, BASE_FALL_SPEED);
    return state;
  }

  update(state: OrbitState, dt: number, input: InputState): OrbitState {
    if (state.status === 'gameover') {
      if (input.primaryActionPressed) {
        const restarted = createInitialState(
          this.viewportWidth,
          this.viewportHeight,
          Date.now(),
          this.bestScore,
        );
        this.spawnDelay = nextSpawnDelay(restarted.rng, restarted.fallSpeed, BASE_FALL_SPEED);
        return restarted;
      }
      return state;
    }

    const ship = stepShip(state.ship, dt, input, this.viewportWidth);

    const fallSpeed = state.fallSpeed + FALL_SPEED_RAMP_PER_SEC * dt;
    let fallers = moveFallers(state.fallers, dt, this.viewportHeight);
    let timeSinceSpawn = state.timeSinceSpawn + dt;

    if (shouldSpawn(timeSinceSpawn, this.spawnDelay)) {
      fallers = [...fallers, spawnFaller(state.rng, this.viewportWidth, fallSpeed)];
      timeSinceSpawn = 0;
      this.spawnDelay = nextSpawnDelay(state.rng, fallSpeed, BASE_FALL_SPEED);
    }

    let score = state.score + SCORE_PER_SEC * dt;
    fallers = fallers.map((f) => {
      if (!f.passed && f.y > ship.y + ship.height) {
        score += 1;
        return { ...f, passed: true };
      }
      return f;
    });

    const gameOver = checkCollisions(ship, fallers);
    if (score > this.bestScore) {
      this.bestScore = score;
    }

    return {
      ...state,
      ship,
      fallers,
      fallSpeed,
      elapsed: state.elapsed + dt,
      score,
      bestScore: this.bestScore,
      status: gameOver ? 'gameover' : 'running',
      timeSinceSpawn,
    };
  }

  render(ctx: CanvasRenderingContext2D, state: OrbitState, viewport: Viewport): void {
    renderOrbit(ctx, state, viewport, this.theme);
  }

  destroy(): void {
    // No external resources held by OrbitState itself.
  }

  isGameOver(state: OrbitState): boolean {
    return state.status === 'gameover';
  }

  getScore(state: OrbitState): number {
    return Math.floor(state.score);
  }
}
