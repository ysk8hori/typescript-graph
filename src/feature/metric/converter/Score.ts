import { MetricsScoreState } from '../metricsModels';

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
