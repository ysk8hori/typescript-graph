import ts from 'typescript';
import { AstVisitor } from './AstVisitor';
import AstTraverser from './AstTraverser';

type AstVisitorFactory<T extends AstVisitor> = (
  sourceFile: ts.SourceFile,
  tsConfig: ts.ParsedCommandLine,
  system: ts.System,
) => T;

export default class ProjectTraverser {
  constructor(tsconfig: ts.ParsedCommandLine, system: ts.System = ts.sys) {
    this.#system = system;
    this.#tsconfig = tsconfig;
    const program = ts.createProgram(
      tsconfig.fileNames,
      tsconfig.options,
      ts.createCompilerHost(tsconfig.options, true),
    );

    this.#sourceFiles = program
      .getSourceFiles()
      .filter(sourceFile => !sourceFile.fileName.includes('node_modules'));
  }

  #sourceFiles: ts.SourceFile[];
  #system: ts.System;
  #tsconfig: ts.ParsedCommandLine;

  traverse<
    T1 extends AstVisitor,
    T2 extends AstVisitor = never,
    T3 extends AstVisitor = never,
    T4 extends AstVisitor = never,
    T5 extends AstVisitor = never,
  >(
    factory1: AstVisitorFactory<T1>,
    factory2?: AstVisitorFactory<T2>,
    factory3?: AstVisitorFactory<T3>,
    factory4?: AstVisitorFactory<T4>,
    factory5?: AstVisitorFactory<T5>,
  ): [T1, T2, T3, T4, T5][] {
    return this.#sourceFiles
      .map(sourceFile => {
        const visitors = [
          factory1(sourceFile, this.#tsconfig, this.#system),
          factory2?.(sourceFile, this.#tsconfig, this.#system),
          factory3?.(sourceFile, this.#tsconfig, this.#system),
          factory4?.(sourceFile, this.#tsconfig, this.#system),
          factory5?.(sourceFile, this.#tsconfig, this.#system),
        ];

        new AstTraverser(sourceFile, visitors.filter(Boolean)).traverse();
        return visitors;
      })
      .filter(Boolean);
  }
}
