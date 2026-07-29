export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

export interface InputState {
  primaryActionDown: boolean;
  primaryActionPressed: boolean;
}

export interface Theme {
  background: string;
  ground: string;
  player: string;
  obstacle: string;
  text: string;
  accent: string;
}

export interface GameInitContext {
  canvas: HTMLCanvasElement;
  viewport: Viewport;
  theme: Theme;
  seed?: number;
  /** Best score persisted from previous sessions, if any (see `persistHighScore`). */
  highScore?: number;
}

export interface Game<TState = unknown> {
  readonly id: string;
  init(ctx: GameInitContext): TState;
  update(state: TState, dt: number, input: InputState): TState;
  render(ctx: CanvasRenderingContext2D, state: TState, viewport: Viewport): void;
  destroy(state: TState): void;
  isGameOver?(state: TState): boolean;
  getScore?(state: TState): number;
}

export interface GameConfig {
  /** Registered game id, default 'dino-runner'. */
  game?: string;
  /** Milliseconds of loading before the game is shown, default 1500. */
  threshold?: number;
  /** Minimum milliseconds the game stays visible once shown before the continue affordance can appear, default 3000. */
  minPlayMs?: number;
  /** Grace period, in ms, the continue affordance waits for a manual action before auto-dismissing, default 30000. */
  maxPlayMs?: number;
  /** Label for the manual continue button/affordance, default 'Continue →'. */
  continueLabel?: string;
  /** Persist the best score across sessions via localStorage, default true. */
  persistHighScore?: boolean;
  /** Storage key for the persisted high score, default `boredload:${game}`. */
  highScoreKey?: string;
  /** Skip the game entirely and stay in spinner mode when the OS/browser requests reduced motion, default true. */
  respectReducedMotion?: boolean;
  /** Opt in to shortening `threshold` on a confirmed-slow connection (Network Information API), default false. */
  adaptiveThreshold?: boolean;
  /** Threshold used instead of `threshold` when a slow connection is detected and `adaptiveThreshold` is true, default 500. */
  slowConnectionThresholdMs?: number;
  /** Fires when the game is dismissed (manual continue click or maxPlayMs auto-dismiss), with the score at that moment. */
  onGameOver?: (score: number) => void;
  /** Fires once loading has finished and minPlayMs has elapsed, i.e. the continue affordance just became available. */
  onReadyToContinue?: () => void;
  /** Fires when the widget is dismissed, regardless of score — useful for hiding the loading UI / analytics. */
  onExit?: () => void;
  theme?: Partial<Theme>;
  seed?: number;
}

export interface LoadingGameProps extends GameConfig {
  isLoading: boolean;
  width?: number;
  height?: number;
  className?: string;
}
