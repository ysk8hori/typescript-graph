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
  Score,
} from './metrics/calculateCodeMetrics';
import { pipe, piped, tap } from 'remeda';
import { isTsFile } from './tsc-utils';
import { Table } from 'console-table-printer';
import chalk from 'chalk';

type ScoreWithDiff = Score & {
  diff?: number;
};
type FlattenMatericsWithDiff = FlattenMaterics & {
  scores: ScoreWithDiff[];
};

export function watchMetrics(opt: OptionValues) {
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

  target.forEach(saveInitialMetrics);

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

const MAINTAINABILITY_COLUMN = 'Maintainability';
const CYCLOMATIC_COMPLEXITY_COLUMN = 'Cyclomatic';
const COGNITIVE_COMPLEXITY_COLUMN = 'Cognitive';

const COLUMNS = [
  { name: 'name', alignment: 'left' },
  { name: 'scope', alignment: 'left' },
  { name: MAINTAINABILITY_COLUMN, alignment: 'right' },
  { name: CYCLOMATIC_COMPLEXITY_COLUMN, alignment: 'right' },
  { name: COGNITIVE_COMPLEXITY_COLUMN, alignment: 'right' },
] as const;

function consoleMetrics(path: string) {
  const metrics = pipe(
    path,
    getMetricsRowData,
    convertRowToCodeMetrics,
    flatCodeMetrics,
    injectScoreDiffToOneFileData,
    convertToWatchData,
  );
  const p = new Table({
    columns: [...COLUMNS],
    rows: metrics,
  });
  p.printTable();
}

function convertToWatchData(codeMetrics: FlattenMatericsWithDiff[]) {
  return codeMetrics.map(m => ({
    name: m.name,
    scope: m.scope,
    [MAINTAINABILITY_COLUMN]:
      getDiffString(m.scores[0]) +
      getChalkedValue(m.scores[0], round(m.scores[0].value).toFixed(2)),
    [CYCLOMATIC_COMPLEXITY_COLUMN]:
      getDiffString(m.scores[1]) + m.scores[1].value,
    [COGNITIVE_COMPLEXITY_COLUMN]:
      getDiffString(m.scores[2]) + m.scores[2].value,
  }));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function getChalkedValue(
  score: FlattenMatericsWithDiff['scores'][number],
  displayValue?: string,
) {
  switch (score.state) {
    case 'alert':
      return `💣 ${chalk.yellow(displayValue ?? score.value)}`;
    case 'critical':
      return `💥 ${chalk.red(displayValue ?? score.value)}`;
    default:
      return displayValue ?? score.value;
  }
}

function getDiffString(score: ScoreWithDiff) {
  if (score.diff === undefined || score.diff === 0) return '';
  return getChalkForDiff(score)(
    score.diff > 0 ? `(+${score.diff})` : `(${score.diff})`,
  );
}

function getChalkForDiff(score: ScoreWithDiff) {
  if (score.betterDirection === 'lower') {
    if ((score.diff ?? 0) < 0) return chalk.green;
    return chalk.red;
  }
  if (0 < (score.diff ?? 0)) return chalk.green;
  return chalk.red;
}

const initialMetricsMap: Map<string, FlattenMaterics[]> = new Map();
function saveInitialMetrics(path: string) {
  const metrics = pipe(
    path,
    getMetricsRowData,
    convertRowToCodeMetrics,
    flatCodeMetrics,
  );
  initialMetricsMap.set(path, metrics);
}

/** 引数は1ファイル分を想定している */
function injectScoreDiffToOneFileData(
  oneFileData: FlattenMaterics[],
): FlattenMatericsWithDiff[] {
  const initialMetrics = initialMetricsMap.get(oneFileData[0].fileName);
  if (!initialMetrics) return oneFileData;

  const scoresWithDiff = oneFileData.map((flatten, flattenIndex) => {
    return {
      ...flatten,
      scores: flatten.scores.map((score, scoreIndex) => {
        return {
          ...score,
          diff: round(
            round(score.value) -
              round(initialMetrics[flattenIndex].scores[scoreIndex].value),
          ),
        };
      }),
    };
  });

  return scoresWithDiff;
}
