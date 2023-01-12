import * as ts from 'typescript';
import { Node, Relation } from './models';

export function createGraph(
  sourceFiles: string[],
  options: ts.CompilerOptions,
): { nodes: Node[]; relations: Relation[] } {
  const program = ts.createProgram(sourceFiles, options);
  const nodes: Node[] = [];
  const relations: Relation[] = [];

  program
    .getSourceFiles()
    .filter(sourceFile => !sourceFile.fileName.includes('node_modules'))
    .forEach(sourceFile => {
      const fileName = removeSlash(
        options.rootDir
          ? sourceFile.fileName.replace(options.rootDir + '/', '')
          : sourceFile.fileName,
      );
      nodes.push({ fileName });
      ts.forEachChild(sourceFile, node => {
        if (!ts.isImportDeclaration(node)) return;
        const moduleNameText = node.moduleSpecifier.getText(sourceFile);
        const moduleName = moduleNameText.slice(1, moduleNameText.length - 1); // import 文のクォート及びダブルクォートを除去
        const moduleFileFullName =
          ts.resolveModuleName(moduleName, sourceFile.fileName, options, ts.sys)
            .resolvedModule?.resolvedFileName ?? '';
        const moduleFileName = removeSlash(
          options.rootDir
            ? moduleFileFullName.replace(options.rootDir, '')
            : moduleFileFullName,
        );
        if (!moduleFileName) return;
        if (!findNode(nodes, moduleFileName))
          nodes.push({ fileName: moduleFileName });
        relations.push({
          from: { fileName },
          to: { fileName: moduleFileName },
        });
      });
    });
  return { nodes, relations };
}

function findNode(nodes: Node[], fileName: string): Node | undefined {
  return nodes.find(node => node.fileName === fileName);
}

function removeSlash(pathName: string): string {
  return pathName.startsWith('/') ? pathName.replace('/', '') : pathName;
}
