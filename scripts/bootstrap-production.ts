import { db } from "../src/lib/db";
import { ensureSingletonEventConfig } from "../src/lib/bootstrap";
import { ensureOperationalUser, readCredentialGroup } from "../src/lib/operational-users";

async function main() {
  const admin = readCredentialGroup(process.env, "ADMIN");
  if (!admin) throw new Error("ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required");

  const eventConfig = await ensureSingletonEventConfig();
  const superAdmin = await ensureOperationalUser({ ...admin, name: "Super Admin", role: "SUPER_ADMIN" });

  console.log(`Production bootstrap complete: EventConfig=${eventConfig.id}, SUPER_ADMIN=${superAdmin.username}`);

  const coordinator = readCredentialGroup(process.env, "COORDINATOR");
  if (coordinator) {
    const user = await ensureOperationalUser({ ...coordinator, name: "Coordinator", role: "COORDINATOR" });
    console.log(`  ✓ COORDINATOR provisioned (${user.username}, ${user.email})`);
  } else {
    console.log("  · COORDINATOR not provisioned (credential group absent)");
  }

  const foodAdmin = readCredentialGroup(process.env, "FOOD_ADMIN");
  if (foodAdmin) {
    const user = await ensureOperationalUser({ ...foodAdmin, name: "Food Admin", role: "FOOD_ADMIN" });
    console.log(`  ✓ FOOD_ADMIN provisioned (${user.username}, ${user.email})`);
  } else {
    console.log("  · FOOD_ADMIN not provisioned (credential group absent)");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Production bootstrap failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });