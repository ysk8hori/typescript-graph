import { Graph, isSameNode, isSameRelation, Node, Relation } from '../models';

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

export function mergeGraph(...graphs: Graph[]): Graph {
  const nodes = graphs
    .map(graph => graph.nodes)
    .flat()
    .reduce((pre, current) => {
      // 重複除去
      if (pre.some(node => isSameNode(node, current))) return pre;
      pre.push(current);
      return pre;
    }, new Array<Node>());
  const relations = graphs
    .map(graph => graph.relations)
    .flat()
    .reduce((pre, current) => {
      // 重複除去
      if (pre.some(rel => isSameRelation(rel, current))) return pre;
      pre.push(current);
      return pre;
    }, new Array<Relation>());
  return { nodes, relations };
}
