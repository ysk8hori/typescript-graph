import { Graph } from '../models';
import { extractUniqueNodes } from './utils';

export function filterGraph(
  { nodes, relations }: Graph,
  include: string[] | undefined,
  exclude: string[] | undefined,
) {
  let tmpNodes = nodes;
  let tmpRelations = relations;
  if (include && include.length !== 0) {
    tmpNodes = tmpNodes.filter(node =>
      include.some(word =>
        node.path.toLowerCase().includes(word.toLowerCase()),
      ),
    );
    tmpRelations = tmpRelations.filter(({ from, to }) =>
      include.some(
        word =>
          from.path.toLowerCase().includes(word.toLowerCase()) ||
          to.path.toLowerCase().includes(word.toLowerCase()),
      ),
    );
  }
  if (exclude && exclude.length !== 0) {
    tmpNodes = tmpNodes.filter(
      node =>
        !exclude.some(word =>
          node.path.toLowerCase().includes(word.toLowerCase()),
        ),
    );
    tmpRelations = tmpRelations.filter(
      ({ from, to }) =>
        !exclude.some(
          word =>
            from.path.toLowerCase().includes(word.toLowerCase()) ||
            to.path.toLowerCase().includes(word.toLowerCase()),
        ),
    );
  }

  return {
    nodes: extractUniqueNodes({ nodes: tmpNodes, relations: tmpRelations }),
    relations: tmpRelations,
  };
}
