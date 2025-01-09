import { Tree } from '../../../utils/Tree';
import { MetricsScope } from '../metricsModels';

/**
 * 各ノードの名前を更新する。
 *
 * - ノードのスコープがファイルの場合は `-` に変更
 * - クラスの子ノードの場合は `クラス名.メソッド名` に変更
 * - それ以外はそのまま
 */
export function updateMetricsName<
  T extends Tree<{
    name: string;
    scope: MetricsScope;
  }>,
>(metrics: T, classname?: string): T {
  return {
    // T を拡張した型にも対応するためスプレッド構文でもマージすること
    ...metrics,
    name: classname
      ? `${classname}.${metrics.name}`
      : metrics.scope === 'file'
        ? '-'
        : metrics.name,
    children: metrics.children?.map(c =>
      updateMetricsName(
        c,
        metrics.scope === 'class' ? metrics.name : undefined,
      ),
    ),
  };
}
