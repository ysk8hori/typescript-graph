import ts from 'typescript';
import { Graph, Node, Relation } from './models';
import { pipe } from 'remeda';
import path from 'path';

export function analyzeSoucreFile(
  options: ts.CompilerOptions,
  getFilePath: (sourceFile: ts.SourceFile) => string,
): (sourceFile: ts.SourceFile) => Graph {
  return (sourceFile: ts.SourceFile) => {
    const nodes: Node[] = [];
    const relations: Relation[] = [];
    const filePath = pipe(sourceFile, getFilePath, removeSlash);
    const fileName = getName(filePath);
    const fromNode: Node = {
      path: filePath,
      name: fileName,
      changeStatus: 'not_modified',
    };
    nodes.push(fromNode);

    ts.forEachChild(sourceFile, node => {
      const importPaths: (string | undefined)[] = [];
      function getModuleNameText(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
          importPaths.push(node.moduleSpecifier?.getText(sourceFile));
        } else if (ts.isCallExpression(node)) {
          const text = node.getText(sourceFile);
          if (text.includes('require') || text.includes('import')) {
            importPaths.push(node.arguments[0]?.getText(sourceFile));
          }
        } else if (ts.isExportDeclaration(node)) {
          importPaths.push(node.moduleSpecifier?.getText(sourceFile));
        }
        ts.forEachChild(node, getModuleNameText);
      }
      getModuleNameText(node);

      importPaths.forEach(moduleNameText => {
        if (!moduleNameText) {
          return;
        }
        const moduleName = moduleNameText.slice(1, moduleNameText.length - 1); // import 文のクォート及びダブルクォートを除去
        const moduleFileFullName =
          ts.resolveModuleName(moduleName, sourceFile.fileName, options, ts.sys)
            .resolvedModule?.resolvedFileName ?? '';
        const moduleFilePath = removeSlash(
          options.rootDir
            ? moduleFileFullName.replace(options.rootDir, '')
            : moduleFileFullName,
        );
        if (!moduleFilePath) {
          return;
        }
        const toNode: Node = {
          path: moduleFilePath,
          name: getName(moduleFilePath),
          changeStatus: 'not_modified',
        };
        if (!findNode(nodes, moduleFilePath)) {
          nodes.push(toNode);
        }
        relations.push({
          kind: 'depends_on',
          from: fromNode,
          to: toNode,
          fullText: node.getChildAt(1, sourceFile)?.getText(sourceFile) ?? '',
          changeStatus: 'not_modified',
        });
      });
    });
    return { nodes, relations };
  };
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
