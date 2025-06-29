import type { Graph } from '../../feature/graph/models';
import type { OptionValues } from '../../setting/model';
import { mermaidify } from '../../feature/mermaid/mermaidify';

type Options = Omit<OptionValues, 'watchMetrics'> & {
  rootDir: string;
};

/**
 * Mermaid diagram syntax をstdoutに出力する
 */
export function writeMermaidData(graph: Graph, options: Options): void {
  mermaidify(
    (str: string) => process.stdout.write(str),
    graph,
    options,
  );
}