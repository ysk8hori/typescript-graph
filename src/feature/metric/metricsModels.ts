// feature/metric の外からも参照される型を定義する

export type MetricsScope = 'file' | 'function' | 'class' | 'method' | 'object';

export type MetricsScoreState = 'critical' | 'alert' | 'normal';

export interface Score {
  /** 計測した値の名前。 Maintainability Index など。 */
  name: string;
  /** 計測した値 */
  value: number;
  /** 判定結果 */
  state: MetricsScoreState;
  /** 値が高いほど良いか低いほど良いか */
  betterDirection: 'higher' | 'lower' | 'none';
}

export interface CodeMetrics {
  filePath: string;
  /** クラス名や関数名など */
  name: string;
  scope: MetricsScope;
  scores: Score[];
}

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
