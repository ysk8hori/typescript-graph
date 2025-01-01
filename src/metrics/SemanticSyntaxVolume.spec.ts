import { test, expect, describe } from 'vitest';
import AstLogger from './AstLogger';
import { type SemanticSyntaxVolumeMetrics } from './SemanticSyntaxVolume';
import ts from 'typescript';
import AstTraverser from './AstTraverser';
import SemanticSyntaxVolumeForSourceCode from './SemanticSyntaxVolumeForSourceCode';

type OperatorTest = {
  perspective: string;
  tests: [string, Omit<SemanticSyntaxVolumeMetrics['score'], 'volume'>][];
};
describe.each([ts.ScriptKind.TS, ts.ScriptKind.TSX])(`%s`, scriptKind => {
  describe.each([
    {
      perspective: '? の区別',
      tests: [
        [
          'a?b:c?.d(e??f)',
          {
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 8,
            operandsTotal: 6,
            operandsUnique: 6,
          },
        ],
      ],
    },
    {
      perspective: 'wiki の例',
      tests: [
        [
          "function main() {let a, b, c, avg;console.log('%d %d %d', a, b, c);avg = (a + b + c) / 3;console.log('avg = %d', avg);}",
          {
            semanticSyntaxTotal: 16,
            semanticSyntaxUnique: 10,
            operandsTotal: 20,
            operandsUnique: 10,
          },
        ],
      ],
    },
    {
      perspective: '加算 算術演算子 PlusToken',
      tests: [
        [
          'x + y',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
        [
          'const x = x + y + z',
          {
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 3,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: '減算 算術演算子 MinusToken',
      tests: [
        [
          'x - y',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
        [
          'const x = x - y - z',
          {
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 3,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: '乗算 算術演算子 AsteriskToken',
      tests: [
        [
          'x * y',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
        [
          'const x = x * y * z',
          {
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 3,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: '除算 算術演算子 SlashToken',
      tests: [
        [
          'x / y',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
        [
          'const x = x / y / z',
          {
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 3,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: '剰余 算術演算子 PercentToken',
      tests: [
        [
          'x % y',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
        [
          'const x = x % y % z',
          {
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 3,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: 'オプショナルチェーン演算子 QuestionDotToken',
      tests: [
        [
          'const x = x?.y?.z',
          {
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 3,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: 'new 演算子 NewExpression',
      tests: [
        [
          'const x = new X(new Y());',
          {
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 2,
            operandsTotal: 3,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: 'super キーワード SuperKeyword',
      tests: [
        [
          'class A extends B { a() {super.b()} }',
          {
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 8,
            operandsTotal: 4,
            operandsUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'import() 構文 ImportKeyword',
      tests: [
        [
          'const a = import("a");',
          {
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 3,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'import 文のカウント ImportDeclaration',
      tests: [
        [
          'import hoge from "hoge";',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
        [
          'import "hoge";',
          {
            semanticSyntaxTotal: 1,
            semanticSyntaxUnique: 1,
            operandsTotal: 1,
            operandsUnique: 1,
          },
        ],
        [
          'import hoge from "hoge";import "hoge";',
          {
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 2,
            operandsTotal: 3,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective:
        '前置型、後置方、インクリメント、デクリメント、それぞれの演算子 (Prefix|Postfix)UnaryExpression',
      tests: [
        [
          'a++;',
          {
            semanticSyntaxTotal: 1,
            semanticSyntaxUnique: 1,
            operandsTotal: 1,
            operandsUnique: 1,
          },
        ],
        [
          'a--;',
          {
            semanticSyntaxTotal: 1,
            semanticSyntaxUnique: 1,
            operandsTotal: 1,
            operandsUnique: 1,
          },
        ],
        [
          '++a;',
          {
            semanticSyntaxTotal: 1,
            semanticSyntaxUnique: 1,
            operandsTotal: 1,
            operandsUnique: 1,
          },
        ],
        [
          '--a;',
          {
            semanticSyntaxTotal: 1,
            semanticSyntaxUnique: 1,
            operandsTotal: 1,
            operandsUnique: 1,
          },
        ],
        [
          'a++;a--;++a;--a;b++;b--;++b;--b;',
          {
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
            operandsTotal: 8,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'delete 演算子 DeleteExpression',
      tests: [
        [
          'delete Employee.firstname;delete Employee.lastname;',
          {
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: 'void 単項演算子 VoidExpression',
      tests: [
        [
          'void Employee.firstname;void Employee.lastname;',
          {
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: 'typeof 単項演算子 TypeOfExpression',
      tests: [
        [
          'typeof Employee.firstname;typeof Employee.lastname;',
          {
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
            operandsTotal: 4,
            operandsUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: '単項正値演算子 単項負値演算子 PrefixUnaryExpression',
      tests: [
        [
          '+"";+true;-"";-true;',
          {
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
            operandsTotal: 4,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'ビット否定 単項演算子 PrefixUnaryExpression',
      tests: [
        [
          '~5;~-3',
          {
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '論理否定 単項演算子 PrefixUnaryExpression',
      tests: [
        [
          '!true;!false',
          {
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 1,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'await 単項演算子 AwaitExpression',
      tests: [
        [
          'await foo(); await bar;',
          {
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 2,
            operandsTotal: 2,
            operandsUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '小なり 関係演算子 FirstBinaryOperator',
      tests: [
        [
          '3n < 5; 3n < 5',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '小なりイコール 関係演算子 LessThanEqualsToken',
      tests: [
        [
          '3n <= 5; 3n <= 5',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '大なり 関係演算子 GreaterThanToken',
      tests: [
        [
          '3n > 5; 3n > 5',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '大なりイコール 関係演算子 GreaterThanEqualsToken',
      tests: [
        [
          '3n >= 5; 3n >= 5',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'instanceof 関係演算子 InstanceOfKeyword',
      tests: [
        [
          'car instanceof Car; auto instanceof Car',
          {
            operandsTotal: 4,
            operandsUnique: 3,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'in 関係演算子 InKeyword',
      tests: [
        [
          '"make" in car; "make" in car;',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '等価 等値演算子 EqualsEqualsToken',
      tests: [
        [
          '"1" == 1; 0 == false;',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '不等価 等値演算子 ExclamationEqualsToken',
      tests: [
        [
          '"1" != 1; 0 != false;',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '厳密等価 等値演算子 EqualsEqualsEqualsToken',
      tests: [
        [
          '"1" === 1; 0 === false;',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '厳密不等価 等値演算子 ExclamationEqualsEqualsToken',
      tests: [
        [
          '"1" !== 1; 0 !== false;',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '左シフト ビットシフト演算子 LessThanLessThanToken',
      tests: [
        [
          'a << 2; a << 2',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective:
        '符号維持右シフト ビットシフト演算子 GreaterThanGreaterThanToken',
      tests: [
        [
          'a >> 2; a >> 2',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective:
        '符号なし右シフト ビットシフト演算子 GreaterThanGreaterThanGreaterThanToken',
      tests: [
        [
          'a >>> 2; a >>> 2',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'ビット論理積 バイナリービット演算子 AmpersandToken',
      tests: [
        [
          '3 & 5; a & b',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'ビット論理和 バイナリービット演算子 BarToken',
      tests: [
        [
          '3 | 5; a | b',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'ビット排他的論理和xor バイナリービット演算子 CaretToken',
      tests: [
        [
          '3 ^ 5; a ^ b',
          {
            operandsTotal: 4,
            operandsUnique: 4,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '論理積 バイナリー論理演算子 AmpersandAmpersandToken',
      tests: [
        [
          'true && true; true && false',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '論理和 バイナリー論理演算子 BarBarToken',
      tests: [
        [
          'true || true; true || false',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'Null 合体演算子 バイナリー論理演算子 QuestionQuestionToken',
      tests: [
        [
          'true ?? true; true ?? false',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 4,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: '条件（三項）演算子 ConditionalExpression',
      tests: [
        [
          'true ? true:false; a ? 1 : 2',
          {
            operandsTotal: 6,
            operandsUnique: 5,
            semanticSyntaxTotal: 6,
            semanticSyntaxUnique: 3,
          },
        ],
      ],
    },
    {
      perspective: '代入演算子 FirstAssignment',
      tests: [
        [
          'a=1;a=2;a==2;a===2;',
          {
            operandsTotal: 8,
            operandsUnique: 3,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '乗算代入 代入演算子 AsteriskEqualsToken',
      tests: [
        [
          'a*=1;a*=2;a=3;a*3;',
          {
            operandsTotal: 8,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '除算代入 代入演算子 SlashEqualsToken',
      tests: [
        [
          'a/=1;a/=2;a=3;a/3;',
          {
            operandsTotal: 8,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '剰余代入 代入演算子 PercentEqualsToken',
      tests: [
        [
          'a%=1;a%=2;a=3;a%3;',
          {
            operandsTotal: 8,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '加算代入 代入演算子 FirstCompoundAssignment',
      tests: [
        [
          'a+=1;a+=2;a=3;a+3;',
          {
            operandsTotal: 8,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '減算代入 代入演算子 MinusEqualsToken',
      tests: [
        [
          'a-=1;a-=2;a=3;a-3;',
          {
            operandsTotal: 8,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '左シフト代入 代入演算子 LessThanLessThanEqualsToken',
      tests: [
        [
          'a<<=1;a<<=2;a=3;a<<4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '右シフト代入 代入演算子 GreaterThanGreaterThanEqualsToken',
      tests: [
        [
          'a>>=1;a>>=2;a=3;a>>4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective:
        '符号なし右シフト代入 代入演算子 GreaterThanGreaterThanGreaterThanEqualsToken',
      tests: [
        [
          'a>>>=1;a>>>=2;a=3;a>>>4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'ビット論理積代入 代入演算子 AmpersandEqualsToken',
      tests: [
        [
          'a&=1;a&=2;a=3;a&4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'ビット排他的論理和代入 代入演算子 LastBinaryOperator',
      tests: [
        [
          'a^=1;a^=2;a=3;a^4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'ビット論理和代入 代入演算子 BarEqualsToken',
      tests: [
        [
          'a|=1;a|=2;a=3;a|4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'べき乗代入 代入演算子 AsteriskAsteriskEqualsToken',
      tests: [
        [
          'a**=1;a**=2;a=3;a**4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '論理積代入 代入演算子 AmpersandAmpersandEqualsToken',
      tests: [
        [
          'a&&=1;a&&=2;a=3;a&&4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '論理和代入 代入演算子 BarBarEqualsToken',
      tests: [
        [
          'a||=1;a||=2;a=3;a||4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'Null 合体代入 代入演算子 QuestionQuestionEqualsToken',
      tests: [
        [
          'a??=1;a??=2;a=3;a??4',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: '分割代入 代入演算子 DotDotDotToken',
      tests: [
        [
          'const [a,b]=[10,20];let [c,d]=[10,20];[c,d]=[10,20];',
          {
            operandsTotal: 12,
            operandsUnique: 6,
            semanticSyntaxTotal: 14,
            semanticSyntaxUnique: 7,
          },
        ],
        [
          // 分割代入は DotDotDotToken だが SpreadElement と同じ演算子としてカウントする
          'let [a,...rest]=[1,2,3];[a,...rest]=[3,4,5];',
          {
            operandsTotal: 10,
            operandsUnique: 7,
            semanticSyntaxTotal: 11,
            semanticSyntaxUnique: 7,
          },
        ],
      ],
    },
    {
      perspective: 'スプレッド構文 SpreadElement',
      tests: [
        [
          'const a=[10,20]; const b = [0, ...a];console.log(...b);',
          {
            operandsTotal: 9,
            operandsUnique: 7,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 5,
          },
        ],
        [
          '[a,...rest]=[3,4,5];',
          {
            operandsTotal: 5,
            operandsUnique: 5,
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 4,
          },
        ],
      ],
    },
    {
      perspective: 'yield 演算子 YieldExpression',
      tests: [
        [
          'yield 1; yield 2;',
          {
            operandsTotal: 2,
            operandsUnique: 2,
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 1,
          },
        ],
      ],
    },
    {
      // yield と yield* は同じ演算子としてカウントする
      perspective: 'yield* 演算子 YieldExpression',
      tests: [
        [
          // 乗算、ジェネレータ関数、yield* それぞれの * の見分けがつきにくいのでデグレ注意
          // ジェネレータ関数、yield* はアスタリスクをカウントしないようにしている
          'function* func1(){yield 42;}function* func2(){2*3;yield* 4*func1();}',
          {
            operandsTotal: 7,
            operandsUnique: 6,
            semanticSyntaxTotal: 11,
            semanticSyntaxUnique: 6,
          },
        ],
      ],
    },
    {
      perspective: 'カンマ演算子 CommaToken',
      tests: [
        [
          'let x=1;x=(x++,x);([1,2],{a:1,b:2},x)',
          {
            operandsTotal: 12,
            operandsUnique: 5,
            semanticSyntaxTotal: 16,
            semanticSyntaxUnique: 9,
          },
        ],
      ],
    },
    {
      // return,break,continue,throw,if...else,switch,try...catch
      perspective: '制御構文',
      tests: [
        [
          // if...else を使用
          'if(x){1;}else if(y){2;}else{3;}',
          {
            operandsTotal: 5,
            operandsUnique: 5,
            semanticSyntaxTotal: 7,
            semanticSyntaxUnique: 3,
          },
        ],
        [
          // switch を使用
          'switch(x){case 1:1;break;case 2:2;break;default:3;}',
          {
            operandsTotal: 6,
            operandsUnique: 4,
            semanticSyntaxTotal: 7,
            semanticSyntaxUnique: 5,
          },
        ],
        [
          // for ループと continue を使用
          'for(let i=0;i<5;i++){if(i===3){continue;}console.log(i);}',
          {
            operandsTotal: 10,
            operandsUnique: 6,
            semanticSyntaxTotal: 13,
            semanticSyntaxUnique: 11,
          },
        ],
        [
          // for...in ループを使用
          'for(const prop in obj){console.log(`${prop}:${obj[prop]}`);}',
          {
            operandsTotal: 10,
            operandsUnique: 7,
            semanticSyntaxTotal: 9,
            semanticSyntaxUnique: 8,
          },
        ],
        [
          // for...of ループを使用
          'for(const element of array){console.log(element);}',
          {
            operandsTotal: 5,
            operandsUnique: 4,
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 5,
          },
        ],
        [
          // while ループを使用
          'let i=0;while(i<5){console.log(i);i++;}',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 8,
          },
        ],
        [
          // do...while ループを使用
          'let i=0;do{console.log(i);i++;}while(i<5);',
          {
            operandsTotal: 8,
            operandsUnique: 5,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 8,
          },
        ],
        [
          // for await...of ループを使用
          'for await(const element of asyncIterable){console.log(element);}',
          {
            operandsTotal: 5,
            operandsUnique: 4,
            semanticSyntaxTotal: 6,
            semanticSyntaxUnique: 6,
          },
        ],
        [
          // throw を使用
          'try{throw new Error("");}catch(e){e;}finally{1;}',
          {
            operandsTotal: 5,
            operandsUnique: 4,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 6,
          },
        ],
        [
          'function handleNumbers(input:number):string{let result:string="";if(input<0){result="Negative number";}else if(input===0){result="Zero";}else{result="Positive number";}switch(input){case 1:console.log("Input is one");break;case 2:console.log("Input is two");break;default:console.log("Input is neither one nor two");}for(let i=0;i<5;i++){if(i===input){continue;}console.log(`Index: ${i}`);}try{if(input<0){throw new Error("Negative numbers are not allowed here!");}}catch(error){if(error instanceof Error){console.error("Caught an error:",error.message);return"Error occurred";}}return result;}',
          {
            operandsTotal: 52,
            operandsUnique: 25,
            semanticSyntaxTotal: 71,
            semanticSyntaxUnique: 30,
          },
        ],
        [
          // ラベル を使用
          'outer:for(let i=0;i<5;i++){inner:for(let j=0;j<5;j++){if(i===j){if(i===4){break outer;}else{continue outer;}}}}',
          {
            operandsTotal: 18,
            operandsUnique: 7,
            semanticSyntaxTotal: 26,
            semanticSyntaxUnique: 12,
          },
        ],
      ],
    },
    {
      perspective: 'テンプレートリテラル',
      tests: [
        [
          '`1`',
          {
            operandsTotal: 1,
            operandsUnique: 1,
            semanticSyntaxTotal: 0,
            semanticSyntaxUnique: 0,
          },
        ],
        [
          'a`1${2+3}4${5+6}7`',
          {
            operandsTotal: 8,
            operandsUnique: 8,
            semanticSyntaxTotal: 8,
            semanticSyntaxUnique: 5,
          },
        ],
        [
          '`${1}${2}`',
          {
            operandsTotal: 5,
            operandsUnique: 5,
            semanticSyntaxTotal: 3,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'BigIntリテラル',
      tests: [
        [
          '1n;BigInt("1");BigInt(1)',
          {
            operandsTotal: 5,
            operandsUnique: 4,
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 1,
          },
        ],
        [
          'BigInt("1")',
          {
            operandsTotal: 2,
            operandsUnique: 2,
            semanticSyntaxTotal: 1,
            semanticSyntaxUnique: 1,
          },
        ],
      ],
    },
    {
      perspective: 'RegularExpressionLiteral',
      tests: [
        [
          '/[a-z]/g;/[a-z]/;/[a-z]/;/[a-z]/g',
          {
            operandsTotal: 4,
            operandsUnique: 2,
            semanticSyntaxTotal: 0,
            semanticSyntaxUnique: 0,
          },
        ],
        [
          '/[a-z]/g.test("a");',
          {
            operandsTotal: 3,
            operandsUnique: 3,
            semanticSyntaxTotal: 2,
            semanticSyntaxUnique: 2,
          },
        ],
      ],
    },
    {
      perspective: 'コメント',
      tests: [
        [
          '// comment\ncomment',
          {
            operandsTotal: 1,
            operandsUnique: 1,
            semanticSyntaxTotal: 0,
            semanticSyntaxUnique: 0,
          },
        ],
        [
          '/* comment */comment',
          {
            operandsTotal: 1,
            operandsUnique: 1,
            semanticSyntaxTotal: 0,
            semanticSyntaxUnique: 0,
          },
        ],
      ],
    },
    {
      perspective: 'class',
      tests: [
        [
          `
class A {
  method() {
    if (true) {}
  }
}`,
          {
            operandsTotal: 3,
            operandsUnique: 3,
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 4,
          },
        ],
        [
          `
class A {
  #method() {
    if (true) {}
  }
}`,
          {
            operandsTotal: 3,
            operandsUnique: 3,
            semanticSyntaxTotal: 5,
            semanticSyntaxUnique: 4,
          },
        ],
        [
          `
class A {
  private method() {
    if (true) {}
  }
}`,
          {
            operandsTotal: 3,
            operandsUnique: 3,
            semanticSyntaxTotal: 6,
            semanticSyntaxUnique: 5,
          },
        ],
        [
          `
class A {
  public method() {
    if (true) {}
  }
}`,
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
        const volume = new SemanticSyntaxVolumeForSourceCode('sample.tsx');
        const astTraverser = new AstTraverser(source, [astLogger, volume]);
        astTraverser.traverse();
        console.log(astLogger.log);
        console.log(volume.volume);
        expect(volume.metrics.score).toEqual(expect.objectContaining(expected));
      });
    },
  );
});
