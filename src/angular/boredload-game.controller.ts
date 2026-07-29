import type { GameConfig, MountHandle } from 'boredload';
// Relative import of the already-built core for the runtime value only — not
// a bare 'boredload' self-reference (which breaks real `ng build` for
// consumers). Types come from the 'boredload' import above instead, which is
// erased at compile time and never reaches the emitted bundle.
//
// IMPORTANT: ng-packagr/rollup does NOT rewrite this specifier relative to
// the bundle's own output location — it copies the literal string through
// unchanged. So this path must already be correct for where the FESM bundle
// ends up (dist/angular/fesm2022/boredload-angular.mjs), not for where this
// source file lives (src/angular/). Verify with `npm run build:angular` and
// inspect dist/angular/fesm2022/*.mjs's import line if ng-packagr's output
// layout ever changes.
// @ts-expect-error - no declaration file for the relative .mjs path; typed via the import above.
import { mount } from '../../index.mjs';

export interface BoredloadGameControllerConfig extends GameConfig {
  width?: number;
  height?: number;
}

/**
 * Plain, undecorated wrapper around `mount()` — deliberately has no
 * `@angular/core` decorators so it can be unit-tested directly with Vitest.
 * Angular's real `@Input`/`@Directive` field decorators throw at plain
 * instantiation unless a class has been processed by Angular's own compiler
 * first ("not supported in JIT mode"), so `BoredloadGameDirective` stays a
 * thin, untested-at-the-unit-level shell that only wires Inputs/Outputs to
 * this controller's methods.
 */
export class BoredloadGameController {
  private handle: MountHandle | null = null;

  constructor(private readonly host: HTMLElement) {}

  init(config: BoredloadGameControllerConfig, isLoading: boolean): void {
    const handle = mount(this.host, config);
    this.handle = handle;
    handle.setLoading(isLoading);
  }

  setLoading(isLoading: boolean): void {
    this.handle?.setLoading(isLoading);
  }

  destroy(): void {
    this.handle?.destroy();
    this.handle = null;
  }

  getScore(): number {
    return this.handle?.getScore() ?? 0;
  }

  getHighScore(): number {
    return this.handle?.getHighScore() ?? 0;
  }
}
