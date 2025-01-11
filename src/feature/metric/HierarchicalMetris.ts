import { Tree } from '../../utils/Tree';
import { MetricsScope } from './metricsModels';

export type HierarchicalMetris<T> = Tree<{
  name: string;
  scope: MetricsScope;
  score: T;
}>;
