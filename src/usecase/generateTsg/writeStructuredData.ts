import type { measureInstability } from '../../feature/graph/instability';
import type { Graph } from '../../feature/graph/models';
import type { CodeMetrics } from '../../feature/metric/metricsModels';
import type { OptionValues } from '../../setting/model';
import packageJson from '../../../package.json';

type Options = OptionValues & {
  rootDir: string;
  executedScript?: string;
};

export interface StructuredOutput {
  metadata: {
    command: string;
    timestamp: string;
    version: string;
  };
  graph: Graph;
  metrics?: CodeMetrics[];
  instability?: ReturnType<typeof measureInstability>;
}

export function writeStructuredData(
  graph: Graph,
  options: Options,
  couplingData: ReturnType<typeof measureInstability>,
  metrics: CodeMetrics[],
): void {
  if (options.json) {
    const structuredData: StructuredOutput = {
      metadata: {
        command: options.executedScript || 'tsg',
        timestamp: new Date().toISOString(),
        version: packageJson.version,
      },
      graph,
      ...(options.metrics && metrics.length > 0 && { metrics }),
      ...(options.measureInstability &&
        couplingData.length > 0 && { instability: couplingData }),
    };
    console.log(JSON.stringify(structuredData, null, 2));
  }
}
