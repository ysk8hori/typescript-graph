import type { Graph, Node, Relation } from './models';
import {
  getUniqueNodes,
  getUniqueRelations,
  isSameNode,
  isSameRelation,
} from './models';

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

export function mergeGraph(graphs: Graph[]): Graph {
  const nodes = getUniqueNodes(graphs.map(graph => graph.nodes).flat());
  const relations = getUniqueRelations(
    graphs.map(graph => graph.relations).flat(),
  );
  return { nodes, relations };
}

export function updateChangeStatusFromDiff(base: Graph, head: Graph): void {
  const { nodes: baseNodes, relations: baseRelations } = base;
  const { nodes: headNodes, relations: headRelations } = head;

  updateNodeChangeStatus(baseNodes, headNodes);
  updateRelationChangeStatus(baseRelations, headRelations);
}

function updateNodeChangeStatus(baseNodes: Node[], headNodes: Node[]): void {
  // Mark nodes as deleted if they exist in base but not in head
  baseNodes.forEach(baseNode => {
    const existsInHead = headNodes.some(headNode =>
      isSameNode(baseNode, headNode),
    );
    if (!existsInHead) {
      baseNode.changeStatus = 'deleted';
    }
  });

  // Mark nodes as created if they exist in head but not in base
  headNodes.forEach(headNode => {
    const existsInBase = baseNodes.some(baseNode =>
      isSameNode(headNode, baseNode),
    );
    if (!existsInBase) {
      headNode.changeStatus = 'created';
    }
  });
}

function updateRelationChangeStatus(
  baseRelations: Relation[],
  headRelations: Relation[],
): void {
  // Mark relations as deleted if they exist in base but not in head
  baseRelations.forEach(baseRelation => {
    if (baseRelation.kind === 'depends_on') {
      const existsInHead = headRelations.some(headRelation =>
        isSameRelation(baseRelation, headRelation),
      );
      if (!existsInHead) {
        baseRelation.changeStatus = 'deleted';
      }
    }
  });

  // Mark relations as created if they exist in head but not in base
  headRelations.forEach(headRelation => {
    if (headRelation.kind === 'depends_on') {
      const existsInBase = baseRelations.some(baseRelation =>
        isSameRelation(headRelation, baseRelation),
      );
      if (!existsInBase) {
        headRelation.changeStatus = 'created';
      }
    }
  });
}
