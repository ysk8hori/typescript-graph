import path from 'path';
import * as ts from 'typescript';
import { Node, Relation } from './models';

export function createGraph(
  sourceFiles: string[],
  compilerOptions: ts.CompilerOptions,
  filter?: string,
): { nodes: Node[]; relations: Relation[] } {
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
  if (filter) {
    nodes = nodes.filter(node => node.path.includes(filter));
    relations = relations.filter(
      ({ from, to }) => from.path.includes(filter) || to.path.includes(filter),
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
