import path from 'path';
import * as ts from 'typescript';
import { Graph, Meta, Node, Relation } from '../models';

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
      const fromNode: Node = {
        path: filePath,
        name: fileName,
        changeStatus: 'not_modified',
      };
      nodes.push(fromNode);

      ts.forEachChild(sourceFile, node => {
        if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) {
          return;
        }
        const moduleNameText = node.moduleSpecifier?.getText(sourceFile);
        if (!moduleNameText) return;
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
          changeStatus: 'not_modified',
        };
        if (!findNode(nodes, moduleFilePath)) {
          nodes.push(toNode);
        }
        relations.push({
          kind: 'depends_on',
          from: fromNode,
          to: toNode,
          fullText: node.getChildAt(1, sourceFile).getText(sourceFile),
          changeStatus: 'not_modified',
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
