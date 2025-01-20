import type { Tree } from '../../utils/Tree';
import type { MetricsScope } from './metricsModels';

export type HierarchicalMetris<T> = Tree<{
  name: string;
  scope: MetricsScope;
  score: T;
}>;
