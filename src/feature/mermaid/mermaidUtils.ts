import { getConfig } from '../../setting/config';

export function fileNameToMermaidId(fileName: string): string {
  return getConfig().reservedMermaidKeywords.reduce(
    (prev, [from, to]) => prev.replaceAll(from, to),
    fileName.split(/@|\[|\]|-|>|<|{|}|\(|\)|=|&|\|~|,|"|%|\^|\*|_/).join('//'),
  );
}

export function fileNameToMermaidName(fileName: string): string {
  return fileName.split(/"/).join('//');
}
