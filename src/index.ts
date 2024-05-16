#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { createGraph } from './graph/createGraph';
import { filterGraph } from './graph/filterGraph';
import { abstraction } from './graph/abstraction';
import { highlight } from './graph/highlight';
import { writeMarkdownFile } from './writeMarkdownFile';
import packagejson from '../package.json';
import { OptionValues } from './models';
import { pipe } from 'remeda';
import { getConfig, setupConfig } from './config';

const program = new Command();
program
  .name(packagejson.name)
  .description(packagejson.description)
  .version(packagejson.version);
program
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
    'Specify the TypeScript code base to be analyzed. if tsconfig.json is not found, specify the directory where tsconfig.json is located.',
  )
  .option(
    '--include <char...>',
    'Specify paths and file names to be included in the graph',
  )
  .option(
    '--exclude <char...>',
    'Specify the paths and file names to be excluded from the graph',
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
    'Enable the beta feature to measure the instability of the modules',
  )
  .option(
    '--config-file',
    'Specify the relative path to the config file (from cwd or specified by -d, --dir). Default is .tsgrc.json.',
  );
program.parse();

const opt = program.opts<Partial<OptionValues>>();

export async function main(
  dir: string,
  commandOptions: typeof opt & { executedScript: string },
) {
  setupConfig(path.join(dir, commandOptions.configFile ?? '.tsgrc.json'));

  const { graph: fullGraph, meta } = createGraph(dir);

  let couplingData: {
    afferentCoupling: number;
    efferentCoupling: number;
    path: string;
    name: string;
    isDirectory?: boolean | undefined;
  }[] = [];
  if (commandOptions.measureInstability) {
    console.time('coupling');
    couplingData = fullGraph.nodes.map(node => {
      const afferentCoupling = fullGraph.relations.filter(
        r => r.kind === 'depends_on' && r.to.path === node.path,
      ).length;
      const efferentCoupling = fullGraph.relations.filter(
        r => r.kind === 'depends_on' && r.from.path === node.path,
      ).length;
      return { ...node, afferentCoupling, efferentCoupling };
    });
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
  );
}

const dir = path.resolve(opt.dir ?? './');
const executedScript = `tsg ${process.argv.slice(2).join(' ')}`;
main(dir, { ...opt, executedScript });
