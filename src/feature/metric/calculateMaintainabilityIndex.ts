export function calculateMaintainabilityIndex({
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
  lines,
}: {
  semanticSyntaxVolume: number;
  cognitiveComplexity: number;
  cyclomaticComplexity: number;
  lines: number;
}): number {
  return Math.max(
    0,
    ((171 -
      5.2 * Math.log(semanticSyntaxVolume) -
      0.115 * cyclomaticComplexity -
      0.115 * cognitiveComplexity -
      16.2 * Math.log(lines)) *
      100) /
      171,
  );
}
