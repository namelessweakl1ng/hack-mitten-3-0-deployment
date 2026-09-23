export type StaticSponsor = {
  name: string;
  logo: string;
  website: string | null;
  tier: string;
};

export const SPONSORS: StaticSponsor[] = [
  { name: "VigyanLabs", logo: "/images/sponsors/Vlabs.jpeg", website: null, tier: "TITLE" },
  { name: "AI&ML", logo: "/images/sponsors/aiml logo.jpeg", website: null, tier: "SUPPORTER" },
  { name: "CSE", logo: "/images/sponsors/cse logo.jpeg", website: null, tier: "SUPPORTER" },
];

export function resolveSponsors(databaseSponsors?: Array<{ id?: string; name?: string | null; logoUrl?: string | null; websiteUrl?: string | null; tier?: string | null }> | null) {
  if (databaseSponsors && databaseSponsors.length > 0) {
    return databaseSponsors.map((s, index) => ({
      id: s.id ?? `sponsor-${index}`,
      name: s.name ?? "Sponsor",
      logoUrl: s.logoUrl ?? "",
      websiteUrl: s.websiteUrl ?? null,
      tier: s.tier ?? "PARTNER",
      customTier: null,
      sortOrder: index,
    }));
  }

  return SPONSORS.map((s, index) => ({
    id: `static-sponsor-${index}`,
    name: s.name,
    logoUrl: s.logo,
    websiteUrl: s.website,
    tier: s.tier,
    customTier: null,
    sortOrder: index,
  }));
}
