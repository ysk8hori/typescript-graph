import path from 'path';
import * as ts from 'typescript';
import { Graph, isSameNode, Meta, Node, Relation } from './models';

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
      const fromNode = { path: filePath, fileName };
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
        const toNode = {
          path: moduleFilePath,
          fileName: getName(moduleFilePath),
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
