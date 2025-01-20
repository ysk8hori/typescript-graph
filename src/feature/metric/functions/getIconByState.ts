import type { MetricsScoreState } from '../metricsModels';

export function getIconByState(state: MetricsScoreState): string {
  switch (state) {
    case 'critical':
      return '💥';
    case 'alert':
      return '🧨';
    default:
      return '';
  }
}
