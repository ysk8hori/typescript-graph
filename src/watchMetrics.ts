import path from 'path';
import { OptionValues } from './models';
import chokidar from 'chokidar';
import ts from 'typescript';
import {
  CodeMetrics,
  convertRowToCodeMetrics,
  flatMetrics as flatCodeMetrics,
  FlattenMaterics,
  getMetricsRowData,
} from './metrics/calculateCodeMetrics';
import { pipe, piped, tap } from 'remeda';
import { isTsFile } from './tsc-utils';

export function watchMetrics(opt: OptionValues) {
  console.log('watch', opt.watchMetrics);

  const target = (() => {
    if (typeof opt.watchMetrics === 'boolean') {
      const configPath = opt.tsconfig
        ? path.resolve(opt.tsconfig)
        : ts.findConfigFile(path.resolve(opt.dir ?? './'), ts.sys.fileExists);
      if (!configPath) {
        throw new Error('Could not find a valid "tsconfig.json".');
      }
      const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
      const splitedConfigPath = configPath.split('/');
      const rootDir = splitedConfigPath
        .slice(0, splitedConfigPath.length - 1)
        .join('/');
      const { fileNames: fullFilePaths } = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        rootDir,
      );
      return fullFilePaths;
    } else {
      return opt.watchMetrics;
    }
  })();

  console.log('target', target);

  // Initialize watcher.
  const watcher = chokidar.watch(target, {
    ignored: (path, stats) => !!stats?.isFile() && !isTsFile(path),
    persistent: true,
  });

  watcher.on('add', piped(tap(path => console.log('add', path)))).on(
    'change',
    piped(
      tap(path => console.log('change', path)),
      consoleMetrics,
    ),
  );
}

function consoleMetrics(path: string) {
  const metrics = pipe(
    path,
    getMetricsRowData,
    convertRowToCodeMetrics,
    flatCodeMetrics,
    convertToWatchData,
  );
  console.table(metrics);
}

function convertToWatchData(codeMetrics: FlattenMaterics[]) {
  return codeMetrics.map(m => ({
    name: m.name,
    scope: m.scope,
    'Maintainability Index': Math.round(m.scores[0].value * 100) / 100,
    'Cyclomatic Complexity': m.scores[1].value,
    'Cognitive Complexity': m.scores[2].value,
  }));
}
