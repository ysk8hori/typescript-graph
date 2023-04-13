import {
  getUniqueNodes,
  getUniqueRelations,
  Graph,
  isSameNode,
  isSameRelation,
  Node,
} from '../models';

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

export function updateChangeStatusFromDiff(base: Graph, head: Graph): void {
  const { nodes: baseNodes, relations: baseRelations } = base;
  const { nodes: headNodes, relations: headRelations } = head;

  headNodes.forEach(current => {
    for (const baseNode of baseNodes) {
      if (!isSameNode(baseNode, current)) {
        baseNode.changeStatus = 'deleted';
        break;
      }
    }
  });

  baseNodes.forEach(current => {
    for (const headNode of headNodes) {
      if (!isSameNode(headNode, current)) {
        headNode.changeStatus = 'created';
        break;
      }
    }
  });

  headRelations.forEach(current => {
    for (const baseRelation of baseRelations) {
      if (
        !isSameRelation(baseRelation, current) &&
        baseRelation.kind === 'depends_on'
      ) {
        baseRelation.changeStatus = 'deleted';
      }
    }
  });

  baseRelations.forEach(current => {
    for (const headRelation of headRelations) {
      if (
        !isSameRelation(headRelation, current) &&
        headRelation.kind === 'depends_on'
      ) {
        headRelation.changeStatus = 'created';
        break;
      }
    }
  });
}
