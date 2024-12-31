import { test, expect, describe } from 'vitest';
import AstLogger from './AstLogger';
import SemanticSyntaxVolume, {
  type SemanticSyntaxVolumeMetrics,
} from './SemanticSyntaxVolume';
import ts from 'typescript';
import AstTraverser from './AstTraverser';

type OperatorTest = {
  perspective: string;
  tests: [string, Omit<SemanticSyntaxVolumeMetrics, 'volume'>][];
};
describe.each([ts.ScriptKind.TS, ts.ScriptKind.TSX])(`%s`, scriptKind => {
  describe.each([
    {
      perspective: '型の定義',
      tests: [
        [
          'type A = {a:boolean, b:number, c:string};',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 6,
          },
        ],
        [
          '/*array*/ type A = string[];',
          {
            operandsTotal: 1,
            operandsUnique: 1,
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 3,
          },
        ],
        [
          '/*tuple*/ type A = [string, number];',
          {
            operandsTotal: 1,
            operandsUnique: 1,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 4,
          },
        ],
        [
          '/*enum*/ enum Color {Red = 1,Green,Blue,}let c: Color = Color.Green;',
          {
            operandsTotal: 9,
            operandsUnique: 6,
            semanticSyntaxTotal: 7,
            semanticSyntaxUnique: 5,
          },
        ],
        [
          '/*any and unknown*/ try{throw 1;}catch(e){(e as unknown as any).toString();}',
          {
            operandsTotal: 4,
            operandsUnique: 3,
            semanticSyntaxTotal: 12,
            semanticSyntaxUnique: 10,
          },
        ],
        [
          'type A = {a:null, b:undefined};',
          {
            operandsTotal: 3,
            operandsUnique: 3,
            semanticSyntaxTotal: 7,
            semanticSyntaxUnique: 6,
          },
        ],
        [
          'function e(m:string):never{throw new Error(m);}',
          {
            operandsTotal: 4,
            operandsUnique: 3,
            semanticSyntaxTotal: 7,
            semanticSyntaxUnique: 7,
          },
        ],
        [
          'function e(m:string){throw new Error(m);}',
          {
            operandsTotal: 4,
            operandsUnique: 3,
            semanticSyntaxTotal: 6,
            semanticSyntaxUnique: 6,
          },
        ],
        [
          'type A = B & C | B & D',
          {
            operandsTotal: 5,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
        [
          'type TodoPreview = Pick<Todo, "title" | "completed">;',
          {
            operandsTotal: 5,
            operandsUnique: 5,
            semanticSyntaxTotal: 6,
            semanticSyntaxUnique: 4,
          },
        ],
        [
          'type TodoPreview = {title:string,completed:boolean};',
          {
            operandsTotal: 3,
            operandsUnique: 3,
            semanticSyntaxTotal: 6,
            semanticSyntaxUnique: 5,
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
        const volume = new SemanticSyntaxVolume();
        const astTraverser = new AstTraverser(source, [astLogger, volume]);
        astTraverser.traverse();
        console.log(astLogger.log);
        console.log(volume.volume);
        expect(volume.metrics).toEqual(expect.objectContaining(expected));
      });
    },
  );
});
