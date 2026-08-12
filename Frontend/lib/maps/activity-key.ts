export function buildActivityKey(dayNumber: number, activityIndex: number): string {
  return `d${dayNumber}-a${activityIndex}`;
}

export function parseActivityKey(activityKey: string): {
  dayNumber: number;
  activityIndex: number;
} | null {
  const match = /^d(\d+)-a(\d+)$/.exec(activityKey);
  if (!match) return null;
  return {
    dayNumber: Number(match[1]),
    activityIndex: Number(match[2]),
  };
}
