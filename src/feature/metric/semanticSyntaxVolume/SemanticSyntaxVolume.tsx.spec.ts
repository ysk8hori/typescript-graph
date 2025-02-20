import { test, expect, describe } from 'vitest';
import ts from 'typescript';
import AstLogger from '../../util/AstLogger';
import AstTraverser from '../../util/AstTraverser';
import { type SemanticSyntaxVolumeMetrics } from './SemanticSyntaxVolumeAnalyzer';
import { createSemanticSyntaxVolumeAnalyzer } from '.';

const button = `\
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
interface OperatorTest {
  perspective: string;
  tests: [
    string,
    Omit<SemanticSyntaxVolumeMetrics['score'], 'volume' | 'lines'>,
  ][];
}
describe.each([ts.ScriptKind.TSX])(`%s`, scriptKind => {
  describe.each([
    {
      perspective: '大きいコンポーネント',
      tests: [
        [
          button,
          {
            operandsTotal: 39,
            operandsUnique: 24,
            semanticSyntaxTotal: 49,
            semanticSyntaxUnique: 25,
          },
        ],
      ],
    },
    {
      perspective: '小さいコンポーネント',
      tests: [
        [
          '<A b="1" c />',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 2,
          },
        ],
        [
          '<A b="1" c>2</A>',
          {
            operandsTotal: 6,
            operandsUnique: 5,
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 4,
          },
        ],
        [
          'function A() { return <><span>hello</span><span>hi</span></>; }',
          {
            operandsTotal: 7,
            operandsUnique: 4,
            semanticSyntaxTotal: 12,
            semanticSyntaxUnique: 9,
          },
        ],
        [
          'const A = () => <><span>hello</span><span>hi</span></>',
          {
            operandsTotal: 7,
            operandsUnique: 4,
            semanticSyntaxTotal: 12,
            semanticSyntaxUnique: 9,
          },
        ],
        [
          'const A = () => <span a={()=> <B b={"hello"} />} />',
          {
            operandsTotal: 6,
            operandsUnique: 6,
            semanticSyntaxTotal: 11,
            semanticSyntaxUnique: 6,
          },
        ],
        [
          'const A = (a:boolean) => <span>{a&&<br/>}</span>',
          {
            operandsTotal: 6,
            operandsUnique: 4,
            semanticSyntaxTotal: 12,
            semanticSyntaxUnique: 12,
          },
        ],
      ],
    },
  ] satisfies OperatorTest[])(
    `${ts.ScriptKind[scriptKind]} $perspective`,
    ({ perspective, tests }) => {
      test.each(tests)(`${perspective} %s`, (sourceCode, expected) => {
        const source = ts.createSourceFile(
          'sample.tsx',
          sourceCode,
          ts.ScriptTarget.ESNext,
          // parent を使うことがあるので true
          true,
          scriptKind,
        );
        const astLogger = new AstLogger();
        const volume = createSemanticSyntaxVolumeAnalyzer('sample.tsx');
        const astTraverser = new AstTraverser(source, [astLogger, volume]);
        astTraverser.traverse();
        console.log(astLogger.log);
        console.log(volume.volume);
        expect(volume.metrics.score).toEqual(expect.objectContaining(expected));
      });
    },
  );
});
