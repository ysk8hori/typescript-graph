import { test, expect, describe } from 'vitest';
import { logAstNodes } from './tsc-demo-util';
import OperatorAnalyzer from './OperatorAnalyzer';
import ts from 'typescript';

type OperatorTest = {
  perspective: string;
  tests: [string, { operatorsTotal: number; operatorsUnique: number }][];
};

const hoge = `\
function Button({ flag }: { flag: boolean }) {
  return (
    <Container style={{ color: flag ? 'black' : 'white' }}>
      <button
        type="button"
        onClick={() => {
          flag ? console.log('ON->OFF') : console.log('OFF->ON');
        }}
      >
        <span className="icon">{flag ? '🌞' : '🌜'}</span>
        {flag ? 'ON' : 'OFF'}
      </button>
      <br />
    </Container>
  );
}\
`;
describe.each([
  {
    perspective: 'tsx',
    tests: [[hoge, { operatorsTotal: 5, operatorsUnique: 2 }]],
  },
] satisfies OperatorTest[])('$perspective', ({ perspective, tests }) => {
  test.each(tests)(`${perspective} %s`, (sourceCode, expected) => {
    logAstNodes(sourceCode);
    const source = ts.createSourceFile(
      'sample.tsx',
      sourceCode,
      ts.ScriptTarget.ESNext,
      // parent を使うことがあるので true
      true,
      ts.ScriptKind.TSX,
    );
    const analyzer = new OperatorAnalyzer(source);
    expect(analyzer.metrics).toEqual(expected);
  });
});
