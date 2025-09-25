import type { TrainingDelta } from '@/game/helpers';

type Indicator = TrainingDelta;
type IndicatorToken = Exclude<TrainingDelta, ''> | '·';

const iconMap: Record<IndicatorToken, string> = {
  '++': '▲▲',
  '+': '▲',
  '-': '▼',
  '--': '▼▼',
  '·': '·'
};

const colorMap: Record<IndicatorToken, string> = {
  '++': 'text-emerald-700',
  '+': 'text-emerald-600',
  '-': 'text-amber-600',
  '--': 'text-red-600',
  '·': 'text-black/60'
};

const descriptionMap: Record<IndicatorToken, string> = {
  '++': 'Major improvement',
  '+': 'Improving',
  '-': 'Declining',
  '--': 'Major decline',
  '·': 'No change'
};

export function getTrainingIndicator(delta: Indicator): {
  icon: string;
  className: string;
  description: string;
} {
  const token: IndicatorToken = delta === '' ? '·' : delta;
  return {
    icon: iconMap[token],
    className: colorMap[token],
    description: descriptionMap[token]
  };
}
