import { Tree } from '../../../utils/Tree';
import { CodeMetrics } from '../metricsModels';

export function toSortedMetrics<T extends Tree<Pick<CodeMetrics, 'scores'>>>(
  list: T[],
): T[] {
  const newList = list
    .toSorted(
      (a, b) =>
        (a.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0) -
        (b.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0),
    )
    .map(
      // 新規オブジェクトとして登録する。後続処理で children を変更するが、それを引数で受け取った値に影響させたくないため。
      m => ({ ...m }),
    )
    .map(m => {
      if (m.children) {
        m.children = toSortedMetrics(m.children);
      }
      return m;
    });
  return newList;
}
