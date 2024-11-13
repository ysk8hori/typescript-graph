import { Graph, getUniqueRelations, isSameNode, Node } from '../models';
import { extractUniqueNodes } from './utils';

/**
 * absList で渡されたパス文字列に一致するディレクトリを抽象化する。
 *
 * 抽象化とは、そのディレクトリに含まれるファイルや子孫ディレクトリを Graph 上では見せず、子孫の関わる Relation を abs で指定されたディレクトリに集約することを言う。
 *
 * abs で指定するパス文字列は、フルパスの一部分で良いが、ディレクトリ名とその順番には完全一致しなくてはならない。
 *
 * 例として、`/src/components/atoms` を抽象化したい場合、以下の文字列を指定すると抽象化できる。
 *
 * - `/src/components/atoms`
 * - `src/components/atoms`
 * - `/components/atoms`
 * - `components/atoms`
 * - `/atoms`
 * - `atoms`
 *
 * 以下の文字列では抽象化できない。
 *
 * - `atom`
 * - `atoms2`
 * - `components/atom`
 * - `onponents/atoms`
 * - `atoms/components`
 * - `src/atoms`
 *
 * @param graph
 * @param absArray
 * @returns
 */
export function abstraction(
  absArray: string[] | undefined,
  graph: Graph,
): Graph {
  if (!absArray || absArray.length === 0) return graph;
  const absDirArrArr = absArray
    .map(abs => abs.split('/'))
    .filter(absDirArray => absDirArray.at(0) !== undefined)
    .map(absDirArray =>
      absDirArray.at(0) === '' ? absDirArray.slice(1) : absDirArray,
    );
  const { nodes: _nodes, relations: _relations } = graph;

  // abs 対象ノードを抽象化する
  const nodes = _nodes.map(node => abstractionNode(node, absDirArrArr));

  const relations = getUniqueRelations(
    _relations
      .map(original => ({
        ...original,
        from: abstractionNode(original.from, absDirArrArr),
        to: abstractionNode(original.to, absDirArrArr),
      }))
      .filter(relation => !isSameNode(relation.from, relation.to)),
  );

  return {
    nodes: extractUniqueNodes({ nodes, relations }),
    relations: relations,
  };
}

function abstractionNode(node: Node, absDirArrArr: string[][]): Node {
  const absDirArr = getAbstractionDirArr(absDirArrArr, node);
  if (!absDirArr || absDirArr.at(-1) === node.name) return node;
  return {
    name: `/${absDirArr.at(-1)!}`,
    path: abstractionPath(node.path, absDirArr),
    isDirectory: true,
    changeStatus: 'not_modified',
  };
}

export function abstractionPath(path: string, absDirArr: string[]): string {
  const dirArrFromPath = path.split('/');
  return dirArrFromPath
    .slice(0, dirArrFromPath.findIndex(dir => absDirArr.at(-1) === dir) + 1)
    .join('/');
}

export function getAbstractionDirArr(
  absDirArrArr: string[][],
  node: Node,
): string[] | undefined {
  const targetDirArr = node.path.split('/');
  return absDirArrArr.find(absDirArr => {
    // このブロックは、当該ノードが指定した abs に該当する場合に true を返す。
    // abs 先頭の dir を含む index を見つける。
    const startIndex = targetDirArr.findIndex(dir => dir === absDirArr.at(0)!);
    if (startIndex === -1) return false;
    return absDirArr
      .slice(1)
      .every((absDir, i) => absDir === targetDirArr.at(startIndex + i + 1));
  });
}
