import type { Theme, Viewport } from '../../core/types';
import type { Faller, OrbitState, Ship } from './state';

/**
 * Draws original geometric shapes — a chevron-shaped ship with a pulsing
 * thruster glow, faceted hex-gem fallers, and a softly downward-drifting
 * dust field. Deliberately distinct from dino-runner's visual language
 * (vertical dodge, not horizontal jump) even though both share the same
 * theme tokens.
 */
export function renderOrbit(
  ctx: CanvasRenderingContext2D,
  state: OrbitState,
  viewport: Viewport,
  theme: Theme,
): void {
  renderBackground(ctx, viewport, state, theme);
  renderFallers(ctx, state.fallers, theme);
  renderShip(ctx, state.ship, state, theme);
  renderHud(ctx, state, viewport, theme);
}

function renderBackground(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  state: OrbitState,
  theme: Theme,
): void {
  const { width, height } = viewport;

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);

  // Downward-drifting dust field — reinforces the "falling" direction,
  // distinct from dino's horizontal scroll.
  drawParallaxLayer(ctx, {
    color: theme.accent,
    alpha: 0.2,
    speed: 40,
    elapsed: state.elapsed,
    spacing: 46,
    height,
    draw: (y, index) => {
      const x = 12 + ((index * 53) % Math.max(1, width - 24));
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    },
  });

  // Thin decorative line marking the ship's travel zone — not a ground.
  ctx.save();
  ctx.strokeStyle = theme.ground;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const lineY = state.ship.y + state.ship.height + 10;
  ctx.moveTo(0, lineY);
  ctx.lineTo(width, lineY);
  ctx.stroke();
  ctx.restore();
}

function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  opts: {
    color: string;
    alpha: number;
    speed: number;
    elapsed: number;
    spacing: number;
    height: number;
    draw: (y: number, index: number) => void;
  },
): void {
  const { color, alpha, speed, elapsed, spacing, height, draw } = opts;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  const offset = (elapsed * speed) % spacing;
  const count = Math.ceil(height / spacing) + 2;
  for (let i = -1; i < count; i++) {
    draw(i * spacing + offset, i);
  }
  ctx.restore();
}

function renderShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  state: OrbitState,
  theme: Theme,
): void {
  const cx = ship.x + ship.width / 2;
  const cy = ship.y + ship.height / 2;

  // Pulsing thruster glow underneath.
  const pulse = 0.5 + 0.5 * Math.sin(state.elapsed * 6);
  ctx.save();
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = 0.25 + pulse * 0.25;
  ctx.beginPath();
  ctx.ellipse(cx, ship.y + ship.height + 4, ship.width * 0.28, 4 + pulse * 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Chevron/arrowhead body, with a slight lean based on last horizontal move.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = theme.player;
  ctx.beginPath();
  ctx.moveTo(0, -ship.height / 2);
  ctx.lineTo(ship.width / 2, ship.height / 2);
  ctx.lineTo(0, ship.height / 4);
  ctx.lineTo(-ship.width / 2, ship.height / 2);
  ctx.closePath();
  ctx.fill();

  // Glossy highlight overlay.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.18;
  ctx.fillRect(-ship.width / 2, -ship.height / 2, ship.width, ship.height * 0.4);
  ctx.restore();
  ctx.restore();
}

function renderFallers(ctx: CanvasRenderingContext2D, fallers: Faller[], theme: Theme): void {
  for (const f of fallers) {
    if (!f.active) continue;
    if ((f.variant ?? 0) === 1) {
      const third = f.width / 3;
      drawGem(ctx, f.x, f.y, third * 1.6, f.height * 0.6, theme);
      drawGem(ctx, f.x + f.width - third * 1.6, f.y + f.height * 0.25, third * 1.6, f.height * 0.55, theme);
    } else {
      drawGem(ctx, f.x, f.y, f.width, f.height, theme);
    }
  }
}

function drawGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme,
): void {
  const cx = x + width / 2;
  const topY = y;
  const midY = y + height * 0.4;
  const botY = y + height;

  ctx.fillStyle = theme.obstacle;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(x + width, midY);
  ctx.lineTo(cx, botY);
  ctx.lineTo(x, midY);
  ctx.closePath();
  ctx.fill();

  // Faceted highlight edge for a gem feel.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(x, midY);
  ctx.lineTo(cx, botY);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.16;
  ctx.fillRect(x, y, width, height);
  ctx.restore();

  ctx.strokeStyle = theme.text;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function renderHud(
  ctx: CanvasRenderingContext2D,
  state: OrbitState,
  viewport: Viewport,
  theme: Theme,
): void {
  const { width, height } = viewport;

  ctx.fillStyle = theme.text;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${Math.floor(state.score)}`, width - 12, 12);

  if (state.bestScore > 0) {
    ctx.globalAlpha = 0.6;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(`Best ${Math.floor(state.bestScore)}`, width - 12, 30);
    ctx.globalAlpha = 1;
  }

  if (state.status === 'gameover') {
    const label = 'Game over — tap / space to retry';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(label);
    const paddingX = 12;
    const paddingY = 8;
    ctx.save();
    ctx.fillStyle = theme.background;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(
      width / 2 - metrics.width / 2 - paddingX,
      height / 2 - 9 - paddingY,
      metrics.width + paddingX * 2,
      18 + paddingY * 2,
    );
    ctx.restore();
    ctx.fillStyle = theme.text;
    ctx.fillText(label, width / 2, height / 2);
  }
}
