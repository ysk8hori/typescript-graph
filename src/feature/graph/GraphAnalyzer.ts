import ts from 'typescript';
import { AstVisitor, VisitProps } from '../util/AstVisitor';
import { Graph, Node, Relation } from './models';
import path from 'path';

export class GraphAnalyzer implements AstVisitor {
  constructor(
    sourceFile: ts.SourceFile,
    tsconfig: ts.ParsedCommandLine,
    system: ts.System,
  ) {
    this.#sourceFile = sourceFile;
    this.#tsconfig = tsconfig;
    this.#system = system;
  }
  readonly #sourceFile: ts.SourceFile;
  readonly #tsconfig: ts.ParsedCommandLine;
  readonly #system: ts.System;

  visit({ node }: VisitProps): void {
    const importPath = this.#getImportPath(node);
    if (!importPath) return;

    this.#addModuleFilePath(this.#getModuleFilePath(importPath));
    return;
  }

  #getImportPath(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      return node.moduleSpecifier?.getText(this.#sourceFile);
    } else if (ts.isCallExpression(node)) {
      const text = node.getText(this.#sourceFile);
      if (text.includes('require') || text.includes('import')) {
        return node.arguments[0]?.getText(this.#sourceFile);
      }
    } else if (ts.isExportDeclaration(node)) {
      return node.moduleSpecifier?.getText(this.#sourceFile);
    }
  }

  #getModuleFilePath(moduleNameText: string) {
    const moduleName = moduleNameText.slice(1, moduleNameText.length - 1); // import 文のクォート及びダブルクォートを除去
    const moduleFileFullName =
      ts.resolveModuleName(
        moduleName,
        this.#sourceFile.fileName,
        this.#tsconfig.options,
        this.#system,
      ).resolvedModule?.resolvedFileName ?? '';
    const moduleFilePath = this.#getFilePath(moduleFileFullName);
    return moduleFilePath;
  }

  /**
   * 通常 ts.SourceFile の fileName は `/usr/ysk8/dev/typescript-graph/src/foo/bar` なのでそれを `src/foo/bar` に加工して返す。
   * 前提として、options に rootDir が指定されている必要がある。
   */
  #getFilePath(fileName: string): string {
    return this.#tsconfig.options.rootDir
      ? fileName.replace(this.#tsconfig.options.rootDir + '/', '')
      : fileName;
  }

  #moduleFilePath: string[] = [];
  #addModuleFilePath(moduleFilePath: string | undefined) {
    if (!moduleFilePath) return;
    this.#moduleFilePath.push(moduleFilePath);
  }

  public generateGraph(): Graph {
    const nodes: Node[] = [];
    const relations: Relation[] = [];
    const filePath = this.#getFilePath(this.#sourceFile.fileName);
    const fileName = getName(this.#sourceFile.fileName);
    const fromNode: Node = {
      path: filePath,
      name: fileName,
      changeStatus: 'not_modified',
    };
    nodes.push(fromNode);

    this.#moduleFilePath.forEach(moduleFilePath => {
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
        changeStatus: 'not_modified',
      });
    });
    return { nodes, relations };
  }
}

/**
 * そのモジュールを表す文字列を抽出する。
 * node_modules の配下のモジュールの場合は詳細を見せないようにする。
 */
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
