# TypeScript Metrics

以下を参考に、 **Maintainability Index** （保守容易性指数）を計測する。

- [learn.microsoft.com コードメトリクス値](https://learn.microsoft.com/ja-jp/visualstudio/code-quality/code-metrics-values?view=vs-2022)
- [learn.microsoft.com 保守容易性指数の範囲と意味](https://learn.microsoft.com/ja-jp/visualstudio/code-quality/code-metrics-maintainability-index-range-and-meaning?view=vs-2022)
- [IBM Application Discovery and Delivery Intelligence for IBM Z 保守容易性指標レポート](https://www.ibm.com/docs/ja/addi/6.1.1?topic=reports-maintainability-index-report)

## Maintainability Index

> コードの保守の相対的な容易さを表す 0 から 100 の範囲の指数値を計算します。 値が大きいほど、保守容易性が向上します。 色分けされた評価を使用して、コード内の問題点をすばやく特定できます。 緑色の評価は 20 から 100 の範囲であり、コードの保守容易性が優れていることを示します。 黄色の評価は 10 から 19 の範囲であり、コードの保守容易性が中程度であることを示します。 赤色の評価は 0 から 9 の範囲であり、保守容易性が低いことを示します。

以下の計算式で求められる。

```
Maintainability Index = MAX(0,(171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code))*100 / 171)
```

## Halstead Volume

> Halstead ボリューム は次のように計算されます。
>
> ```
> V = N * log2(n)
> ```
>
> N はプログラムの長さを表し、次のように計算されます。
>
> ```
> N = N1 + N2
>
> N1 = 演算子の総数
> N2 = オペランドの総数
> ```
>
> n は語彙サイズを表し、次のように計算されます。
>
> ```
> n = n1 + n2
>
> n1 = 相異なる演算子の数
> n2 = 相異なるオペランドの数
> ```

### TypeScript Graph における Volume の計測 **Semantic Syntax Volume**

Halstead Volume はソースコード中のオペランドと演算子を用いて計測する。
しかし TypeScript Graph においてはオペランドと、演算子の代わりとして意味のある構文ノードを用いて Volume を計測することとする。
この計測方法を **Semantic Syntax Volume** と呼ぶこととする。

#### 意味のある構文ノード

意味のある構文ノードとは、人が TypeScript のコードを読む際に認識すべき意味を持つ構文のノードである。
具体的には TypeScript の AST において出現する、オペランドといくつかの構文を除く全ての構文である。
オペランドといくつかの構文についての詳細は `SemanticSyntaxVolume.ts` の `isOperand` 及び `isIgnoredSyntaxKind` を参照のこと。

#### Halstead Volume との差異

ここまでで述べたように計測の方法において Halstead Volume と Semantic Syntax Volume には差異がある。
しかし、それによって得られる数値の質としては、どちらも「人がプログラムから受け取る情報量を表している」という点において差異はないと考える。
