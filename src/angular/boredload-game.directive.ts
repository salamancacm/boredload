import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import type { Theme } from 'boredload';
import { BoredloadGameController } from './boredload-game.controller';

/**
 * Attribute directive: attach to any host element to turn it into the
 * boredload loading widget. Thin shell over `BoredloadGameController` — no
 * logic of its own beyond wiring Inputs/Outputs, so behavior matches the
 * core and React wrapper exactly (and the real logic stays unit-testable
 * outside Angular's compiler).
 *
 * ```html
 * <div
 *   boredload
 *   [isLoading]="isLoading"
 *   [threshold]="1500"
 *   (gameOver)="onGameOver($event)"
 * ></div>
 * ```
 */
@Directive({
  selector: '[boredload]',
  standalone: true,
})
export class BoredloadGameDirective implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) isLoading = false;

  @Input() game?: string;
  @Input() threshold?: number;
  @Input() minPlayMs?: number;
  @Input() maxPlayMs?: number;
  @Input() continueLabel?: string;
  @Input() theme?: Partial<Theme>;
  @Input() seed?: number;
  @Input() width?: number;
  @Input() height?: number;
  @Input() persistHighScore?: boolean;
  @Input() highScoreKey?: string;
  @Input() respectReducedMotion?: boolean;
  @Input() adaptiveThreshold?: boolean;
  @Input() slowConnectionThresholdMs?: number;

  /** Fires with the score at the moment the game is dismissed. */
  @Output() gameOver = new EventEmitter<number>();
  /** Fires once the "Continue" affordance becomes available. */
  @Output() readyToContinue = new EventEmitter<void>();
  /** Fires when the widget is dismissed (manual continue or maxPlayMs timeout). */
  @Output() exit = new EventEmitter<void>();

  private controller: BoredloadGameController | null = null;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.controller = new BoredloadGameController(this.elementRef.nativeElement);
    this.controller.init(
      {
        game: this.game,
        threshold: this.threshold,
        minPlayMs: this.minPlayMs,
        maxPlayMs: this.maxPlayMs,
        continueLabel: this.continueLabel,
        theme: this.theme,
        seed: this.seed,
        width: this.width,
        height: this.height,
        persistHighScore: this.persistHighScore,
        highScoreKey: this.highScoreKey,
        respectReducedMotion: this.respectReducedMotion,
        adaptiveThreshold: this.adaptiveThreshold,
        slowConnectionThresholdMs: this.slowConnectionThresholdMs,
        onGameOver: (score) => this.gameOver.emit(score),
        onReadyToContinue: () => this.readyToContinue.emit(),
        onExit: () => this.exit.emit(),
      },
      this.isLoading,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoading'] && !changes['isLoading'].firstChange) {
      this.controller?.setLoading(this.isLoading);
    }
  }

  ngOnDestroy(): void {
    this.controller?.destroy();
    this.controller = null;
  }

  /** Current score, if the game is showing. */
  getScore(): number {
    return this.controller?.getScore() ?? 0;
  }

  /** Persisted best score for this game. */
  getHighScore(): number {
    return this.controller?.getHighScore() ?? 0;
  }
}
