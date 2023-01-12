#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import * as ts from 'typescript';
import { createGraph } from './createGraph';
import mermaidify, { output } from './mermaidify';

const program = new Command();
program.option('-d, --dir <char>');
program.parse();
const opt = program.opts();

export function main(dir: string) {
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

  const graph = createGraph(fileNames, options);
  const mermaid = mermaidify(graph);
  output('dir', mermaid);
}

const dir = path.resolve(opt.dir ?? './');
main(dir);
