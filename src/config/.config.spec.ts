import { beforeAll, expect, test } from 'vitest';
import { config, setupConfig, TsgConfigScheme } from '.';

beforeAll(() => setupConfig());

test('config', () => {
  expect(config()).toEqual({
    reservedMermaidKeywords: [
      ['/graph/', '/_graph_/'],
      ['style', 'style_'],
      ['graph', 'graph_'],
      ['class', 'class_'],
      ['end', 'end_'],
    ],
  } satisfies TsgConfigScheme);
});
