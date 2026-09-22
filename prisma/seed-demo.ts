/**
 * Hackmitten 3.0 — Development demo seed.
 *
 * Creates dummy content for local development / staging:
 *   - Hackathon phases (24-hour timeline)
 *   - Coordinators (student + faculty, with one lead)
 *   - Gallery items grouped by year
 *   - Sponsors across all tiers
 *   - Winners (hidden by default via config.winnersVisible)
 *   - Dummy teams (12) with team leaders, payments, audit logs
 *   - Food check-ins for approved teams
 *
 * Refuses to run when NODE_ENV === "production".
 * Does not create admin accounts — run `bun run prisma/seed.ts` first.
 * Does not write to .env.local or any file.
 *
 * Usage: bun run prisma/seed-demo.ts
 */
import { PrismaClient, Role, RegistrationStatus, PaymentStatus, MealType, CoordinatorType, SponsorTier } from "@prisma/client";
import {
  generateQrToken,
  generateRegistrationId,
  generateParticipantId,
} from "../src/lib/constants";

const db = new PrismaClient();

function placeholderPortrait(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=151515&textColor=F2F2F2`;
}

function placeholderGallery(title: string): string {
  const seed = encodeURIComponent(title);
  return `https://picsum.photos/seed/${seed}/800/1000`;
}

function placeholderSponsor(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=252525&textColor=F2F2F2`;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("\n[FATAL] seed-demo refuses to run with NODE_ENV=production.");
    console.error("Demo data must never be loaded into a production database.\n");
    process.exit(1);
  }

  console.log("→ Hackmitten 3.0 — development demo seed\n");

  const superAdmin = await db.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
  if (!superAdmin) {
    console.error("\n[FATAL] No super admin user found. Run `bun run prisma/seed.ts` first.\n");
    process.exit(1);
  }
  const foodAdmin = await db.user.findFirst({ where: { role: Role.FOOD_ADMIN } }) ?? superAdmin;

  // Configure the singleton with sensible demo defaults (countdown 30 days from now)
  const start = new Date(Date.now() + 30 * 86400000);
  const startDateIso = start.toISOString().slice(0, 10);
  const endDate = new Date(start.getTime() + 24 * 3600000);
  const endDateIso = endDate.toISOString().slice(0, 10);
  const regDeadline = new Date(start.getTime() - 2 * 86400000).toISOString();

  await db.eventConfig.upsert({
    where: { id: "singleton" },
    update: {
      eventName: "Hackmitten 3.0",
      edition: "3.0",
      tagline: "IDEAS BEYOND THE HORIZON",
      description: "24 hours. National Hackathon. Limitless possibilities.",
      eventStartDate: startDateIso,
      eventStartTime: "09:00",
      eventEndDate: endDateIso,
      eventEndTime: "09:00",
      eventTimezone: "Asia/Kolkata",
      eventDurationHours: 24,
      registrationDeadline: regDeadline,
      registrationFee: "₹800",
      prizePool: "₹1,00,000",
      heroHeading: "HACKMITTEN",
      heroEdition: "3.0",
      heroSubtitle: "IDEAS BEYOND THE HORIZON | NATIONAL LEVEL HACKATHON",
      heroDescription: "24 hours. Real problems. Limitless possibilities.",
      heroCtaText: "REGISTER NOW",
      heroCtaLink: "/register",
      heroVisible: true,
      aboutHeading: "BUILD. BREAK. REBUILD.",
      aboutDescription: "Hackmitten is not a hackathon. It is a 24-hour descent into the unknown — a place where ideas cross the event horizon and emerge as something built, broken, and rebuilt into existence.",
      aboutStatDuration: "24",
      aboutStatTeamSize: "3—4",
      aboutStatFee: "₹800",
      aboutStatPrize: "₹1,00,000",
      aboutStatVenue: "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA",
      footerText: "SEE YOU AT THE EVENT HORIZON.",
      collegeName: "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA",
      contactEmail: "hodcse@mitt.edu.in",
      upiId: "hackmitten@upi",
      winnersVisible: false,
      winnersHeading: "THE MISSION IS COMPLETE.",
      winnersSubheading: "MEET THE WINNERS.",
      socialLinks: JSON.stringify({
        instagram: "https://instagram.com/hackmitten",
        linkedin: "https://linkedin.com/company/hackmitten",
      }),
    },
    create: { id: "singleton" },
  });
  console.log("  ✓ event config (24h, ₹800, ₹1L prize, MAHARAJA INSTITUTE venue)");

  // ─── Hackathon phases (24-hour timeline) ────────────────────────────────
  const phases = [
    { name: "REGISTRATION", desc: "Assemble your crew. Register your team.", startOffset: -30 * 86400, endOffset: -2 * 86400, order: 1 },
    { name: "OPENING CEREMONY", desc: "Kickoff, rules, problem statements reveal.", startOffset: -3600, endOffset: 0, order: 2 },
    { name: "HACKATHON START", desc: "The 24-hour build begins.", startOffset: 0, endOffset: 0.5 * 3600, order: 3 },
    { name: "MENTORING", desc: "Industry mentors available across tracks.", startOffset: 4 * 3600, endOffset: 12 * 3600, order: 4 },
    { name: "SUBMISSION", desc: "Final submissions close.", startOffset: 22 * 3600, endOffset: 24 * 3600, order: 5 },
    { name: "JUDGING", desc: "Demos and evaluation.", startOffset: 24 * 3600, endOffset: 26 * 3600, order: 6 },
    { name: "FINAL PRESENTATION", desc: "Top teams pitch on main stage.", startOffset: 26 * 3600, endOffset: 27 * 3600, order: 7 },
    { name: "WINNERS", desc: "Awards and closing.", startOffset: 27 * 3600, endOffset: 28 * 3600, order: 8 },
  ];
  for (const p of phases) {
    const phaseStart = new Date(start.getTime() + p.startOffset * 1000);
    const phaseEnd = new Date(start.getTime() + p.endOffset * 1000);
    await db.hackathonPhase.upsert({
      where: { id: `phase_${p.order}` },
      update: {},
      create: {
        id: `phase_${p.order}`,
        name: p.name,
        description: p.desc,
        startDate: phaseStart.toISOString().slice(0, 10),
        startTime: phaseStart.toISOString().slice(11, 16),
        endDate: phaseEnd.toISOString().slice(0, 10),
        endTime: phaseEnd.toISOString().slice(11, 16),
        sortOrder: p.order,
        visible: true,
      },
    });
  }
  console.log(`  ✓ ${phases.length} hackathon phases (24-hour timeline)`);

  // ─── Coordinators ───────────────────────────────────────────────────────
  const coordinators = [
    { name: "Aarav Sharma", role: "Lead Organizer", department: "CSE", type: CoordinatorType.STUDENT, phone: "+91 98100 11111", email: "aarav@hackmitten.example", isLead: true, sortOrder: 0 },
    { name: "Diya Patel", role: "Operations Lead", department: "ISE", type: CoordinatorType.STUDENT, phone: "+91 98100 22222", email: "diya@hackmitten.example", sortOrder: 1 },
    { name: "Kabir Reddy", role: "Tech Lead", department: "CSE AI", type: CoordinatorType.STUDENT, phone: "+91 98100 33333", email: "kabir@hackmitten.example", sortOrder: 2 },
    { name: "Ananya Iyer", role: "Design Lead", department: "ECE", type: CoordinatorType.STUDENT, phone: "+91 98100 44444", email: "ananya@hackmitten.example", sortOrder: 3 },
    { name: "Dr. Rajesh Kumar", role: "Faculty Coordinator — HOD CSE", department: "Computer Science", type: CoordinatorType.FACULTY, phone: "", email: "hodcse@mitt.edu.in", sortOrder: 0 },
    { name: "Prof. Meera Nair", role: "Faculty Advisor", department: "Information Science", type: CoordinatorType.FACULTY, phone: "", email: "meera@mitt.edu.in", sortOrder: 1 },
  ];
  for (const c of coordinators) {
    const id = `${c.type[0]}-${c.sortOrder}-${c.name}`.replace(/\s+/g, "-").toLowerCase();
    await db.coordinatorProfile.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: c.name,
        role: c.role,
        department: c.department,
        type: c.type,
        phone: c.phone ?? null,
        email: c.email,
        photoUrl: placeholderPortrait(c.name),
        isLead: c.isLead ?? false,
        sortOrder: c.sortOrder,
      },
    });
  }
  console.log(`  ✓ ${coordinators.length} coordinators`);

  // ─── Gallery ────────────────────────────────────────────────────────────
  const galleryItems = [
    { title: "Opening Ceremony", caption: "Hackmitten 2.0 kickoff", year: "2024", sortOrder: 0 },
    { title: "Midnight Coding", caption: "Builders at 3 AM", year: "2024", sortOrder: 1 },
    { title: "Pitch Night", caption: "Final demos", year: "2024", sortOrder: 2 },
    { title: "Winners Podium", caption: "Team NOVA — 1st place", year: "2024", sortOrder: 3 },
    { title: "Workshop", caption: "AI/ML pre-event workshop", year: "2023", sortOrder: 0 },
    { title: "Team Photo", caption: "Hackmitten 2.0 participants", year: "2023", sortOrder: 1 },
    { title: "Closing Ceremony", caption: "See you at the event horizon", year: "2023", sortOrder: 2 },
    { title: "Mentor Session", caption: "Industry mentors in action", year: "2023", sortOrder: 3 },
  ];
  for (const g of galleryItems) {
    const id = `gal-${g.year}-${g.sortOrder}`;
    await db.galleryItem.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title: g.title,
        caption: g.caption,
        imageUrl: placeholderGallery(g.title),
        year: g.year,
        sortOrder: g.sortOrder,
        visible: true,
      },
    });
  }
  console.log(`  ✓ ${galleryItems.length} gallery items`);

  // ─── Sponsors ───────────────────────────────────────────────────────────
  const sponsors = [
    { name: "TechCorp India", tier: SponsorTier.TITLE, customTier: null, website: "https://example.com/techcorp", order: 0 },
    { name: "Quantum Systems", tier: SponsorTier.PLATINUM, customTier: null, website: "https://example.com/quantum", order: 1 },
    { name: "NebulaSoft", tier: SponsorTier.GOLD, customTier: null, website: "https://example.com/nebulasoft", order: 2 },
    { name: "Orbit Labs", tier: SponsorTier.GOLD, customTier: null, website: "https://example.com/orbit", order: 3 },
    { name: "Pulsar Foods", tier: SponsorTier.SILVER, customTier: null, website: "https://example.com/pulsar", order: 4 },
    { name: "MIT Thandavapura", tier: SponsorTier.PARTNER, customTier: null, website: "https://mit.thandavapura.edu.in", order: 5 },
  ];
  for (const s of sponsors) {
    const id = `sponsor_${s.name.replace(/\W+/g, "_").toLowerCase()}`;
    await db.sponsor.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: s.name,
        logoUrl: placeholderSponsor(s.name),
        websiteUrl: s.website,
        tier: s.tier,
        customTier: s.customTier,
        sortOrder: s.order,
        visible: true,
      },
    });
  }
  console.log(`  ✓ ${sponsors.length} sponsors`);

  // ─── Winners (hidden by default via config.winnersVisible=false) ─────────
  const winners = [
    { position: 1, positionLabel: "1st Place", teamName: "NOVA", prize: "₹50,000", description: "Built an AI-driven accessibility toolkit for visually impaired coders.", order: 0 },
    { position: 2, positionLabel: "2nd Place", teamName: "Orbit", prize: "₹25,000", description: "Real-time collaboration tool for distributed hackathon teams.", order: 1 },
    { position: 3, positionLabel: "3rd Place", teamName: "Singularity", prize: "₹15,000", description: "Edge ML waste-sorting robot for campus sustainability.", order: 2 },
    { position: 0, positionLabel: "Special Mention", teamName: "Pulsar", prize: "₹5,000", description: "Best UI/UX — cinematic black-hole themed dashboard.", order: 3 },
  ];
  for (const w of winners) {
    const id = `winner_${w.position}_${w.teamName.toLowerCase()}`;
    await db.winner.upsert({
      where: { id },
      update: {},
      create: {
        id,
        position: w.position,
        positionLabel: w.positionLabel,
        teamName: w.teamName,
        prize: w.prize,
        description: w.description,
        imageUrl: placeholderGallery(w.teamName),
        sortOrder: w.order,
        visible: true,
      },
    });
  }
  console.log(`  ✓ ${winners.length} winners (hidden via config.winnersVisible)`);

  // ─── Dummy teams (12) with team leaders ─────────────────────────────────
  const teams = [
    { name: "Nova", college: "IIT Bombay", status: RegistrationStatus.APPROVED, payment: PaymentStatus.VERIFIED, txn: "TXN-NOVA-9281" },
    { name: "Orbit", college: "BITS Pilani", status: RegistrationStatus.APPROVED, payment: PaymentStatus.VERIFIED, txn: "TXN-ORBIT-1129" },
    { name: "Singularity", college: "NIT Trichy", status: RegistrationStatus.APPROVED, payment: PaymentStatus.VERIFIED, txn: "TXN-SING-7732" },
    { name: "Pulsar", college: "VIT Vellore", status: RegistrationStatus.APPROVED, payment: PaymentStatus.VERIFIED, txn: "TXN-PULS-3318" },
    { name: "Quasar", college: "IIIT Hyderabad", status: RegistrationStatus.PAYMENT_PENDING, payment: PaymentStatus.PENDING, txn: "TXN-QUAS-5592" },
    { name: "Andromeda", college: "Delhi University", status: RegistrationStatus.REJECTED, payment: PaymentStatus.REJECTED, txn: "TXN-ANDR-9981", reason: "Transaction ID not found in UPI records" },
    { name: "Eclipse", college: "Anna University", status: RegistrationStatus.SUBMITTED, payment: PaymentStatus.PENDING, txn: null },
    { name: "Helios", college: "IIT Madras", status: RegistrationStatus.APPROVED, payment: PaymentStatus.VERIFIED, txn: "TXN-HELI-2204" },
    { name: "Cosmos", college: "MIT Thandavapura", status: RegistrationStatus.PAYMENT_PENDING, payment: PaymentStatus.PENDING, txn: "TXN-COSM-4488" },
    { name: "Zenith", college: "PES University", status: RegistrationStatus.PAYMENT_VERIFIED, payment: PaymentStatus.VERIFIED, txn: "TXN-ZENI-6611" },
    { name: "Aurora", college: "RVCE Bangalore", status: RegistrationStatus.SUBMITTED, payment: PaymentStatus.PENDING, txn: null },
    { name: "Vortex", college: "SRM Chennai", status: RegistrationStatus.REJECTED, payment: PaymentStatus.REJECTED, txn: "TXN-VORT-7700", reason: "Screenshot did not match transaction ID" },
  ];

  let approvedCount = 0;
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const existing = await db.team.findUnique({ where: { teamName: t.name } });
    if (existing) continue;

    const regId = t.status === RegistrationStatus.APPROVED ? generateRegistrationId(481 + approvedCount) : null;
    const team = await db.team.create({
      data: {
        teamName: t.name,
        college: t.college,
        status: t.status,
        registrationId: regId,
      },
    });

    const memberCount = 3 + (i % 2);
    for (let m = 0; m < memberCount; m++) {
      const participantId = regId ? generateParticipantId(481 + approvedCount, m + 1) : null;
      const qrToken = regId ? generateQrToken() : null;
      const memberNames = ["Aarav Sharma", "Diya Patel", "Kabir Reddy", "Ananya Iyer"];
      await db.participant.create({
        data: {
          teamId: team.id,
          fullName: `${t.name} Member ${m + 1} (${memberNames[m % 4]})`,
          email: `member${m + 1}@${t.name.toLowerCase()}.example`,
          phone: `+91 98${String(20000000 + i * 100 + m).slice(0, 8)}`,
          college: t.college,
          isLeader: m === 0,
          participantId,
          qrToken,
          passVerified: regId !== null,
        },
      });
    }

    if (t.txn || t.payment !== PaymentStatus.PENDING) {
      const payment = await db.payment.create({
        data: {
          teamId: team.id,
          transactionId: t.txn,
          status: t.payment,
          rejectionReason: t.reason ?? null,
          verifiedById: t.payment === PaymentStatus.VERIFIED ? superAdmin.id : null,
          verifiedAt: t.payment === PaymentStatus.VERIFIED ? new Date(Date.now() - i * 86400000) : null,
        },
      });
      await db.paymentScreenshot.create({
        data: {
          paymentId: payment.id,
          filePath: "/uploads/placeholder-payment.png",
          fileName: `payment_${t.name.toLowerCase()}.png`,
          mimeType: "image/png",
          sizeBytes: 102400,
        },
      });
    }

    if (t.payment === PaymentStatus.VERIFIED) {
      await db.auditLog.create({
        data: { userId: superAdmin.id, teamId: team.id, action: "PAYMENT_VERIFIED", detail: `Txn ${t.txn}` },
      });
    }
    if (t.status === RegistrationStatus.APPROVED) {
      await db.auditLog.create({
        data: { userId: superAdmin.id, teamId: team.id, action: "TEAM_APPROVED", detail: `Registration ID ${regId}` },
      });
      approvedCount++;
    }
    if (t.status === RegistrationStatus.REJECTED) {
      await db.auditLog.create({
        data: { userId: superAdmin.id, teamId: team.id, action: "PAYMENT_REJECTED", detail: t.reason ?? "Rejected" },
      });
    }
  }
  console.log(`  ✓ ${teams.length} dummy teams (with team leaders)`);

  // ─── Food check-ins for approved teams ──────────────────────────────────
  const breakfast = await db.meal.findFirst({ where: { type: MealType.BREAKFAST } });
  const approvedTeams = await db.team.findMany({
    where: { status: RegistrationStatus.APPROVED },
    include: { members: true },
  });
  let checkInCount = 0;
  if (breakfast) {
    for (const team of approvedTeams) {
      for (let m = 0; m < Math.min(2, team.members.length); m++) {
        const p = team.members[m];
        if (!p.qrToken) continue;
        try {
          await db.foodCheckIn.create({
            data: {
              participantId: p.id,
              mealId: breakfast.id,
              checkedInById: foodAdmin.id,
              createdAt: new Date(Date.now() - checkInCount * 60000),
            },
          });
          checkInCount++;
        } catch { /* already exists */ }
      }
    }
  }
  console.log(`  ✓ ${checkInCount} food check-ins (breakfast)`);

  console.log("\n✅ Demo seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
