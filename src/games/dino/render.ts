import type { Theme, Viewport } from '../../core/types';
import type { DinoState, Obstacle, Player } from './state';

/**
 * Draws original geometric shapes — a rounded runner "blob" with a fin and
 * jogging feet, faceted crystal obstacles, and a softly parallaxed
 * background. Deliberately not a T-rex/cactus silhouette, to avoid any
 * resemblance to Chrome's offline dino game.
 */
export function renderDino(
  ctx: CanvasRenderingContext2D,
  state: DinoState,
  viewport: Viewport,
  theme: Theme,
): void {
  renderBackground(ctx, viewport, state, theme);
  renderGround(ctx, state, viewport, theme);
  renderObstacles(ctx, state.obstacles, theme);
  renderPlayer(ctx, state.player, state, theme);
  renderHud(ctx, state, viewport, theme);
}

function renderBackground(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  state: DinoState,
  theme: Theme,
): void {
  const { width, height } = viewport;

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);

  // Soft glow near the horizon, ties the accent color into the scene even
  // though it isn't used anywhere else in the background.
  ctx.save();
  ctx.globalAlpha = 0.1;
  const glow = ctx.createRadialGradient(
    width * 0.5,
    state.groundY,
    0,
    width * 0.5,
    state.groundY,
    width * 0.6,
  );
  glow.addColorStop(0, theme.accent);
  glow.addColorStop(1, theme.accent);
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, 0, width, state.groundY);
  ctx.restore();

  // Distant parallax hills — slow scroll, low opacity.
  drawParallaxLayer(ctx, {
    color: theme.ground,
    alpha: 0.16,
    speed: state.speed * 0.15,
    elapsed: state.elapsed,
    spacing: 140,
    width,
    draw: (x) => {
      ctx.beginPath();
      ctx.ellipse(x, state.groundY + 6, 70, 26, 0, Math.PI, 0, true);
      ctx.fill();
    },
  });

  // Foreground dust motes — faster scroll, subtle.
  drawParallaxLayer(ctx, {
    color: theme.text,
    alpha: 0.22,
    speed: state.speed * 0.4,
    elapsed: state.elapsed,
    spacing: 64,
    width,
    draw: (x, index) => {
      const y = 18 + ((index * 37) % Math.max(1, state.groundY - 40));
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    },
  });
}

function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  opts: {
    color: string;
    alpha: number;
    speed: number;
    elapsed: number;
    spacing: number;
    width: number;
    draw: (x: number, index: number) => void;
  },
): void {
  const { color, alpha, speed, elapsed, spacing, width, draw } = opts;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  const offset = (elapsed * speed) % spacing;
  const count = Math.ceil(width / spacing) + 2;
  for (let i = -1; i < count; i++) {
    draw(i * spacing - offset, i);
  }
  ctx.restore();
}

function renderGround(
  ctx: CanvasRenderingContext2D,
  state: DinoState,
  viewport: Viewport,
  theme: Theme,
): void {
  const { width, height } = viewport;

  ctx.save();
  ctx.fillStyle = theme.ground;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, state.groundY, width, height - state.groundY);
  ctx.restore();

  ctx.strokeStyle = theme.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, state.groundY + 0.5);
  ctx.lineTo(width, state.groundY + 0.5);
  ctx.stroke();

  drawParallaxLayer(ctx, {
    color: theme.text,
    alpha: 0.3,
    speed: state.speed,
    elapsed: state.elapsed,
    spacing: 36,
    width,
    draw: (x) => {
      ctx.fillRect(x, state.groundY + 5, 12, 2);
    },
  });
}

function renderPlayer(
  ctx: CanvasRenderingContext2D,
  p: Player,
  state: DinoState,
  theme: Theme,
): void {
  // Volume-preserving squash/stretch driven by vertical velocity: stretched
  // thin on the way up, squashed wide right after landing.
  const stretch = clamp(-p.vy / 1400, -0.16, 0.22);
  const scaleY = 1 + stretch;
  const scaleX = 1 - stretch * 0.6;
  const drawWidth = p.width * scaleX;
  const drawHeight = p.height * scaleY;
  const drawX = p.x - (drawWidth - p.width) / 2;
  const drawY = p.y + p.height - drawHeight;
  const radius = Math.min(8, drawWidth / 3, drawHeight / 3);

  // Jogging feet, only while grounded and running.
  if (p.onGround && state.status === 'running') {
    const phase = (state.elapsed * state.speed) / 26;
    const strideL = Math.sin(phase) * 3;
    const strideR = Math.sin(phase + Math.PI) * 3;
    ctx.fillStyle = theme.player;
    ctx.globalAlpha = 0.9;
    drawEllipse(ctx, drawX + drawWidth * 0.3, drawY + drawHeight + 1, 5, 3 + Math.abs(strideL) * 0.4);
    drawEllipse(ctx, drawX + drawWidth * 0.72, drawY + drawHeight + 1, 5, 3 + Math.abs(strideR) * 0.4);
    ctx.globalAlpha = 1;
  }

  // Small back fin — gives the silhouette a bit of character without
  // resembling any existing mascot.
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.moveTo(drawX + drawWidth * 0.18, drawY + drawHeight * 0.1);
  ctx.lineTo(drawX + drawWidth * 0.02, drawY - drawHeight * 0.16);
  ctx.lineTo(drawX + drawWidth * 0.38, drawY + drawHeight * 0.06);
  ctx.closePath();
  ctx.fill();

  // Body.
  ctx.fillStyle = theme.player;
  drawRoundedRect(ctx, drawX, drawY, drawWidth, drawHeight, radius);
  ctx.fill();

  // Glossy highlight near the top, shaded belly near the bottom — both via
  // translucent overlays so no color math on the theme value is needed.
  ctx.save();
  drawRoundedRect(ctx, drawX, drawY, drawWidth, drawHeight, radius);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.22;
  ctx.fillRect(drawX, drawY, drawWidth, drawHeight * 0.35);
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.16;
  ctx.fillRect(drawX, drawY + drawHeight * 0.72, drawWidth, drawHeight * 0.28);
  ctx.restore();

  // Eye.
  ctx.fillStyle = theme.background;
  ctx.beginPath();
  ctx.arc(drawX + drawWidth * 0.74, drawY + drawHeight * 0.32, drawWidth * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function renderObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  theme: Theme,
): void {
  for (const o of obstacles) {
    if (!o.active) continue;
    if ((o.variant ?? 0) === 1) {
      const half = o.width / 2;
      drawCrystal(ctx, o.x, o.y, half, o.height * 0.85, theme);
      drawCrystal(ctx, o.x + half, o.y + o.height * 0.15, half, o.height * 0.7, theme);
    } else {
      drawCrystal(ctx, o.x, o.y, o.width, o.height, theme);
    }
  }
}

function drawCrystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme,
): void {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const top = { x: cx, y };
  const right = { x: x + width, y: cy };
  const bottom = { x: cx, y: y + height };
  const left = { x, y: cy };

  ctx.fillStyle = theme.obstacle;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fill();

  // Faceted highlight (upper-left) and shadow (lower-right) for a crystal feel.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x, y, width, height);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.14;
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
  state: DinoState,
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

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
