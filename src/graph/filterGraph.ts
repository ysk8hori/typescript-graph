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
    console.log(tmpNodes);
    tmpRelations = tmpRelations.filter(({ from, to }) => {
      if (include.some(word => to.path === word)) {
        // to が include に完全一致する場合は除外しない
        return true;
      }
      if (
        exclude.some(word =>
          from.path.toLowerCase().includes(word.toLowerCase()),
        )
      ) {
        // from が exclude に含まれる場合は除外する
        return false;
      }
      if (
        // to が exclude に含まれる場合は除外する
        exclude.some(word => to.path.toLowerCase().includes(word.toLowerCase()))
      ) {
        return false;
      }
      return true;
    });
  }
  // 失われた relation の復元。
  // from と to の両方が include に含まれない relation が手前の処理で除外されるが、
  // 片方が include に含まれていて残った relation（変数名はtmpRelations） の include 対象外の node 同士が本来繋がっている場合があるので、
  // それを復元する。
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
