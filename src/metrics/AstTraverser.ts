import ts from 'typescript';

export type VisitProps = {
  node: ts.Node;
  depth: number;
  sourceFile: ts.SourceFile;
};

type Visit = (props: VisitProps) => void;

export interface AstVisitor {
  visit: Visit;
}

export default class AstTraverser {
  readonly #visitors: AstVisitor[];
  readonly #sourceFile: ts.SourceFile;
  constructor(sourceFile: ts.SourceFile, visitors: AstVisitor[]) {
    this.#sourceFile = sourceFile;
    this.#visitors = visitors;
  }

  #traverse(node: ts.Node, depth: number) {
    this.#visitors.forEach(visitor =>
      visitor.visit({ node, depth, sourceFile: this.#sourceFile }),
    );
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
  }

  traverse() {
    this.#traverse(this.#sourceFile, 0);
  }
}
