import neo4j from 'neo4j-driver';
import { Node, RelationOfDependsOn } from './models';

export async function neo4jfy(graph: {
  nodes: Node[];
  relations: RelationOfDependsOn[];
}) {
  const driver = neo4j.driver('neo4j://localhost:7687');
  const session = driver.session();
  try {
    await session.executeWrite(async tx => {
      const writeResult = graph.relations.map(rel =>
        tx.run(
          `
          MERGE (from:File {name:$fromName, path:$from})
          MERGE (to:File {name:$toName, path:$to})
          MERGE (from)-[:DEPENDS_ON {importedModule: $importedModule}]->(to)
          `,
          {
            fromName: rel.from.name,
            from: rel.from.path,
            toName: rel.to.name,
            to: rel.to.path,
            importedModule: rel.fullText,
          },
        ),
      );
      await Promise.all(writeResult);
    });
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function clearDatabase() {
  const driver = neo4j.driver('neo4j://localhost:7687');
  const session = driver.session();
  try {
    await session.executeWrite(tx => tx.run(`MATCH (m) DETACH DELETE m`));
  } finally {
    await session.close();
    await driver.close();
  }
}

/*
create constraint File_path
For (f:File) REQUIRE f.path IS UNIQUE
*/
