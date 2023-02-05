import path from 'path';
import * as ts from 'typescript';
import {
  getUniqueRelations,
  Graph,
  isSameNode,
  Meta,
  Node,
  Relation,
} from './models';

export function createGraph(dir: string): { graph: Graph; meta: Meta } {
  const configPath = ts.findConfigFile(dir, ts.sys.fileExists);
  if (!configPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
  }
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const splitedConfigPath = configPath.split('/');
  const rootDir = splitedConfigPath
    .slice(0, splitedConfigPath.length - 1)
    .join('/');
  const { options, fileNames } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    rootDir,
  );
  options.rootDir = rootDir;
  const program = ts.createProgram(fileNames, options);
  const nodes: Node[] = [];
  const relations: Relation[] = [];

  program
    .getSourceFiles()
    .filter(sourceFile => !sourceFile.fileName.includes('node_modules'))
    .forEach(sourceFile => {
      const filePath = removeSlash(
        options.rootDir
          ? sourceFile.fileName.replace(options.rootDir + '/', '')
          : sourceFile.fileName,
      );
      const fileName = getName(filePath);
      const fromNode: Node = { path: filePath, name: fileName };
      nodes.push(fromNode);

      ts.forEachChild(sourceFile, node => {
        if (!ts.isImportDeclaration(node)) return;

        const moduleNameText = node.moduleSpecifier.getText(sourceFile);
        const moduleName = moduleNameText.slice(1, moduleNameText.length - 1); // import 文のクォート及びダブルクォートを除去
        const moduleFileFullName =
          ts.resolveModuleName(moduleName, sourceFile.fileName, options, ts.sys)
            .resolvedModule?.resolvedFileName ?? '';
        const moduleFilePath = removeSlash(
          options.rootDir
            ? moduleFileFullName.replace(options.rootDir, '')
            : moduleFileFullName,
        );
        if (!moduleFilePath) return;
        const toNode: Node = {
          path: moduleFilePath,
          name: getName(moduleFilePath),
        };
        if (!findNode(nodes, moduleFilePath)) {
          nodes.push(toNode);
        }
        relations.push({
          from: fromNode,
          to: toNode,
          fullText: node.getChildAt(1, sourceFile).getText(sourceFile),
        });
      });
    });

  return { graph: { nodes, relations }, meta: { rootDir } };
}

function getName(filePath: string) {
  if (!filePath.includes('node_modules')) return path.basename(filePath);

  const dirOrFileName = filePath.split('/');
  const nodeModulesIndex = dirOrFileName.findIndex(
    name => name === 'node_modules',
  );
  if (dirOrFileName[nodeModulesIndex + 1]?.startsWith('@')) {
    // @ で始まる node_modules 配下のディレクトリは、@hoge/fuga の形で返す
    return path.join(
      dirOrFileName[nodeModulesIndex + 1],
      dirOrFileName[nodeModulesIndex + 2],
    );
  }
  // node_modules の直下の名前を返す
  return dirOrFileName[nodeModulesIndex + 1] ?? path.basename(filePath);
}

function findNode(nodes: Node[], filePath: string): Node | undefined {
  return nodes.find(node => node.path === filePath);
}

function removeSlash(pathName: string): string {
  return pathName.startsWith('/') ? pathName.replace('/', '') : pathName;
}

export function filter(
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

/**
 * nodes と relations をマージしたユニークな node のリストを作り直す。
 * フィルタリング処理などで「relations にあるが nodes にない」が発生したりするので必要。
 */
function extractUniqueNodes({ nodes, relations }: Graph): Node[] {
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
  graph: Graph,
  absArray: string[] | undefined,
): Graph {
  if (!absArray || absArray.length === 0) return graph;
  const absDirArrArr = absArray
    .map(abs => abs.split('/'))
    .filter(absDirArray => absDirArray.at(0) !== undefined)
    .map(absDirArray =>
      absDirArray.at(0) === '' ? absDirArray.slice(1) : absDirArray,
    );
  const { nodes: _nodes, relations: _relations } = graph;

  // abs 対象ノードを除去する
  const nodes = _nodes.filter(
    node => !getAbstractionDirArr(absDirArrArr, node),
  );

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
  if (!absDirArr) return node;
  return {
    name: `/${absDirArr.at(-1)!}`,
    path: abstractionPath(node.path, absDirArr),
    isDirectory: true,
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
