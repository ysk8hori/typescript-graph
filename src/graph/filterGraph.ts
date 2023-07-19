import {
  Graph,
  getUniqueNodes,
  getUniqueRelations,
  isSameNode,
} from '../models';
import { extractUniqueNodes } from './utils';

export function filterGraph(
  _include: string[] | undefined,
  _exclude: string[] | undefined,
  { nodes, relations }: Graph,
) {
  let tmpNodes = [...nodes];
  let tmpRelations = [...relations];
  const include = _include ?? [];
  const exclude = _exclude ?? [];

  if (include.length !== 0) {
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
  if (exclude.length !== 0) {
    tmpNodes = tmpNodes.filter(
      node =>
        include.some(word => node.path === word) ||
        !exclude.some(word =>
          node.path.toLowerCase().includes(word.toLowerCase()),
        ),
    );

    tmpRelations = tmpRelations.filter(
      ({ from, to }) =>
        include.some(word => from.path === word || to.path === word) ||
        !exclude.some(
          word =>
            from.path.toLowerCase().includes(word.toLowerCase()) ||
            to.path.toLowerCase().includes(word.toLowerCase()),
        ),
    );
  }
  tmpRelations = getUniqueRelations(
    tmpRelations.concat(
      relations.filter(({ from, to }) => {
        const relationNodes = getUniqueNodes(
          tmpRelations.map(({ from, to }) => [from, to]).flat(),
        ).filter(node => tmpNodes.some(tmpNode => !isSameNode(node, tmpNode)));
        if (
          relationNodes.some(node => isSameNode(node, from)) &&
          relationNodes.some(node => isSameNode(node, to))
        ) {
          return true;
        }
        return false;
      }),
    ),
  );

  return {
    nodes: extractUniqueNodes({ nodes: tmpNodes, relations: tmpRelations }),
    relations: tmpRelations,
  };
}
