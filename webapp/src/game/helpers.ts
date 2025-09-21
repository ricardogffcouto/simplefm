export function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function levelRange(
  minimum: number,
  maximum: number,
  total: number,
  level: number
): [number, number] {
  const step = (maximum - minimum) / total;
  const minRange = minimum + step * (level - 1);
  const maxRange = minimum + step * level;
  return [minRange, maxRange];
}

export function splitList<T>(list: T[]): [T[], T[]] {
  const half = Math.floor(list.length / 2);
  return [list.slice(0, half), list.slice(half)];
}

export function balance(a: number, b: number): number {
  return ((a - b) / (a + b) + 1) * 0.5;
}

export function minMax(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function weightedChoice<T>(choices: Array<[T, number]>): T {
  const total = choices.reduce((acc, [, weight]) => acc + weight, 0);
  let r = Math.random() * total;
  for (const [choice, weight] of choices) {
    if (r < weight) {
      return choice;
    }
    r -= weight;
  }
  return choices[choices.length - 1][0];
}

export function normalize(value: number, minimum: number, maximum: number): number {
  if (maximum === minimum) {
    return 0;
  }
  const clamped = minMax(value, minimum, maximum);
  return (clamped - minimum) / (maximum - minimum);
}

export function normalizeList(values: number[]): number[] {
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (sum === 0) {
    return values.map(() => 0);
  }
  return values.map((value) => value / sum);
}

export function intToMoney(number: number): number {
  for (let p = 7; p > 2; p -= 1) {
    if (number >= Math.pow(10, p)) {
      return number - (number % Math.pow(10, p - 1));
    }
  }
  return Math.pow(10, 3);
}

export function strToTactic(tactic: string): number[] | 'Top skill' {
  if (tactic !== 'Top skill') {
    const [a, b, c] = tactic.split('-').map((value) => parseInt(value, 10));
    return [a, b, c];
  }
  return 'Top skill';
}

export type TrainingDelta = '++' | '+' | '-' | '--' | '';

export function trainingToStr(training: number): TrainingDelta {
  if (training >= 0.03) {
    return '++';
  }
  if (training >= 0.015) {
    return '+';
  }
  if (training <= -0.03) {
    return '--';
  }
  if (training <= -0.015) {
    return '-';
  }
  return '';
}

export function value01(value: number, min: number, max: number): number {
  return value / (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffleInPlace<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function randomGaussian(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) {
    u = Math.random();
  }
  while (v === 0) {
    v = Math.random();
  }
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}
