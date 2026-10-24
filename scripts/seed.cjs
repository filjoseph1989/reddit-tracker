/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
require("dotenv/config");

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const email = "user@example.com";
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 12);

  const res = await client.query(
    `INSERT INTO "users" (id, email, "passwordHash", "createdAt")
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (email) DO UPDATE SET "passwordHash" = $3
     RETURNING id, email;`,
    ["cseeduser0001", email, passwordHash]
  );

  console.log("Seeded user:", res.rows[0].email);
  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
