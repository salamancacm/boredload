import { resizeCanvasToDisplaySize } from './canvas';
import { getHighScore, setHighScore } from './highScore';
import { InputController } from './input';
import type { Game, Theme, Viewport } from './types';

const MAX_DT = 0.05;

const DEFAULT_THEME: Theme = {
  background: '#0f172a',
  ground: '#334155',
  player: '#38bdf8',
  obstacle: '#f472b6',
  text: '#e2e8f0',
  accent: '#facc15',
};

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  game: Game;
  width: number;
  height: number;
  theme?: Partial<Theme>;
  seed?: number;
  /** Persist the best score across sessions via localStorage, default true. */
  persistHighScore?: boolean;
  /** Storage key for the persisted high score, default `boredload:${game.id}`. */
  highScoreKey?: string;
}

/**
 * Drives a `Game` implementation with a requestAnimationFrame loop:
 * clamps dt, feeds normalized input, and owns canvas DPR scaling.
 * `destroy()` is idempotent so React 18 StrictMode's double-invoke effect
 * cleanup is safe.
 */
export class GameEngine<TState = unknown> {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private game: Game<TState>;
  private theme: Theme;
  private input: InputController;
  private viewport: Viewport;
  private state: TState;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private running = false;
  private destroyed = false;
  private persistHighScore: boolean;
  private highScoreKey: string;
  private highScore: number;

  constructor(options: GameEngineOptions) {
    this.canvas = options.canvas;
    this.theme = { ...DEFAULT_THEME, ...options.theme };
    this.viewport = resizeCanvasToDisplaySize(this.canvas, options.width, options.height);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('boredload: could not acquire a 2D canvas context');
    }
    this.ctx = ctx;

    this.input = new InputController(this.canvas, this.viewport.width);
    this.game = options.game as Game<TState>;
    this.persistHighScore = options.persistHighScore ?? true;
    this.highScoreKey = options.highScoreKey ?? `boredload:${this.game.id}`;
    this.highScore = this.persistHighScore ? getHighScore(this.highScoreKey) : 0;
    this.state = this.game.init({
      canvas: this.canvas,
      viewport: this.viewport,
      theme: this.theme,
      seed: options.seed,
      highScore: this.highScore,
    });
  }

  private tick = (time: number): void => {
    if (!this.running) return;

    if (this.lastTime === null) {
      this.lastTime = time;
    }
    const dt = Math.min(MAX_DT, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;

    const input = this.input.getState();
    this.state = this.game.update(this.state, dt, input);
    this.game.render(this.ctx, this.state, this.viewport);

    if (this.persistHighScore) {
      const currentScore = this.game.getScore ? this.game.getScore(this.state) : 0;
      if (currentScore > this.highScore) {
        this.highScore = setHighScore(this.highScoreKey, currentScore);
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  start(): void {
    if (this.destroyed || this.running) return;
    this.running = true;
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.viewport = resizeCanvasToDisplaySize(this.canvas, width, height, this.viewport.dpr);
    this.input.setLogicalWidth(width);
  }

  setTheme(theme: Partial<Theme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  getScore(): number {
    return this.game.getScore ? this.game.getScore(this.state) : 0;
  }

  getHighScore(): number {
    return this.highScore;
  }

  isGameOver(): boolean {
    return this.game.isGameOver ? this.game.isGameOver(this.state) : false;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this.input.destroy();
    this.game.destroy(this.state);
  }
}
