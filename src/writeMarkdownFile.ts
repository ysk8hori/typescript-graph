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
    ws.end();

    console.log(filename);
  });
}
