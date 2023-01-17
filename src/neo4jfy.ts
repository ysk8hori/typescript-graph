import neo4j, { session } from 'neo4j-driver';

console.log('start');

const driver = neo4j.driver('neo4j://localhost:7687');
console.log('driver', driver);

async function connect() {
  await driver.verifyConnectivity();
  console.log('verified');

  const session = driver.session();
  try {
    const res = await session.run(
      `
        MATCH (p:Person)-[:DIRECTED]->(:Movie {title: $title})
        RETURN p.name
      `,
      { title: 'The Matrix' },
      { timeout: 3000 },
    );
    console.log(res);
    const people = res.records.map(record => record.get('p'));
  } finally {
    session.close();
  }
}
connect().finally(() => driver.close());
