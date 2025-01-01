import ts from 'typescript';

export type VisitProps = {
  node: ts.Node;
  depth: number;
  sourceFile: ts.SourceFile;
};

export type Leave = (props: VisitProps) => void;

export interface VisitResult {
  /**
   * 当該ノードの子孫ノードの解析が全て終わり兄弟ノードまたは親ノードの解析へと移行する際に実行する処理。
   */
  leave?: Leave;
  /**
   * 当該ノードとその子孫ノードに対して Visitor を追加したい場合に指定する。
   * additinalVisitor は当該ノードに対する visit を行うが、その結果返却される additionalVisitors は無視する。
   */
  additionalVisitors?: AstVisitor[];
}

type Visit = (props: VisitProps) => void | VisitResult;

export interface AstVisitor {
  visit: Visit;
}

export default class AstTraverser {
  readonly #sourceFile: ts.SourceFile;

  constructor(sourceFile: ts.SourceFile, visitors: AstVisitor[]) {
    this.#sourceFile = sourceFile;
    visitors.forEach(this.#setVisitor.bind(this));
  }
  readonly #visitors: Map<Symbol, AstVisitor> = new Map();
  #setVisitor(visitor: AstVisitor) {
    const key = Symbol();
    this.#visitors.set(key, visitor);
    return key;
  }

  #traverse(node: ts.Node, depth: number) {
    const visitResults: VisitResult[] = [];
    let additionalVisitorIds: Symbol[] = [];

    for (const visitor of this.#visitors.values()) {
      const result = visitor.visit({
        node,
        depth,
        sourceFile: this.#sourceFile,
      });
      if (result) visitResults.push(result);
      additionalVisitorIds = additionalVisitorIds.concat(
        result?.additionalVisitors?.map(this.#setVisitor.bind(this)) ?? [],
      );
      // additionalVisitor について当該ノードに対する visit を行い結果を保持する。
      // 結果の保持は additionalVisitor の leave の処理を行うために必要であるが、
      // additionalVisitor が返却する additionalVisitors は無視する。
      visitResults.concat(
        result?.additionalVisitors
          ?.map(visitor =>
            visitor.visit({ node, depth, sourceFile: this.#sourceFile }),
          )
          .filter(r => !!r) ?? [],
      );
    }

    const nextDepth = depth + 1;
    if (ts.isJsxElement(node)) {
      this.#traverse(node.openingElement, nextDepth);
      this.#traverse(node.closingElement, nextDepth);
      node.children.forEach(node => this.#traverse(node, nextDepth));
    } else if (
      ts.isJsxOpeningElement(node) ||
      ts.isJsxSelfClosingElement(node)
    ) {
      this.#traverse(node.tagName, nextDepth);
      node.attributes.forEachChild(node => this.#traverse(node, nextDepth));
    } else if (ts.isJsxClosingElement(node)) {
      this.#traverse(node.tagName, nextDepth);
    } else {
      ts.forEachChild(node, node => this.#traverse(node, nextDepth));
    }

    // 後処理
    visitResults
      .map(result => result.leave)
      .filter(fn => !!fn)
      .forEach(fn => fn({ node, depth, sourceFile: this.#sourceFile }));
    additionalVisitorIds.forEach(id => this.#visitors.delete(id));
  }

  traverse() {
    this.#traverse(this.#sourceFile, 0);
  }
}
