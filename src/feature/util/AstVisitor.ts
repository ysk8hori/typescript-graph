import type ts from 'typescript';

export interface VisitProps {
  node: ts.Node;
  depth: number;
  sourceFile: ts.SourceFile;
}

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
