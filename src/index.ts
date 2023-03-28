#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { createGraph } from './graph/createGraph';
import { filterGraph } from './graph/filterGraph';
import { abstraction } from './graph/abstraction';
import { highlight } from './graph/highlight';
import { writeMarkdownFile } from './writeMarkdownFile';
import { clearDatabase, neo4jfy } from './neo4jfy';
import packagejson from '../package.json';
import { OptionValues } from './models';
import { curry, pipe } from '@ysk8hori/simple-functional-ts';

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
  .option('--neo4j', 'output to neo4j on localhost:7687')
  .option('--clear-db', 'clear neo4j database before output');
program.parse();

const opt = program.opts<Partial<OptionValues>>();

export async function main(
  dir: string,
  commandOptions: typeof opt & { executedScript: string },
) {
  if (commandOptions.neo4j && commandOptions.clearDb) {
    await clearDatabase();
  }

  const { graph: fullGraph, meta } = createGraph(dir);

  const graph = pipe(
    curry(filterGraph)(commandOptions.include)(commandOptions.exclude),
    curry(abstraction)(commandOptions.abstraction),
    curry(highlight)(commandOptions.highlight),
  )(fullGraph);

  await writeMarkdownFile(commandOptions.md ?? 'typescript-graph', graph, {
    ...commandOptions,
    rootDir: meta.rootDir,
    executedScript: commandOptions.executedScript,
  });

  if (commandOptions.neo4j) {
    await neo4jfy(graph);
  }
}

const dir = path.resolve(opt.dir ?? './');
const executedScript = `tsg ${process.argv.slice(2).join(' ')}`;
main(dir, { ...opt, executedScript });
