import { Graph, isSameNode, Node } from '../models';

/**
 * nodes と relations をマージしたユニークな node のリストを作り直す。
 * フィルタリング処理などで「relations にあるが nodes にない」が発生したりするので必要。
 */
export function extractUniqueNodes({ nodes, relations }: Graph): Node[] {
  const allNodes = [
    ...nodes,
    ...relations.map(({ from, to }) => [from, to]).flat(),
  ].reduce((pre, current) => {
    // 重複除去
    if (pre.some(node => isSameNode(node, current))) return pre;
    pre.push(current);
    return pre;
  }, new Array<Node>());

  return allNodes;
}
