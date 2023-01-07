#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();
program.option('-d, --dir <char>');
program.parse();
const opt = program.opts();
console.log(opt);

export function main(dir: string) {
  console.log(dir);
  return 'hello';
}

const dir = opt.dir ?? './';
main(dir);
