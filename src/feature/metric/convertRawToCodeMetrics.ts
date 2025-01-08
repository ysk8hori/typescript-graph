import { pipe, zipWith } from 'remeda';
import { CognitiveComplexityMetrics } from './CognitiveComplexity';
import { CyclomaticComplexityMetrics } from './CyclomaticComplexity';
import { MetricsScope } from './Metrics';
import { MetricsScoreState } from './metricsModels';
import { SemanticSyntaxVolumeMetrics } from './SemanticSyntaxVolume';
import {
  calculateMaintainabilityIndex,
  RawMetricsWithMaintainabilityIndex,
} from './calculateMaintainabilityIndex';

export interface Score {
  /** 計測した値の名前。 Maintainability Index など。 */
  name: string;
  /** 計測した値 */
  value: number;
  /** 判定結果 */
  state: MetricsScoreState;
  /** 値が高いほど良いか低いほど良いか */
  betterDirection: 'higher' | 'lower' | 'none';
}

export interface CodeMetrics {
  filePath: string;
  /** クラス名や関数名など */
  name: string;
  scope: MetricsScope;
  scores: Score[];
  children?: CodeMetrics[];
}

interface RawMetrics {
  semanticSyntaxVolume: SemanticSyntaxVolumeMetrics;
  cyclomaticComplexity: CyclomaticComplexityMetrics;
  cognitiveComplexity: CognitiveComplexityMetrics;
}

interface ZippedRawMetrics extends RawMetrics {
  name: string;
  scope: MetricsScope;
  children: ZippedRawMetrics[] | undefined;
}

interface ZippedRawMetricsWithFilePath extends ZippedRawMetrics {
  filePath: string;
  children: ZippedRawMetricsWithFilePath[] | undefined;
}

export function convertRawToCodeMetrics({
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
}: RawMetrics): CodeMetrics {
  return pipe(
    {
      semanticSyntaxVolume,
      cognitiveComplexity,
      cyclomaticComplexity,
    },
    zipChildren,
    addFilePath,
    calculateMaintainabilityIndex,
    convertCalculatedToCodeMetrics,
  );
}

function addFilePath(
  zippedRawMetrics: ZippedRawMetrics,
  filePath?: string,
): ZippedRawMetricsWithFilePath {
  return {
    ...zippedRawMetrics,
    filePath: filePath ?? zippedRawMetrics.name,
    children: zippedRawMetrics.children?.map(c =>
      addFilePath(c, filePath ?? zippedRawMetrics.name),
    ),
  };
}

function convertCalculatedToCodeMetrics({
  filePath,
  name,
  scope,
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
  maintainabilityIndex,
  children,
}: RawMetricsWithMaintainabilityIndex): CodeMetrics {
  return {
    filePath,
    name,
    scope,
    scores: [
      {
        name: 'Maintainability Index',
        value: maintainabilityIndex,
        state: getMarker(scope)(maintainabilityIndex),
        betterDirection: 'higher',
      },
      {
        name: 'Cyclomatic Complexity',
        value: cyclomaticComplexity.score,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'Cognitive Complexity',
        value: cognitiveComplexity.score,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'lines',
        value: semanticSyntaxVolume.score.lines,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'semantic syntax volume',
        value: semanticSyntaxVolume.score.volume,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'total operands',
        value: semanticSyntaxVolume.score.operandsTotal,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'unique operands',
        value: semanticSyntaxVolume.score.operandsUnique,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'total semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxTotal,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'unique semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxUnique,
        state: 'normal',
        betterDirection: 'lower',
      },
    ] as const,
    children: children?.map(convertCalculatedToCodeMetrics),
  };
}

function zipChildren({
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
}: RawMetrics): ZippedRawMetrics {
  return {
    name: cognitiveComplexity.name, // cognitiveComplexity じゃなくてもいい
    scope: cognitiveComplexity.scope, // cognitiveComplexity じゃなくてもいい
    cognitiveComplexity,
    semanticSyntaxVolume,
    cyclomaticComplexity,
    children: zipHierarchicalMetris(
      semanticSyntaxVolume.children,
      cyclomaticComplexity.children,
      cognitiveComplexity.children,
    )?.map(zipChildren),
  };
}

function zipHierarchicalMetris(
  semanticSyntaxVolumeChildren?: SemanticSyntaxVolumeMetrics[],
  cyclomaticComplexityChildren?: CyclomaticComplexityMetrics[],
  cognitiveComplexityChildren?: CognitiveComplexityMetrics[],
): RawMetrics[] | undefined {
  return semanticSyntaxVolumeChildren &&
    cyclomaticComplexityChildren &&
    cognitiveComplexityChildren
    ? zipWith(
        (
          cognitiveComplexity: CognitiveComplexityMetrics,
          doubleProp: Pick<
            RawMetrics,
            'semanticSyntaxVolume' | 'cyclomaticComplexity'
          >,
        ) => {
          return {
            cognitiveComplexity,
            ...doubleProp,
          } satisfies RawMetrics;
        },
      )(
        cognitiveComplexityChildren,
        zipWith(
          (
            semanticSyntaxVolume: SemanticSyntaxVolumeMetrics,
            cyclomaticComplexity: CyclomaticComplexityMetrics,
          ) => {
            return {
              semanticSyntaxVolume,
              cyclomaticComplexity,
            } satisfies Pick<
              RawMetrics,
              'semanticSyntaxVolume' | 'cyclomaticComplexity'
            >;
          },
        )(semanticSyntaxVolumeChildren, cyclomaticComplexityChildren),
      )
    : undefined;
}

function getMarker(scope: MetricsScope) {
  switch (scope) {
    case 'class':
      return getClassMIState;
    case 'file':
      return getFileMIState;
    default:
      return getMIState;
  }
}

function getMIState(score: number): MetricsScoreState {
  if (score < 10) return 'critical';
  if (score < 20) return 'alert';
  return 'normal';
}

function getClassMIState(score: number): MetricsScoreState {
  if (score === 0) return 'critical';
  if (score < 10) return 'alert';
  return 'normal';
}

function getFileMIState(score: number): MetricsScoreState {
  if (score === 0) return 'critical';
  if (score < 10) return 'alert';
  return 'normal';
}
