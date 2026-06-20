import type { StepId } from '@/lib/validate/progress';

// The journey map lives in a wide, short coordinate space (matches the SVG
// viewBox and the rendered container's aspect ratio, so nothing is distorted).
// Kept short so the loader fits the viewport without scrolling.
export const JOURNEY_VIEWBOX = { width: 100, height: 48 } as const;

export type JourneyNodeId = 'idea' | StepId;

interface Point {
  x: number;
  y: number;
}

// A point on the trail. Stage points also act as labelled markers / travel
// targets; bend points only shape the winding treasure-map curve.
interface TrailPoint extends Point {
  kind: 'stage' | 'bend';
  id?: JourneyNodeId;
  label?: string;
  // Label offset from the node (viewBox units), placed in a road-clear zone.
  labelDx?: number;
  labelDy?: number;
}

export interface JourneyNode extends Point {
  id: JourneyNodeId;
  label: string;
  t: number;
  labelDx: number;
  labelDy: number;
}

// A full-width treasure-map S: the trail sweeps left↔right edge to edge with
// pronounced bows. Stage markers sit at the turning points; bends bow the
// segments. Labels are offset into clear zones away from the road.
const TRAIL_POINTS: TrailPoint[] = [
  { kind: 'stage', id: 'idea', label: 'Your idea', x: 9, y: 14, labelDx: 3, labelDy: 6 },
  { kind: 'bend', x: 40, y: 5 },
  { kind: 'stage', id: 'queries', label: 'Complaint searches', x: 70, y: 9, labelDx: 0, labelDy: 6 },
  { kind: 'bend', x: 96, y: 18 },
  { kind: 'bend', x: 64, y: 25 },
  { kind: 'stage', id: 'research', label: 'Searching Reddit & forums', x: 30, y: 26, labelDx: 0, labelDy: 6 },
  { kind: 'bend', x: 5, y: 35 },
  { kind: 'bend', x: 44, y: 42 },
  { kind: 'stage', id: 'scoring', label: 'Grouping into themes', x: 88, y: 38, labelDx: -3, labelDy: 6 },
];

interface Segment {
  p0: Point; // start anchor
  cp1: Point;
  cp2: Point;
  p1: Point; // end anchor
}

// Convert points into Catmull-Rom-derived cubic bezier segments. The `/4`
// tension gives rounder, loopier bends than the textbook `/6`.
function toBezierSegments(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    segments.push({
      p0: p1,
      cp1: { x: p1.x + (p2.x - p0.x) / 4, y: p1.y + (p2.y - p0.y) / 4 },
      cp2: { x: p2.x - (p3.x - p1.x) / 4, y: p2.y - (p3.y - p1.y) / 4 },
      p1: p2,
    });
  }
  return segments;
}

function buildPathString(segments: Segment[]): string {
  const start = segments[0].p0;
  const curves = segments
    .map((s) => `C ${s.cp1.x} ${s.cp1.y} ${s.cp2.x} ${s.cp2.y} ${s.p1.x} ${s.p1.y}`)
    .join(' ');
  return `M ${start.x} ${start.y} ${curves}`;
}

function cubicPoint(s: Segment, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * s.p0.x + b * s.cp1.x + c * s.cp2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.cp1.y + c * s.cp2.y + d * s.p1.y,
  };
}

const SAMPLES_PER_SEGMENT = 32;

// Arc-length fraction (0..1) at the start of each trail point, so a travel
// target expressed as a node's `t` lines up with getPointAtLength.
function pointLengthFractions(segments: Segment[]): number[] {
  const segLengths = segments.map((s) => {
    let length = 0;
    let prev = cubicPoint(s, 0);
    for (let i = 1; i <= SAMPLES_PER_SEGMENT; i++) {
      const next = cubicPoint(s, i / SAMPLES_PER_SEGMENT);
      length += Math.hypot(next.x - prev.x, next.y - prev.y);
      prev = next;
    }
    return length;
  });

  const total = segLengths.reduce((sum, l) => sum + l, 0);
  const fractions: number[] = [0];
  let acc = 0;
  for (const length of segLengths) {
    acc += length;
    fractions.push(total === 0 ? 1 : acc / total);
  }
  return fractions;
}

export interface JourneyPath {
  d: string;
  nodes: JourneyNode[];
}

function buildJourneyPath(): JourneyPath {
  const segments = toBezierSegments(TRAIL_POINTS);
  const fractions = pointLengthFractions(segments);

  const nodes: JourneyNode[] = TRAIL_POINTS.flatMap((p, i) =>
    p.kind === 'stage' && p.id && p.label
      ? [
          {
            id: p.id,
            label: p.label,
            x: p.x,
            y: p.y,
            t: fractions[i],
            labelDx: p.labelDx ?? 0,
            labelDy: p.labelDy ?? 9,
          },
        ]
      : []
  );

  return { d: buildPathString(segments), nodes };
}

// The path is static, so build it once at module load.
export const JOURNEY_PATH: JourneyPath = buildJourneyPath();
