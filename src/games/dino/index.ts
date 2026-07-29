import type { Game, GameInitContext, InputState, Theme, Viewport } from '../../core/types';
import { checkCollisions } from './collision';
import { moveObstacles, nextSpawnGap, shouldSpawn, spawnObstacle } from './obstacles';
import { applyJump, stepPlayer } from './physics';
import { renderDino } from './render';
import { BASE_SPEED, createInitialState, type DinoState } from './state';
import { DINO_DEFAULT_THEME } from './theme';

const SPEED_RAMP_PER_SEC = 4;
const SCORE_PER_SEC = 10;

export class DinoGame implements Game<DinoState> {
  readonly id = 'dino-runner';
  private theme: Theme = DINO_DEFAULT_THEME;
  private spawnGap = 0;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private bestScore = 0;

  init(ctx: GameInitContext): DinoState {
    this.theme = { ...DINO_DEFAULT_THEME, ...ctx.theme };
    this.viewportWidth = ctx.viewport.width;
    this.viewportHeight = ctx.viewport.height;
    this.bestScore = ctx.highScore ?? 0;
    const state = createInitialState(ctx.viewport.width, ctx.viewport.height, ctx.seed, this.bestScore);
    this.spawnGap = nextSpawnGap(state.rng, state.speed, BASE_SPEED);
    return state;
  }

  update(state: DinoState, dt: number, input: InputState): DinoState {
    if (state.status === 'gameover') {
      if (input.primaryActionPressed) {
        const restarted = createInitialState(
          this.viewportWidth,
          this.viewportHeight,
          Date.now(),
          this.bestScore,
        );
        this.spawnGap = nextSpawnGap(restarted.rng, restarted.speed, BASE_SPEED);
        return restarted;
      }
      return state;
    }

    let player = state.player;
    if (input.primaryActionPressed) {
      player = applyJump(player);
    }
    player = stepPlayer(player, dt, state.groundY);

    const speed = state.speed + SPEED_RAMP_PER_SEC * dt;
    let obstacles = moveObstacles(state.obstacles, speed, dt);
    let distanceSinceSpawn = state.distanceSinceSpawn + speed * dt;

    if (shouldSpawn(distanceSinceSpawn, this.spawnGap)) {
      obstacles = [...obstacles, spawnObstacle(state.rng, state.groundY, this.viewportWidth)];
      distanceSinceSpawn = 0;
      this.spawnGap = nextSpawnGap(state.rng, speed, BASE_SPEED);
    }

    let score = state.score + SCORE_PER_SEC * dt;
    obstacles = obstacles.map((o) => {
      if (!o.passed && o.x + o.width < player.x) {
        score += 1;
        return { ...o, passed: true };
      }
      return o;
    });

    const gameOver = checkCollisions(player, obstacles);
    if (score > this.bestScore) {
      this.bestScore = score;
    }

    return {
      ...state,
      player,
      obstacles,
      speed,
      elapsed: state.elapsed + dt,
      score,
      bestScore: this.bestScore,
      status: gameOver ? 'gameover' : 'running',
      distanceSinceSpawn,
    };
  }

  render(ctx: CanvasRenderingContext2D, state: DinoState, viewport: Viewport): void {
    renderDino(ctx, state, viewport, this.theme);
  }

  destroy(): void {
    // No external resources held by DinoState itself.
  }

  isGameOver(state: DinoState): boolean {
    return state.status === 'gameover';
  }

  getScore(state: DinoState): number {
    return Math.floor(state.score);
  }
}
