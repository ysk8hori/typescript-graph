#!/usr/bin/env node

import { Command } from 'commander';
import packagejson from '../../package.json';
import type { OptionValues } from '../setting/model';
import { generateTsg } from '../usecase/generateTsg';
import { watchMetrics } from '../usecase/watchMetrics';

const program = new Command();
program
  .name(packagejson.name)
  .description(packagejson.description)
  .version(packagejson.version);
program
  .argument(
    '[include-files...]',
    'Specify file paths or parts of file paths to include in the graph (relative to the tsconfig directory, without `./`).',
    '',
  )
  .option(
    '--md [char]',
    'Specify the name of the markdown file to be output. Default is typescript-graph.md.',
  )
  .option(
    '--mermaid-link',
    'Generates a link on node to open that file in VSCode.',
  )
  .option(
    '-d, --dir [char]',
    'Specifies the root directory of the TypeScript project to analyze. It reads and uses the tsconfig.json file found in this directory.',
  )
  .option(
    '--tsconfig [char]',
    'Specifies the path to the tsconfig file to use for analysis. If this option is provided, -d, --dir will be ignored.',
  )
  .option(
    '--include [char...]',
    'Specify file paths or parts of file paths to include in the graph (relative to the tsconfig directory, without `./`).',
  )
  .option(
    '--exclude [char...]',
    'Specify file paths or parts of file paths to exclude from the graph (relative to the tsconfig directory, without `./`).',
  )
  .option('--abstraction [char...]', 'Specify the path to abstract')
  .option(
    '--highlight [char...]',
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
  .option('-w, --watch-metrics [char...]', 'watch metrics', '')
  .option(
    '--config-file',
    'Specify the relative path to the config file (from cwd or specified by -d, --dir). Default is .tsgrc.json.',
  )
  .option('--vue', '(experimental) Enable Vue.js support')
  .option('--for-ai', 'Output both dependency graph (Mermaid) and code metrics (JSON) for AI analysis');
program.parse();

const opt = program.opts<OptionValues>();
// tsg の arguments と --include オプションをマージする
opt.include = [...program.args, ...(opt.include ?? [])];
opt.include = opt.include.length === 0 ? undefined : opt.include;

if (opt.watchMetrics) {
  watchMetrics(opt);
} else {
  const executedScript = `tsg ${process.argv.slice(2).join(' ')}`;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  generateTsg({ ...opt, executedScript });
}
