#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import * as ts from 'typescript';
import { createGraph } from './createGraph';
import mermaidify, { output } from './mermaidify';
import { clearDatabase, neo4jfy } from './neo4jfy';

const program = new Command();
// TODO filter オプションを追加して、指定した filter に該当するもののみをターゲットにする
program
  .option('-d, --dir <char>')
  .option('-f --filter <char>')
  .option('--neo4j');
program.parse();
const opt = program.opts();

export async function main(dir: string, commandOptions: typeof opt) {
  if (commandOptions.neo4j) {
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

  const graph = createGraph(fileNames, options, commandOptions.filter);
  const mermaid = mermaidify(graph);
  output('dir', mermaid);

  if (commandOptions.neo4j) {
    await neo4jfy(graph);
  }
}

const dir = path.resolve(opt.dir ?? './');
main(dir, opt);
