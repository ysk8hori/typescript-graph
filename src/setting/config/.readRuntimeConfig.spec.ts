import path from 'path';
import { expect, test } from 'vitest';
import { readRuntimeConfig } from '.';

test('ファイルが存在しない場合は{}を返す', () => {
  expect(
    readRuntimeConfig(path.join(process.cwd(), './src/conf/dummy')),
  ).toEqual({});
});
test('JSONでない場合は{}を返す', () => {
  expect(
    readRuntimeConfig(
      path.join(
        process.cwd(),
        './src/setting/config/rcSamples/notJson.tsgrc.text',
      ),
    ),
  ).toEqual({});
});
test('不正なスキーマの場合は{}を返す', () => {
  expect(
    readRuntimeConfig(
      path.join(
        process.cwd(),
        './src/setting/config/rcSamples/invalid.tsgrc.json',
      ),
    ),
  ).toEqual({});
});
test('正しいスキーマの場合はそれを返す', () => {
  expect(
    readRuntimeConfig(
      path.join(
        process.cwd(),
        './src/setting/config/rcSamples/valid.tsgrc.json',
      ),
    ),
  ).toEqual({
    reservedMermaidKeywords: [['foo', 'foo_']],
    exclude: ['node_modules'],
  });
});
