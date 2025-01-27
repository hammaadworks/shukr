import type { Point as StrokePoint, Stroke } from './sketchTypes';

export const normalizeStrokes = (strokes: Stroke[]): Stroke[] => {
  if (strokes.length === 0) return [];
  
  // 1. Find bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  strokes.forEach((stroke: Stroke) => {
    stroke.forEach((p: StrokePoint) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
  });

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const size = Math.max(width, height);

  // 2. Center and scale to 0-100
  return strokes.map((stroke: Stroke) => 
    stroke.map((p: StrokePoint) => ({
      x: ((p.x - minX) / size) * 100,
      y: ((p.y - minY) / size) * 100
    }))
  );
};

export const getDistance = (p1: StrokePoint, p2: StrokePoint): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const resampleStroke = (stroke: StrokePoint[], numPoints: number = 64): StrokePoint[] => {
  if (stroke.length < 2) return stroke;
  
  const totalLength = stroke.reduce((len, p, i) => i === 0 ? 0 : len + getDistance(p, stroke[i-1]), 0);
  const interval = totalLength / (numPoints - 1);
  let currentLen = 0;
  const newPoints: StrokePoint[] = [stroke[0]];

  for (let i = 1; i < stroke.length; i++) {
    const d = getDistance(stroke[i-1], stroke[i]);
    if (currentLen + d >= interval) {
      const q = {
        x: stroke[i-1].x + ((interval - currentLen) / d) * (stroke[i].x - stroke[i-1].x),
        y: stroke[i-1].y + ((interval - currentLen) / d) * (stroke[i].y - stroke[i-1].y)
      };
      newPoints.push(q);
      stroke.splice(i, 0, q);
      currentLen = 0;
    } else {
      currentLen += d;
    }
  }

  if (newPoints.length === numPoints - 1) {
    newPoints.push(stroke[stroke.length - 1]);
  }
  return newPoints.slice(0, numPoints);
};
