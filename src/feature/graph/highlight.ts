import type { Graph, Node } from './models';

export function highlight(
  highlightArray: string[] | undefined,
  graph: Graph,
): Graph {
  if (!highlightArray || highlightArray.length === 0) return graph;
  const nodes = graph.nodes.map<Node>(node => {
    if (
      highlightArray.some(word =>
        node.path.toLowerCase().includes(word.toLowerCase()),
      )
    ) {
      return { ...node, highlight: true };
    }
    return node;
  });
  return { ...graph, nodes };
}
