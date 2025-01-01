#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { createGraph } from './graph/createGraph';
import { filterGraph } from './graph/filterGraph';
import { abstraction } from './graph/abstraction';
import { highlight } from './graph/highlight';
import { writeMarkdownFile } from './writeMarkdownFile';
import packagejson from '../package.json';
import { OptionValues, measureInstability } from './models';
import { pipe } from 'remeda';
import { getConfig, setupConfig } from './config';
import {
  calculateCodeMetrics,
  CodeMetrics,
} from './metrics/calculateCodeMetrics';

const program = new Command();
program
  .name(packagejson.name)
  .description(packagejson.description)
  .version(packagejson.version);
program
  .argument(
    '[include-files]',
    'Specify file paths or parts of file paths to include in the graph (relative to the tsconfig directory, without `./`).',
    '',
  )
  .option(
    '--md <char>',
    'Specify the name of the markdown file to be output. Default is typescript-graph.md.',
  )
  .option(
    '--mermaid-link',
    'Generates a link on node to open that file in VSCode.',
  )
  .option(
    '-d, --dir <char>',
    'Specifies the root directory of the TypeScript project to analyze. It reads and uses the tsconfig.json file found in this directory.',
  )
  .option(
    '--tsconfig <char>',
    'Specifies the path to the tsconfig file to use for analysis. If this option is provided, -d, --dir will be ignored.',
  )
  .option(
    '--include <char...>',
    'Specify file paths or parts of file paths to include in the graph (relative to the tsconfig directory, without `./`).',
  )
  .option(
    '--exclude <char...>',
    'Specify file paths or parts of file paths to exclude from the graph (relative to the tsconfig directory, without `./`).',
  )
  .option('--abstraction <char...>', 'Specify the path to abstract')
  .option(
    '--highlight <char...>',
    'Specify the path and file name to highlight',
  )
  .option('--LR', 'Specify Flowchart orientation Left-to-Right')
  .option('--TB', 'Specify Flowchart orientation Top-to-Bottom')
  .option(
    '--measure-instability',
    'Enable beta feature to measure module instability',
  )
  .option(
    '--metrics',
    'Enable beta feature to measures metrics such as Maintainability Index, Cyclomatic Complexity, and Cognitive Complexity.',
  )
  .option(
    '--config-file',
    'Specify the relative path to the config file (from cwd or specified by -d, --dir). Default is .tsgrc.json.',
  )
  .option('--vue', '(experimental) Enable Vue.js support');
program.parse();

const opt = program.opts<Partial<OptionValues>>();
// tsg の arguments と --include オプションをマージする
opt.include = [...program.args, ...(opt.include ?? [])];
opt.include = opt.include.length === 0 ? undefined : opt.include;

export async function main(
  commandOptions: OptionValues & { executedScript: string },
) {
  setupConfig(
    path.join(
      path.resolve(commandOptions.dir ?? './'),
      commandOptions.configFile ?? '.tsgrc.json',
    ),
  );

  const { graph: fullGraph, meta } = createGraph(commandOptions);

  let metrics: CodeMetrics[] = [];
  if (commandOptions.metrics) {
    console.time('calculateCodeMetrics');
    metrics = calculateCodeMetrics(commandOptions);
    console.timeEnd('calculateCodeMetrics');
  }

  let couplingData: ReturnType<typeof measureInstability> = [];
  if (commandOptions.measureInstability) {
    console.time('coupling');
    couplingData = measureInstability(fullGraph);
    console.timeEnd('coupling');
  }

  const graph = pipe(
    fullGraph,
    graph =>
      filterGraph(
        commandOptions.include,
        [...(getConfig().exclude ?? []), ...(commandOptions.exclude ?? [])],
        graph,
      ),
    graph => abstraction(commandOptions.abstraction, graph),
    graph => highlight(commandOptions.highlight, graph),
  );

  await writeMarkdownFile(
    commandOptions.md ?? 'typescript-graph',
    graph,
    {
      ...commandOptions,
      rootDir: meta.rootDir,
      executedScript: commandOptions.executedScript,
    },
    couplingData,
    metrics,
  );
}
const executedScript = `tsg ${process.argv.slice(2).join(' ')}`;
main({ ...opt, executedScript });
