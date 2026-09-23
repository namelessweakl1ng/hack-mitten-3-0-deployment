/**
 * Hackmitten 3.0 — Production bootstrap seed.
 *
 * Creates ONLY:
 *   - Super admin account
 *   - Coordinator account (optional — only if both COORDINATOR_USERNAME and COORDINATOR_PASSWORD are set)
 *   - Food admin account (optional — only if both FOOD_ADMIN_USERNAME and FOOD_ADMIN_PASSWORD are set)
 *   - Event config singleton
 *   - Default meals (Breakfast, Lunch, Snacks, Dinner)
 *
 * Does NOT create:
 *   - demo teams / sponsors / gallery / coordinators / winners / phases / food check-ins
 *   - writes to .env.local or any other file
 *
 * Required env vars:
 *   ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
 *   HM3_BERSERK_SECRET (if missing, one is generated and printed ONCE with a warning)
 *
 * Optional env vars:
 *   COORDINATOR_USERNAME, COORDINATOR_PASSWORD, COORDINATOR_EMAIL
 *   FOOD_ADMIN_USERNAME, FOOD_ADMIN_PASSWORD, FOOD_ADMIN_EMAIL
 *
 * Usage: bun run prisma/seed.ts
 */
import { PrismaClient, Role, MealType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateBerserkSecret } from "../src/lib/constants";
import { ensureSingletonEventConfig, ensureSuperAdminBootstrap } from "../src/lib/bootstrap";

const db = new PrismaClient();

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(`\n[FATAL] Missing required environment variable: ${name}`);
    console.error("Set it in your environment (e.g. .env, Vercel project settings, or your secret manager).");
    console.error("The production bootstrap seed will not run with default credentials.\n");
    process.exit(1);
  }
  return v.trim();
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

async function main() {
  console.log("→ Hackmitten 3.0 — production bootstrap seed\n");

  // ─── Admin ──────────────────────────────────────────────────────────────
  const adminUsername = required("ADMIN_USERNAME");
  const adminEmail = required("ADMIN_EMAIL");
  const adminPassword = required("ADMIN_PASSWORD");

  let berserkSecret = optional("HM3_BERSERK_SECRET");
  if (!berserkSecret) {
    berserkSecret = generateBerserkSecret(48);
    console.warn("─────────────────────────────────────────────────────────────────────");
    console.warn("⚠️  HM3_BERSERK_SECRET not set in environment.");
    console.warn("A new 48-char BERSERK recovery secret was generated for this run.");
    console.warn("Save it NOW in your secret manager / Vercel project env vars.");
    console.warn("It will NOT be written to any file by this script.\n");
    console.warn(`HM3_BERSERK_SECRET=${berserkSecret}`);
    console.warn("─────────────────────────────────────────────────────────────────────\n");
  }

  const berserkHash = await bcrypt.hash(berserkSecret, 12);

  const superAdmin = await ensureSuperAdminBootstrap({
    username: adminUsername,
    email: adminEmail,
    password: adminPassword,
  });

  await db.user.update({
    where: { id: superAdmin.id },
    data: { recoveryHash: berserkHash },
  });
  console.log(`  ✓ super admin (${adminUsername})`);

  // ─── Coordinator (optional) ─────────────────────────────────────────────
  const coordUsername = optional("COORDINATOR_USERNAME");
  const coordPassword = optional("COORDINATOR_PASSWORD");
  if (coordUsername && coordPassword) {
    const coordEmail = optional("COORDINATOR_EMAIL") ?? `${coordUsername}@hackmitten.local`;
    const coordHash = await bcrypt.hash(coordPassword, 12);
    await db.user.upsert({
      where: { username: coordUsername },
      update: { email: coordEmail, passwordHash: coordHash, role: Role.COORDINATOR },
      create: {
        username: coordUsername,
        email: coordEmail,
        name: "Coordinator",
        role: Role.COORDINATOR,
        passwordHash: coordHash,
      },
    });
    console.log(`  ✓ coordinator (${coordUsername})`);
  } else {
    console.log("  · coordinator account skipped (COORDINATOR_USERNAME / COORDINATOR_PASSWORD not both set)");
  }

  // ─── Food admin (optional) ──────────────────────────────────────────────
  const foodUsername = optional("FOOD_ADMIN_USERNAME");
  const _foodPassword = optional("FOOD_ADMIN_PASSWORD");
  if (foodUsername && _foodPassword) {
    const foodEmail = optional("FOOD_ADMIN_EMAIL") ?? `${foodUsername}@hackmitten.local`;
    const foodHash = await bcrypt.hash(_foodPassword, 12);
    await db.user.upsert({
      where: { username: foodUsername },
      update: { email: foodEmail, passwordHash: foodHash, role: Role.FOOD_ADMIN },
      create: {
        username: foodUsername,
        email: foodEmail,
        name: "Food Admin",
        role: Role.FOOD_ADMIN,
        passwordHash: foodHash,
      },
    });
    console.log(`  ✓ food admin (${foodUsername})`);
  } else {
    console.log("  · food admin account skipped (FOOD_ADMIN_USERNAME / FOOD_ADMIN_PASSWORD not both set)");
  }

  // ─── Event config singleton ────────────────────────────────────────────
  const eventCfg = await ensureSingletonEventConfig();
  console.log(`  ✓ event config ready (${eventCfg.id})`);

  // ─── Default meals ──────────────────────────────────────────────────────
  const meals = [
    { type: MealType.BREAKFAST, label: "Breakfast", enabled: true, startTime: "08:00", endTime: "10:00" },
    { type: MealType.LUNCH, label: "Lunch", enabled: true, startTime: "12:30", endTime: "14:00" },
    { type: MealType.SNACKS, label: "Snacks", enabled: true, startTime: "17:30", endTime: "18:30" },
    { type: MealType.DINNER, label: "Dinner", enabled: true, startTime: "20:30", endTime: "22:00" },
  ];
  for (const m of meals) {
    const id = `meal_${m.label.replace(/\W+/g, "_").toLowerCase()}`;
    await db.meal.upsert({
      where: { id },
      update: {},
      create: { id, ...m, date: null },
    });
  }
  console.log(`  ✓ ${meals.length} default meals (Breakfast, Lunch, Snacks, Dinner)`);

  console.log("\n✅ Bootstrap seed complete.");
  console.log("  Login at /login with the super admin credentials you configured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
