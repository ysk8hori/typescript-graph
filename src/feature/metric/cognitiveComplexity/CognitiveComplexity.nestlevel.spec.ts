import { test, expect } from 'vitest';
import AstLogger from '../../util/AstLogger';
import * as ts from 'typescript';
import AstTraverser from '../../util/AstTraverser';
import { createCognitiveComplexityAnalyzer } from '../cognitiveComplexity';

type OperatorTest = {
  perspective: string;
  tests: [string, number];
};

test.each([
  {
    perspective: 'トップレベルの関数定義はネストレベルをインクリメントしない',
    tests: [`function x() { if(z) {} }`, 1],
  },
  {
    perspective: '関数定義内の関数定義はネストレベルをインクリメントする',
    tests: [`function x() { if(true) {} function y() { if(true) {}} }`, 3],
  },
  {
    perspective:
      'トップレベルのアロー関数定義はネストレベルをインクリメントしない',
    tests: [`const x = () => { if(z) {} }`, 1],
  },
  {
    perspective: '関数定義内のアロー関数定義はネストレベルをインクリメントする',
    tests: [
      `const x = () => { if(true) {} const y = () => { if(true) {}} }`,
      3,
    ],
  },
  {
    perspective:
      '関数定義内のアロー関数定義はネストレベルをインクリメントする2',
    tests: [`const x = ()=>()=>()=>()=>{if(true){}}`, 4],
  },
  {
    perspective:
      'トップレベルの無名関数定義はネストレベルをインクリメントしない',
    tests: [`(function() { if(z) {} })()`, 1],
  },
  {
    perspective: '関数定義内の無名関数定義はネストレベルをインクリメントする',
    tests: [`(function() { if(true) {} (function () { if(true) {}})() })()`, 3],
  },
  {
    perspective:
      'トップレベルのジェネレータ関数はネストレベルをインクリメントしない',
    tests: [`function* generator() { if(z) {} }`, 1],
  },
  {
    perspective:
      'トップレベルではないジェネレータ関数はネストレベルをインクリメントする',
    tests: [`function a() {function* generator() { if(z) {} }}`, 2],
  },
  {
    perspective: 'トップレベルの非同期関数はネストレベルをインクリメントしない',
    tests: [`async function a() { if(z) {} }`, 1],
  },
  {
    perspective:
      'トップレベルではない非同期関数はネストレベルをインクリメントする',
    tests: [`async function a() {async function b() { if(z) {} }}`, 2],
  },
  {
    perspective:
      'トップレベルの非同期ジェネレータはネストレベルをインクリメントしない',
    tests: [`async function* a() { if(z) {} }`, 1],
  },
  {
    perspective:
      'トップレベルではない非同期ジェネレータはネストレベルをインクリメントする',
    tests: [`async function* a() {async function* b() { if(z) {} }}`, 2],
  },
  {
    perspective:
      'トップレベルのオブジェクトはネストレベルをインクリメントしない、オブジェクトのプロパティに定義された関数はネストレベルをインクリメントしない',
    tests: [
      `
const obj = {
  x: function () {
    if (true) {
    }
  },
  y() {
    if (true) {
    }
  },
  z: () => {
    if (true) {
    }
  },
};
      `,
      3,
    ],
  },
  {
    perspective:
      'トップレベルではないオブジェクトはネストレベルをインクリメントする、オブジェクトのプロパティに定義された関数はネストレベルをインクリメントしない',
    tests: [
      `
const obj = {
  obj2: {
    x: function () {
      if (true) {
      }
    },
    y() {
      if (true) {
      }
    },
    z: () => {
      if (true) {
      }
    },
  }
};
      `,
      6,
    ],
  },
  {
    perspective:
      'トップレベルのクラスのメソッド定義はネストレベルをインクリメントしない',
    tests: [
      `
class A {
  method() {
    if (true) {}
  }
}
      `,
      1,
    ],
  },
  {
    perspective:
      'トップレベルのクラスの#メソッド定義はネストレベルをインクリメントしない',
    tests: [
      `
class A {
  #method() {
    if (true) {}
  }
}
      `,
      1,
    ],
  },
  {
    perspective:
      'トップレベルのクラスの private メソッド定義はネストレベルをインクリメントしない',
    tests: [
      `
class A {
  private method() {
    if (true) {}
  }
}
      `,
      1,
    ],
  },
  {
    perspective:
      'トップレベルのクラスの public メソッド定義はネストレベルをインクリメントしない',
    tests: [
      `
class A {
  public method() {
    if (true) {}
  }
}
      `,
      1,
    ],
  },
  {
    perspective:
      'トップレベルのクラスの getter/setter 定義はネストレベルをインクリメントしない',
    tests: [
      `
class A {
  get a() {
    if (true) {}
    return false
  }
  set a(b: boolean) {
    if (b) {}
  }
}
      `,
      2,
    ],
  },
  {
    perspective:
      'トップレベルではないクラスのメソッド定義はネストレベルをインクリメントする',
    tests: [
      `
class A {
  method() {
    class B {
      method() {
        if (true) {}
      }
    }
  }
}
      `,
      2,
    ],
  },
  {
    perspective:
      'トップレベルではないクラスの getter/setter 定義はネストレベルをインクリメントする',
    tests: [
      `
class A {
  method() {
    class B {
      get a() {
        if (true) {}
        return false
      }
      set a(b: boolean) {
        if (b) {}
      }
    }
  }
}
      `,
      4,
    ],
  },
  {
    perspective:
      'トップレベルのクラスの constructor 定義はネストレベルをインクリメントしない',
    tests: [
      `
class A {
  constructor() {
    if (true) {}
  }
}
      `,
      1,
    ],
  },
  {
    perspective:
      'トップレベルではないクラスの constructor 定義はネストレベルをインクリメントする',
    tests: [
      `
class A {
  method() {
    class B {
      constructor() {
        if (true) {}
      }
    }
  }
}
      `,
      2,
    ],
  },
  {
    perspective:
      'オブジェクトのいかなるプロパティもネストレベルをインクリメントしない',
    tests: [
      `
      const obj2 = {
        set property2(value: boolean) {
          if (true) {
          }
        },
        property3(b: boolean) {
          if (true) {
          }
        },
        *generator1(b: boolean) {
          if (true) {
          }
        },
        async property4(b: boolean) {
          if (true) {
          }
        },
        async *generator2(b: boolean) {
          if (true) {
          }
        },
        // 算出されたキーも使用可能:
        get [property1]() {
          if (true) {
          }
          return true;
        },
        set [property1](value: boolean) {
          if (true) {
          }
        },
        [property2](b: boolean) {
          if (true) {
          }
        },
        *[generator1](b: boolean) {
          if (true) {
          }
        },
        async [property3](b: boolean) {
          if (true) {
          }
        },
        async *[generator2](b: boolean) {
          if (true) {
          }
        },
      };
      `,
      11,
    ],
  },
] satisfies OperatorTest[])(
  `$perspective`,
  ({ tests: [sourceCode, expected] }) => {
    const source = ts.createSourceFile(
      'sample.tsx',
      sourceCode,
      ts.ScriptTarget.ESNext,
      // parent を使うことがあるので true
      true,
      ts.ScriptKind.TS,
    );
    const astLogger = new AstLogger();
    const analyzer = createCognitiveComplexityAnalyzer('sample.tsx');
    const astTraverser = new AstTraverser(source, [astLogger, analyzer]);
    astTraverser.traverse();
    console.log(astLogger.log);
    expect(analyzer.metrics.score).toEqual(expected);
  },
);
