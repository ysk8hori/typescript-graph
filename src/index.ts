#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import * as ts from 'typescript';
import { createGraph } from './createGraph';
import mermaidify, { output } from './mermaidify';
import { clearDatabase, neo4jfy } from './neo4jfy';
import packagejson from '../package.json';

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
    '-d, --dir <char>',
    'Specify the TypeScript code base to be analyzed. if tsconfig.json is not found, specify the directory where tsconfig.json is located.',
  )
  .option(
    '--include <char...>',
    'specify multiple strings to be included in the path or filename to be included in the output',
  )
  .option(
    '--exclude <char...>',
    'specify multiple strings in the path or filename to exclude from output',
  )
  .option('--neo4j', 'output to neo4j on localhost:7687')
  .option('--clear-db', 'clear neo4j database before output');
program.parse();
const opt = program.opts();

export async function main(dir: string, commandOptions: typeof opt) {
  if (commandOptions.neo4j && commandOptions.clearDb) {
    await clearDatabase();
  }
  const configPath = ts.findConfigFile(dir, ts.sys.fileExists);
  if (!configPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
  }
  console.log(configPath);
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const splitedConfigPath = configPath.split('/');
  const rootDir = splitedConfigPath
    .slice(0, splitedConfigPath.length - 1)
    .join('/');
  console.log(rootDir);
  const { options, fileNames } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    rootDir,
  );
  options.rootDir = rootDir;

  const graph = createGraph(
    fileNames,
    options,
    commandOptions.include ?? [],
    commandOptions.exclude ?? [],
  );
  const mermaid = mermaidify(graph);
  output(commandOptions.md ?? 'typescript-graph', mermaid);

  if (commandOptions.neo4j) {
    await neo4jfy(graph);
  }
}

const dir = path.resolve(opt.dir ?? './');
main(dir, opt);
