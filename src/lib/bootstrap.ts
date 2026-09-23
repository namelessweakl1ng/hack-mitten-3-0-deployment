import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

type BootstrapDatabase = Pick<typeof db, "eventConfig" | "user">;

export const DEFAULT_EVENT_CONFIG = {
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
  heroDescription: "24 HOURS. REAL PROBLEMS. LIMITLESS POSSIBILITIES.",
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
  collegeLogoUrl: "",
  contactEmail: "hodcse@mitt.edu.in",
  upiId: "",
  upiQrUrl: "",
  winnersVisible: false,
  winnersHeading: "THE MISSION IS COMPLETE.",
  winnersSubheading: "MEET THE WINNERS.",
  socialLinks: "{}",
} as const;

export async function ensureSingletonEventConfig(database: BootstrapDatabase = db) {
  const existing = await database.eventConfig.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;

  try {
    return await database.eventConfig.create({ data: DEFAULT_EVENT_CONFIG });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const createdByConcurrentBootstrap = await database.eventConfig.findUnique({
        where: { id: "singleton" },
      });
      if (createdByConcurrentBootstrap) return createdByConcurrentBootstrap;
    }
    throw error;
  }
}

export async function ensureSuperAdminBootstrap({
  username,
  email,
  password,
  database = db,
}: {
  username: string;
  email: string;
  password: string;
  database?: BootstrapDatabase;
}) {
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await database.user.findFirst({
    where: {
      OR: [{ username: normalizedUsername }, { email: normalizedEmail }],
    },
  });

  if (!existing) {
    return database.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        name: "Super Admin",
        role: "SUPER_ADMIN",
        passwordHash,
      },
    });
  }

  const sameAdmin =
    existing.role === "SUPER_ADMIN" &&
    (existing.username === normalizedUsername || existing.email === normalizedEmail);

  if (!sameAdmin) {
    return existing;
  }

  return database.user.update({
    where: { id: existing.id },
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
      role: "SUPER_ADMIN",
      passwordHash,
      name: existing.name ?? "Super Admin",
    },
  });
}
