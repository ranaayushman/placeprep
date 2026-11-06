import postgres from "postgres";

export const TEST_DB = "placeprep_test";

// Fresh local test database for every run (dropped before any test imports the DB client).
export default async function setup() {
  const admin = postgres(process.env.TEST_ADMIN_URL ?? "postgres://localhost:5432/postgres", { onnotice: () => {} });
  await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();
}
