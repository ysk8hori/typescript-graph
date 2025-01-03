export type MetricsScoreState = 'critical' | 'alert' | 'normal';
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
