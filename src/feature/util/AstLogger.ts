import ts from 'typescript';
import type { AstVisitor, VisitProps } from './AstVisitor';

export default class AstLogger implements AstVisitor {
  visit({ node, depth, sourceFile }: VisitProps): void {
    this.#addLog(this.#no++, depth, node, sourceFile);
  }

  /** visit したノードのインデックス番号を記録するカウンター */
  #no: number = 0;
  /** visit したノード1つにつき1行データを登録する */
  #logList: string[] = [
    'No. | depth | code | SyntaxKind | NodeFlags',
    '--|--|--|--|--',
  ];

  #addLog(no: number, depth: number, node: ts.Node, sourceFile: ts.SourceFile) {
    this.#logList.push(
      [
        no.toString().padStart(3, ' '),
        depth.toString().padEnd(depth, '>'),
        this.#getText(node, sourceFile),
        this.#getSyntaxKindText(node),
        ts.NodeFlags[node.flags],
      ].join(' | '),
    );
  }

  #getText(node: ts.Node, sourceFile: ts.SourceFile) {
    return node
      .getText(sourceFile)
      .replaceAll(/\r?\n */g, ' ')
      .replaceAll('|', '\\|');
  }

  #getSyntaxKindText(node: ts.Node) {
    const operator = (node as any)['operator'];
    return `${ts.SyntaxKind[node.kind]}${operator ? ` (${ts.SyntaxKind[operator]})` : ''}`;
  }

  /** 収集したログ文字列を取得する */
  get log() {
    return this.#logList.join('\n');
  }
}
