import path from 'path';
import { OptionValues } from '../setting/model';
import ts from 'typescript';

export function isTsFile(path: string) {
  return [
    '.ts',
    '.tsx',
    '.d.ts',
    '.js',
    '.jsx',
    '.json',
    '.tsbuildinfo',
    '.mjs',
    '.mts',
    '.d.mts',
    '.cjs',
    '.cts',
    '.d.cts',
  ].some(ext => path.endsWith(ext));
}

type Tsconfig = ts.ParsedCommandLine & {
  options: ts.CompilerOptions & { rootDir: string };
};

/** tsconfig を見つけられない場合はエラーを吐く */
export function resolveTsconfig(
  commandOptions: Pick<OptionValues, 'tsconfig' | 'dir'>,
  system: ts.System = ts.sys,
): Tsconfig {
  const tsConfigPath = commandOptions.tsconfig
    ? path.resolve(commandOptions.tsconfig)
    : ts.findConfigFile(
        path.resolve(commandOptions.dir ?? './'),
        ts.sys.fileExists,
      );
  if (!tsConfigPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
  }

  const { config } = ts.readConfigFile(tsConfigPath, system.readFile);
  const splitedConfigPath = tsConfigPath.split('/');
  const rootDir = splitedConfigPath
    .slice(0, splitedConfigPath.length - 1)
    .join('/');
  const tsconfig = ts.parseJsonConfigFileContent(config, system, rootDir);
  tsconfig.options.rootDir = rootDir;
  return tsconfig as Tsconfig;
}
