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

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const berserkHash = await bcrypt.hash(berserkSecret, 12);

  await db.user.upsert({
    where: { username: adminUsername },
    update: {
      email: adminEmail,
      passwordHash: adminHash,
      recoveryHash: berserkHash,
      role: Role.SUPER_ADMIN,
    },
    create: {
      username: adminUsername,
      email: adminEmail,
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      passwordHash: adminHash,
      recoveryHash: berserkHash,
    },
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
  await db.eventConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      eventName: "Hackmitten 3.0",
      edition: "3.0",
      tagline: "IDEAS BEYOND THE HORIZON",
      description: "24 hours. Real problems. Limitless possibilities.",
      eventStartDate: "2026-10-29",
      eventStartTime: "11:00",
      eventEndDate: "2026-10-30",
      eventEndTime: "11:00",
      eventTimezone: "Asia/Kolkata",
      eventDurationHours: 24,
      registrationDeadline: "2026-10-22T05:30:00.000Z",
      registrationFee: "₹1,000",
      prizePool: "₹1,00,000",
      registrationCapacity: 60,
      registrationsOpen: true,
      heroHeading: "HACKMITTEN",
      heroEdition: "3.0",
      heroSubtitle: "IDEAS BEYOND THE HORIZON | NATIONAL LEVEL HACKATHON",
      heroDescription: "24 hours. Real problems. Limitless possibilities.",
      heroCtaText: "REGISTER NOW",
      heroCtaLink: "/register",
      heroVisible: true,
      aboutHeading: "BUILD. BREAK. REBUILD.",
      aboutDescription: "Hackmitten is a 24-hour descent into the unknown, where ideas cross the event horizon and emerge as something built, broken, and rebuilt into existence.",
      aboutStatDuration: "24",
      aboutStatTeamSize: "3—4",
      aboutStatFee: "₹1,000",
      aboutStatPrize: "₹1,00,000",
      aboutStatVenue: "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA",
      footerText: "SEE YOU AT THE EVENT HORIZON.",
      collegeName: "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA",
      contactEmail: "hodcse@mitt.edu.in",
      upiId: "",
      winnersVisible: false,
      winnersHeading: "THE MISSION IS COMPLETE.",
      winnersSubheading: "MEET THE WINNERS.",
    },
  });
  console.log("  ✓ event config seeded with production Hackmitten defaults");

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
