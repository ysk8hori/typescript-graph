import { OptionValues } from '../setting/model';
import chokidar from 'chokidar';
import { pipe, piped, tap } from 'remeda';
import { isTsFile } from '../utils/tsc-util';
import { Table } from 'console-table-printer';
import chalk from 'chalk';
import { CodeMetrics, Score } from '../feature/metric/metricsModels';
import { MetricsScope } from '../feature/metric/metricsModels';
import { getMetricsRawData } from '../feature/metric/functions/getMetricsRawData';
import { convertRawToCodeMetrics } from '../feature/metric/functions/convertRawToCodeMetrics';
import { unTree } from '../utils/Tree';
import { updateMetricsName } from '../feature/metric/functions/updateMetricsName';
import { getIconByState } from '../feature/metric/functions/getIconByState';

type ScoreWithDiff = Score & {
  diff?: number;
};
type FlattenMatericsWithDiff = CodeMetrics & {
  scores: ScoreWithDiff[];
  status?: 'added' | 'deleted';
};

export function watchMetrics(opt: Pick<OptionValues, 'watchMetrics'>) {
  const target =
    typeof opt.watchMetrics === 'boolean' ? ['./'] : opt.watchMetrics;

  // Initialize watcher.
  const watcher = chokidar.watch(target, {
    ignored: (path, stats) =>
      (!!stats?.isFile() && !isTsFile(path)) || path.includes('node_modules'),
    persistent: true,
  });

  watcher
    .on(
      'add',
      piped(
        tap(path => console.log('start watching', path)),
        saveInitialMetrics,
      ),
    )
    .on(
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

/** 初回メトリクス登録時も差分取得時にも共通で使用するメトリクスの取得と整形処理 */
const getMetrics = piped(
  getMetricsRawData,
  convertRawToCodeMetrics,
  updateMetricsName,
  unTree,
);

function consoleMetrics(path: string) {
  try {
    const metrics: {
      name: string;
      scope: MetricsScope;
      Maintainability: string;
      Cyclomatic: string;
      Cognitive: string;
    }[] = pipe(
      path,
      getMetrics,
      injectScoreDiffToOneFileData,
      convertToWatchData,
    );
    const p = new Table({
      columns: [...COLUMNS],
      rows: metrics,
    });
    p.printTable();
  } catch (e) {
    console.error(e);
  }
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
  const icon = getIconByState(score.state);
  switch (score.state) {
    case 'alert':
      return `${icon} ${chalk.yellow(displayValue ?? score.value)}`;
    case 'critical':
      return `${icon} ${chalk.red(displayValue ?? score.value)}`;
    default:
      return displayValue ?? score.value;
  }
}

function getDiffString(score: ScoreWithDiff): string {
  if (!score.diff) return '';
  const diffFromInit = getChalkedDiff(score.betterDirection, score.diff);
  return chalk.gray`(${diffFromInit}) `;
}

function getChalkedDiff(
  betterDirection: ScoreWithDiff['betterDirection'],
  diff: number | undefined,
): string | undefined {
  if (diff === undefined) return '';
  if (betterDirection === 'lower' && diff < 0) return chalk.green(`${diff}`);
  if (betterDirection === 'lower' && 0 < diff) return chalk.red(`+${diff}`);
  if (betterDirection === 'higher' && diff < 0) return chalk.red(`${diff}`);
  if (betterDirection === 'higher' && 0 < diff) return chalk.green(`+${diff}`);
  return '0';
}

const initialMetricsMap: Map<string, CodeMetrics[]> = new Map();
function saveInitialMetrics(path: string) {
  const metrics = pipe(path, getMetrics);
  initialMetricsMap.set(path, metrics);
}

/** 引数は1ファイル分を想定している */
function injectScoreDiffToOneFileData(
  oneFileData: CodeMetrics[],
): FlattenMatericsWithDiff[] {
  const initialMetrics = initialMetricsMap.get(oneFileData[0].filePath);
  if (!initialMetrics) return oneFileData;
  const dataNames = new Set(
    oneFileData.map(m => m.name).concat(initialMetrics.map(m => m.name)),
  );

  const scoresWithDiff: FlattenMatericsWithDiff[] = [];
  for (const name of dataNames) {
    const current = oneFileData.find(flatten => flatten.name === name);
    const initial = initialMetrics.find(m => m.name === name);
    if (current && initial) {
      scoresWithDiff.push({
        ...current,
        scores: current.scores.map((score, scoreIndex) => {
          return {
            ...score,
            diff: round(
              round(score.value) - round(initial.scores[scoreIndex].value),
            ),
          };
        }),
      });
    } else if (current) {
      scoresWithDiff.push({ ...current, status: 'added' });
    }
    // else if (initial) {
    //   scoresWithDiff.push({
    //     ...initial,
    //     name: `${initial?.name} (deleted)`,
    //     status: 'deleted',
    //   });
    // }
  }

  return scoresWithDiff;
}
