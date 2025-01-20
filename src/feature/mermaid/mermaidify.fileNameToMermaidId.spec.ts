import { beforeAll, expect, test } from 'vitest';
import { setupConfig } from '../../setting/config';
import { fileNameToMermaidId } from './mermaidify';

beforeAll(() => setupConfig());

test.each([
  [
    'dummy_project/src/otherFiles/children/:id.json',
    'dummy//project/src/otherFiles/children/:id.json',
  ],
  [
    'dummy_project/src/otherFiles/children/{id}.json',
    'dummy//project/src/otherFiles/children///id//.json',
  ],
  ['/graph/style/graph/class/end', '/_graph__/style_/_graph__/class_/end_'],
])('fileNameToMermaidId', (fileName, expected) => {
  expect(fileNameToMermaidId(fileName)).toEqual(expected);
});
