export type StaticSponsor = {
  name: string;
  logo: string;
  website: string | null;
  tier: string;
  customTier?: string | null;
};

export const SPONSORS: StaticSponsor[] = [
  {
    name: "VigyanLabs",
    logo: "/images/sponsors/Vlabs.jpeg",
    website: null,
    tier: "TITLE",
  },
  {
    name: "Sponsor 4",
    logo: "/images/sponsors/logo2.png",
    website: null,
    tier: "TITLE",
  },
  {
    name: "Sponsor 5",
    logo: "/images/sponsors/logo1.png",
    website: null,
    tier: "TITLE",
  },
  {
    name: "Sponsor 5",
    logo: "/images/sponsors/logo3.png",
    website: null,
    tier: "TITLE",
  },

  // CSE
  {
    name: "CSE",
    logo: "/images/sponsors/cse.png",
    website: null,
    tier: "CUSTOM",
    customTier: "Departments",
  },

  // AI&ML
  {
    name: "AI&ML",
    logo: "/images/sponsors/aiml.png",
    website: null,
    tier: "CUSTOM",
    customTier: "Departments",
  },
];

export function resolveSponsors(
  databaseSponsors?: Array<{
    id?: string;
    name?: string | null;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    tier?: string | null;
    customTier?: string | null;
  }> | null
) {
  /*
   * Use database sponsors when available.
   */
  if (databaseSponsors && databaseSponsors.length > 0) {
    return databaseSponsors.map((s, index) => ({
      id: s.id ?? `sponsor-${index}`,
      name: s.name ?? "Sponsor",
      logoUrl: s.logoUrl ?? "",
      websiteUrl: s.websiteUrl ?? null,
      tier: s.tier ?? "PARTNER",
      customTier: s.customTier ?? null,
      sortOrder: index,
    }));
  }

  /*
   * Otherwise use static sponsors.
   */
  return SPONSORS.map((s, index) => ({
    id: `static-sponsor-${index}`,
    name: s.name,
    logoUrl: s.logo,
    websiteUrl: s.website,
    tier: s.tier,
    customTier: s.customTier ?? null,
    sortOrder: index,
  }));
}