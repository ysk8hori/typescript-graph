import { pipe, zipWith } from 'remeda';
import { CognitiveComplexityMetrics } from '../cognitiveComplexity';
import { CyclomaticComplexityMetrics } from '../cyclomaticComplexity';
import { CodeMetrics, MetricsScope } from '../metricsModels';
import { MetricsScoreState } from '../metricsModels';
import { SemanticSyntaxVolumeMetrics } from '../semanticSyntaxVolume';
import {
  calculateMaintainabilityIndex,
  RawMetricsWithMaintainabilityIndex,
} from './calculateMaintainabilityIndex';
import { Tree } from '../../../utils/Tree';

export interface RawMetrics {
  semanticSyntaxVolume: SemanticSyntaxVolumeMetrics;
  cyclomaticComplexity: CyclomaticComplexityMetrics;
  cognitiveComplexity: CognitiveComplexityMetrics;
}

interface ZippedRawMetrics extends RawMetrics {
  name: string;
  scope: MetricsScope;
}

interface ZippedRawMetricsWithFilePath extends ZippedRawMetrics {
  filePath: string;
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
  zippedRawMetrics: Tree<ZippedRawMetrics>,
  filePath?: string,
): Tree<ZippedRawMetricsWithFilePath> {
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
}: Tree<RawMetricsWithMaintainabilityIndex>): Tree<CodeMetrics> {
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
}: RawMetrics): Tree<ZippedRawMetrics> {
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
  if (score < 10) return 'critical';
  if (score < 20) return 'alert';
  return 'normal';
}

function getFileMIState(score: number): MetricsScoreState {
  if (score < 10) return 'critical';
  if (score < 20) return 'alert';
  return 'normal';
}
