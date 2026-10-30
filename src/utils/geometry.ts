import { Point } from '../types';

export const dist = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const lerp = (p1: Point, p2: Point, t: number): Point => {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
};

export const linesIntersect = (a: Point, b: Point, c: Point, d: Point): boolean => {
  const ccw = (p1: Point, p2: Point, p3: Point) => {
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  };
  return (
    ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
  );
};

// Check if segment AB intersects any segment of a polyline
export const lineIntersectsPolyline = (p1: Point, p2: Point, polyline: Point[]): boolean => {
  for (let i = 0; i < polyline.length - 1; i++) {
    if (linesIntersect(p1, p2, polyline[i], polyline[i + 1])) {
      return true;
    }
  }
  return false;
};

// Count how many times segment AB intersects a polyline
export const countLinePolylineIntersections = (p1: Point, p2: Point, polyline: Point[]): number => {
  let count = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    if (linesIntersect(p1, p2, polyline[i], polyline[i + 1])) {
      count++;
    }
  }
  return count;
};

// Check if a point is inside a polygon
export const isPointInPolygon = (p: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y)) &&
      (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Distance from point P to segment VW
export const distToSegment = (p: Point, v: Point, w: Point): number => {
  const l2 = dist(v, w) * dist(v, w);
  if (l2 === 0) return dist(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  };
  return dist(p, projection);
};

// Metro line routing helper: generate classic 45/90 degree bends between two points
export const generateMetroPoints = (p1: Point, p2: Point): Point[] => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  
  if (Math.abs(dx) < 4 || Math.abs(dy) < 4) {
    return [p1, p2];
  }
  
  // Decide whether to break horizontally or vertically first
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx > absDy) {
    // 45 degree transition in the middle
    const signX = Math.sign(dx);
    const signY = Math.sign(dy);
    const intermediate1: Point = {
      x: p1.x + (absDx - absDy) * signX * 0.5,
      y: p1.y,
    };
    const intermediate2: Point = {
      x: intermediate1.x + absDy * signX,
      y: p2.y,
    };
    return [p1, intermediate1, intermediate2, p2];
  } else {
    const signX = Math.sign(dx);
    const signY = Math.sign(dy);
    const intermediate1: Point = {
      x: p1.x,
      y: p1.y + (absDy - absDx) * signY * 0.5,
    };
    const intermediate2: Point = {
      x: p2.x,
      y: intermediate1.y + absDx * signY,
    };
    return [p1, intermediate1, intermediate2, p2];
  }
};
