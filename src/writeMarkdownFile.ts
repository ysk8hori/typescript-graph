import { createWriteStream } from 'fs';
import mermaidify from './mermaidify';
import { Graph, OptionValues, measureInstability } from './models';

type Options = Partial<OptionValues> & {
  rootDir: string;
  executedScript?: string;
};

export async function writeMarkdownFile(
  markdownTitle: string,
  graph: Graph,
  options: Options,
  couplingData: ReturnType<typeof measureInstability>,
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

      couplingData.forEach(node => {
        ws.write(
          `${node.path} | ${node.afferentCoupling} | ${node.efferentCoupling} | ${node.instability.toFixed(2)}\n`,
        );
      });
    }
    ws.end();

    console.log(filename);
  });
}
