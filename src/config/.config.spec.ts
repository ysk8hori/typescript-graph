import { beforeAll, expect, test } from 'vitest';
import { config, setupConfig, TsgConfigScheme } from '.';

beforeAll(() => setupConfig('./src/config/rcSamples/valid.tsgrc.json'));

test('config', () => {
  expect(config()).toEqual({
    reservedMermaidKeywords: [
      ['/graph/', '/_graph_/'],
      ['style', 'style_'],
      ['graph', 'graph_'],
      ['class', 'class_'],
      ['end', 'end_'],
      ['foo', 'foo_'],
    ],
    exclude: ['node_modules'],
  } satisfies TsgConfigScheme);
});
