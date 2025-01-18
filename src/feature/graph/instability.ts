import { Graph, Node } from './models';

export type NodeWithInstability = Node & {
  afferentCoupling: number;
  efferentCoupling: number;
  instability: number;
};

export function measureInstability(graph: Graph): NodeWithInstability[] {
  const couplingData = graph.nodes
    .filter(node => !node.isDirectory)
    .filter(
      node => !/node_modules|\.{test|spec|stories}\.|.json$/.test(node.path),
    )
    .map(node => {
      // このノードに依存しているノードの数
      const afferentCoupling = graph.relations.filter(
        r => r.kind === 'depends_on' && r.to.path === node.path,
      ).length;
      // このノードが依存しているノードの数
      const efferentCoupling = graph.relations.filter(
        r => r.kind === 'depends_on' && r.from.path === node.path,
      ).length;
      return { ...node, afferentCoupling, efferentCoupling };
    })
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
    });
  return couplingData;
}

export function writeCouplingData(
  write: (str: string) => void,
  couplingData: ReturnType<typeof measureInstability>,
) {
  if (couplingData.length === 0) return;
  write('## Instability\n');
  write('\n');
  write(
    'module name | Afferent<br>coupling | Efferent<br>coupling | Instability\n',
  );
  write('--|--|--|--\n');

  couplingData.forEach(node => {
    write(
      `${node.path} | ${node.afferentCoupling} | ${node.efferentCoupling} | ${node.instability.toFixed(2)}\n`,
    );
  });
  write('\n');
}
