import { MetricsScope } from '../Metrics';
import { Score } from './Score';

export interface CodeMetrics {
  filePath: string;
  /** クラス名や関数名など */
  name: string;
  scope: MetricsScope;
  scores: Score[];
}
