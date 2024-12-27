import ts from 'typescript';

/** どのノードにおいても実行する処理 */
type Visit = (props: { node: ts.Node; depth: number }) => void;
/** JSX ノードにおいて実行する処理 */
type VisitJsx = (props: {
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement;
  depth: number;
}) => void;
/** 通常の TypeScript ノードにおいて実行する処理 */
type VisitTsNode = (props: { node: ts.Node; depth: number }) => void;

export type AstVisitorProps = {
  /** どのノードにおいても実行する処理 */
  visit?: Visit;
};

export default class AstVisitor {
  #visit?: Visit;
  constructor(props: AstVisitorProps) {
    this.#visit = props.visit;
  }

  #traverse(node: ts.Node, depth: number) {
    this.#visit?.({ node, depth });
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

  traverse(node: ts.Node) {
    this.#traverse(node, 0);
  }
}
