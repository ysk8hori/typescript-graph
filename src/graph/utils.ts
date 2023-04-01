import { getUniqueNodes, getUniqueRelations, Graph, Node } from '../models';

/**
 * nodes と relations をマージしたユニークな node のリストを作り直す。
 * フィルタリング処理などで「relations にあるが nodes にない」が発生したりするので必要。
 */
export function extractUniqueNodes({ nodes, relations }: Graph): Node[] {
  const allNodes = getUniqueNodes([
    ...nodes,
    ...relations.map(({ from, to }) => [from, to]).flat(),
  ]);
  return allNodes;
}

export function mergeGraph(...graphs: Graph[]): Graph {
  const nodes = getUniqueNodes(graphs.map(graph => graph.nodes).flat());
  const relations = getUniqueRelations(
    graphs.map(graph => graph.relations).flat(),
  );
  return { nodes, relations };
}
