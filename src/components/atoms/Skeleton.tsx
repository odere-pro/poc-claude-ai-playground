type Shape = "card" | "badge" | "text-line" | "text-block";

interface SkeletonProps {
  readonly shape: Shape;
  readonly width?: number | string;
  readonly height?: number | string;
}

const SHAPE_CLASS: Record<Shape, string> = {
  card: "h-32 w-full rounded-lg",
  badge: "h-6 w-20 rounded-full",
  "text-line": "h-3 w-full rounded",
  "text-block": "h-20 w-full rounded",
};

export function Skeleton({ shape, width, height }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`${SHAPE_CLASS[shape]} animate-pulse`}
      style={{
        backgroundColor: "var(--color-bg-inset)",
        width,
        height,
      }}
    />
  );
}
