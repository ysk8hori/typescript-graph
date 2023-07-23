import {
  Graph,
  Node,
  getUniqueNodes,
  getUniqueRelations,
  isSameNode,
} from '../models';
import { extractUniqueNodes } from './utils';

/** word に該当するか */
const bindMatchFunc = (word: string) => (node: Node) =>
  node.path.toLowerCase().includes(word.toLowerCase());
/** word に完全一致するか */
const bindExactMatchFunc = (word: string) => (node: Node) => node.path === word;
/** 抽象的な判定関数 */
const judge = (node: Node) => (f: (node: Node) => boolean) => f(node);

const isMatchSome = (words: string[]) => (node: Node) =>
  words.map(bindMatchFunc).some(judge(node));
const isExactMatchSome = (words: string[]) => (node: Node) =>
  words.map(bindExactMatchFunc).some(judge(node));

export function filterGraph(
  _include: string[] | undefined,
  _exclude: string[] | undefined,
  { nodes, relations }: Graph,
) {
  let tmpNodes = [...nodes];
  let tmpRelations = [...relations];
  const include = _include ?? [];
  const exclude = _exclude ?? [];

  const isMatchSomeIncludes = isMatchSome(include);
  const isExactMatchSomeIncludes = isExactMatchSome(include);
  const isMatchSomeExcludes = isMatchSome(exclude);
  // const isExactMatchSomeExcludes = isExactMatchSome(exclude);

  if (include.length !== 0) {
    tmpNodes = tmpNodes.filter(isMatchSomeIncludes);
    tmpRelations = tmpRelations.filter(
      ({ from, to }) => isMatchSomeIncludes(from) || isMatchSomeIncludes(to),
    );
  }
  if (exclude.length !== 0) {
    tmpNodes = tmpNodes.filter(
      node => isExactMatchSomeIncludes(node) || !isMatchSomeExcludes(node),
    );
    tmpRelations = tmpRelations.filter(({ from, to }) => {
      if (isExactMatchSomeIncludes(to)) {
        // to が include に完全一致する場合は除外しない
        return true;
      }
      if (isMatchSomeExcludes(from)) {
        // from が exclude に含まれる場合は除外する
        return false;
      }
      if (isMatchSomeExcludes(to)) {
        // to が exclude に含まれる場合は除外する
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
