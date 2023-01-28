import path from 'path';
import * as ts from 'typescript';
import { Graph, Node, Relation } from './models';

/**
 * File(Node) とその依存関係 (Relation) を解析して返す。
 *
 * 返却する Node には Relation の from と to の全てのファイルが含まれており重複はない。
 * また、include と exclude を反映した結果を返す。
 *
 * @param sourceFiles
 * @param compilerOptions
 * @param include
 * @param exclude
 * @returns
 */
export function createGraph(
  sourceFiles: string[],
  compilerOptions: ts.CompilerOptions,
  include: string[],
  exclude: string[],
): Graph {
  const program = ts.createProgram(sourceFiles, compilerOptions);
  let nodes: Node[] = [];
  let relations: Relation[] = [];

  program
    .getSourceFiles()
    .filter(sourceFile => !sourceFile.fileName.includes('node_modules'))
    .forEach(sourceFile => {
      const filePath = removeSlash(
        compilerOptions.rootDir
          ? sourceFile.fileName.replace(compilerOptions.rootDir + '/', '')
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
          ts.resolveModuleName(
            moduleName,
            sourceFile.fileName,
            compilerOptions,
            ts.sys,
          ).resolvedModule?.resolvedFileName ?? '';
        const moduleFilePath = removeSlash(
          compilerOptions.rootDir
            ? moduleFileFullName.replace(compilerOptions.rootDir, '')
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
  if (include.length !== 0) {
    nodes = nodes.filter(node =>
      include.some(word =>
        node.path.toLowerCase().includes(word.toLowerCase()),
      ),
    );
    relations = relations.filter(({ from, to }) =>
      include.some(
        word =>
          from.path.toLowerCase().includes(word.toLowerCase()) ||
          to.path.toLowerCase().includes(word.toLowerCase()),
      ),
    );
  }
  if (exclude.length !== 0) {
    nodes = nodes.filter(
      node =>
        !exclude.some(word =>
          node.path.toLowerCase().includes(word.toLowerCase()),
        ),
    );
    relations = relations.filter(
      ({ from, to }) =>
        !exclude.some(
          word =>
            from.path.toLowerCase().includes(word.toLowerCase()) ||
            to.path.toLowerCase().includes(word.toLowerCase()),
        ),
    );
  }
  return { nodes, relations };
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
