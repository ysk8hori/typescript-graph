import type { Graph } from '../../feature/graph/models';
import type { OptionValues } from '../../setting/model';
import type { CodeMetrics } from '../../feature/metric/metricsModels';
import { mermaidify } from '../../feature/mermaid/mermaidify';

interface AiMetrics {
  filePath: string;
  maintainabilityIndex: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
}

interface AiOutput {
  metadata: {
    command: string;
    timestamp: string;
    version: string;
  };
  metrics: AiMetrics[];
}

export function writeForAiData(
  graph: Graph,
  options: OptionValues & { rootDir?: string; executedScript?: string },
  metrics: CodeMetrics[],
): void {
  // Parse stdout types
  const stdoutTypes = Array.isArray(options.stdout) 
    ? options.stdout 
    : options.stdout === true 
      ? ['all'] 
      : [];

  // Determine what to output
  const shouldOutputAll = stdoutTypes.length === 0 || stdoutTypes.includes('all');
  const shouldOutputDepGraph = shouldOutputAll || stdoutTypes.includes('deps');
  const shouldOutputMetrics = shouldOutputAll || stdoutTypes.includes('metrics');

  // Dependency Graph section
  if (shouldOutputDepGraph) {
    process.stdout.write('=== DEPENDENCY GRAPH ===\n');
    mermaidify((str: string) => process.stdout.write(str), graph, options);
  }

  // Code Metrics section
  if (shouldOutputMetrics) {
    if (shouldOutputDepGraph) {
      process.stdout.write('\n=== CODE METRICS ===\n');
    } else {
      process.stdout.write('=== CODE METRICS ===\n');
    }

    // Convert metrics to AI-friendly format
    const aiMetrics: AiMetrics[] = metrics.map(metric => ({
      filePath: metric.filePath,
      maintainabilityIndex:
        Math.round(
          (metric.scores.find(s => s.name === 'Maintainability Index')?.value ??
            0) * 100,
        ) / 100,
      cyclomaticComplexity:
        metric.scores.find(s => s.name === 'Cyclomatic Complexity')?.value ?? 0,
      cognitiveComplexity:
        metric.scores.find(s => s.name === 'Cognitive Complexity')?.value ?? 0,
    }));

    const aiOutput: AiOutput = {
      metadata: {
        command: options.executedScript ?? 'tsg --for-ai',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? 'unknown',
      },
      metrics: aiMetrics,
    };

    process.stdout.write(JSON.stringify(aiOutput, null, 2));
  }
}
