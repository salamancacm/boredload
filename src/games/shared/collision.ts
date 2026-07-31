export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Standard axis-aligned bounding box overlap test. */
export function intersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
