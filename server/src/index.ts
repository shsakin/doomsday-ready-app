import { createApp } from "./app.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db/db.js";

async function start() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  if (process.env.SEED_ON_START === "true") {
    const { seedDatabase } = await import("./db/seed.js");
    await seedDatabase();
  }
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  const app = createApp();

  app.listen(port, () => {
    console.log(`Doomsday Ready API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  void pool.end();
  process.exit(1);
});
