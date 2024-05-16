import { createWriteStream } from 'fs';
import mermaidify from './mermaidify';
import { Graph, OptionValues } from './models';

type Options = Partial<OptionValues> & {
  rootDir: string;
  executedScript?: string;
};

export async function writeMarkdownFile(
  markdownTitle: string,
  graph: Graph,
  options: Options,
  couplingData: {
    afferentCoupling: number;
    efferentCoupling: number;
    path: string;
    name: string;
    isDirectory?: boolean | undefined;
  }[],
) {
  return new Promise((resolve, reject) => {
    const filename = markdownTitle.endsWith('.md')
      ? markdownTitle
      : `./${markdownTitle}.md`;
    const ws = createWriteStream(filename);
    ws.on('finish', resolve);
    ws.on('error', reject);

    ws.write('# TypeScript Graph\n');
    ws.write('\n');
    if (options.executedScript) {
      ws.write('```bash\n');
      ws.write(`${options.executedScript}\n`);
      ws.write('```\n');
    }
    ws.write('\n');
    ws.write('```mermaid\n');
    mermaidify(str => ws.write(str), graph, options);
    ws.write('```\n');

    if (couplingData.length !== 0) {
      ws.write('## Instability\n');
      ws.write('\n');
      ws.write(
        'module name | Afferent<br>coupling | Efferent<br>coupling | Instability\n',
      );
      ws.write('--|--|--|--\n');

      couplingData
        .filter(node => !node.isDirectory)
        // node_modules 配下のモジュールを除外する
        .filter(node => !node.path.includes('node_modules'))
        // json ファイルを除外する
        .filter(node => !node.path.endsWith('.json'))
        .map(node => {
          const totalCoupling = node.afferentCoupling + node.efferentCoupling;
          const instability =
            totalCoupling === 0 ? 0 : node.efferentCoupling / totalCoupling;
          return { ...node, instability };
        })
        .toSorted((a, b) => {
          return b.efferentCoupling - a.efferentCoupling;
        })

        .toSorted((a, b) => {
          const totalCouplingA = a.afferentCoupling + a.efferentCoupling;
          const totalCouplingB = b.afferentCoupling + b.efferentCoupling;
          return totalCouplingB - totalCouplingA;
        })
        .toSorted((a, b) => {
          return b.instability - a.instability;
        })
        .forEach(node => {
          const totalCoupling = node.afferentCoupling + node.efferentCoupling;
          const instability =
            totalCoupling === 0 ? 0 : node.efferentCoupling / totalCoupling;
          ws.write(
            `${node.name} | ${node.afferentCoupling} | ${node.efferentCoupling} | ${instability.toFixed(2)}\n`,
          );
        });
    }
    ws.end();

    console.log(filename);
  });
}
