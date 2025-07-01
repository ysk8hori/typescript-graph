import type { Graph } from '../graph/models';
import type { OptionValues } from '../../setting/model';
import { createDirAndNodesTree } from './directoryTreeBuilder';
import {
  writeFlowchartDirection,
  writeClassDefinitions,
  writeFileNodesWithSubgraph,
  writeRelations,
} from './mermaidWriter';

type Options = Omit<OptionValues, 'watchMetrics'> & {
  rootDir: string;
};

export function writeGraph(
  write: (str: string) => void,
  graph: Graph,
  options: Options,
) {
  write('```mermaid\n');
  mermaidify(str => write(str), graph, options);
  write('```\n');
  write('\n');
}

export function mermaidify(
  write: (arg: string) => void,
  graph: Graph,
  options: Pick<Options, 'LR' | 'TB' | 'abstraction' | 'highlight'>,
) {
  writeFlowchartDirection(write, options);
  writeClassDefinitions(write, graph, options);

  const dirAndNodesTree = createDirAndNodesTree(graph.nodes);
  writeFileNodesWithSubgraph(write, dirAndNodesTree);
  writeRelations(write, graph);
}
