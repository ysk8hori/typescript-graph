import { expect, test } from 'vitest';
import { config, TsgConfigScheme } from './config';

test('config', () => {
  expect(config).toEqual({
    reservedMermaidKeywords: [
      ['/graph/', '/_graph_/'],
      ['style', 'style_'],
      ['graph', 'graph_'],
      ['class', 'class_'],
      ['end', 'end_'],
    ],
  } satisfies TsgConfigScheme);
});
