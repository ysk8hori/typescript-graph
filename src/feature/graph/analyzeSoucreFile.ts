import ts from 'typescript';
import { Graph } from './models';
import { GraphAnalyzer } from './GraphAnalyzer';
import AstTraverser from '../util/AstTraverser';

export function analyzeSoucreFile(
  options: ts.CompilerOptions,
): (sourceFile: ts.SourceFile) => Graph {
  return (sourceFile: ts.SourceFile) => {
    const analyzer = new GraphAnalyzer(sourceFile, options, ts.sys);
    const traverser = new AstTraverser(sourceFile, [analyzer]);
    traverser.traverse();
    return analyzer.generateGraph();
  };
}
