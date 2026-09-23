import { db } from "../src/lib/db";
import { ensureSingletonEventConfig, ensureSuperAdminBootstrap } from "../src/lib/bootstrap";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const username = required("ADMIN_USERNAME");
  const email = required("ADMIN_EMAIL");
  const password = required("ADMIN_PASSWORD");

  const eventConfig = await ensureSingletonEventConfig();
  const superAdmin = await ensureSuperAdminBootstrap({ username, email, password });

  console.log(`Production bootstrap complete: EventConfig=${eventConfig.id}, SUPER_ADMIN=${superAdmin.username}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Production bootstrap failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });