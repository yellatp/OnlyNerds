export interface TargetLevel {
  label: string;
  query: string;
}

export const TARGET_LEVELS: TargetLevel[] = [
  { label: 'Intern',      query: '"intern" OR "internship"' },
  { label: 'Entry/Grad',  query: '"new grad" OR "entry level" OR "junior" OR "graduate"' },
  { label: 'I / L1',      query: '"L1" OR "Level I" OR "I "' },
  { label: 'II / L2',     query: '"L2" OR "Level II" OR "II"' },
  { label: 'III / L3',    query: '"L3" OR "Level III" OR "III"' },
  { label: 'Senior',      query: '"senior" OR "Sr."' },
  { label: 'Staff',       query: '"staff"' },
  { label: 'Principal',   query: '"principal" OR "director"' },
];

/**
 * Build a targeted Google dork URL for a company + role + level.
 * Falls back to baseUrl when role is empty.
 */
export function buildTargetedUrl(
  baseUrl: string,
  companyName: string,
  role: string,
  levelQuery: string,
): string {
  if (!role.trim()) return baseUrl;

  const parts: string[] = [];

  // Try site: operator from the career URL domain
  try {
    const u = new URL(baseUrl);
    if (!u.hostname.includes('google.com')) {
      parts.push(`site:${u.hostname}`);
    } else {
      // Existing URL is already a Google fallback - use company name instead
      parts.push(`"${companyName}"`);
    }
  } catch {
    parts.push(`"${companyName}"`);
  }

  parts.push(`"${role.trim()}"`);
  if (levelQuery) parts.push(`(${levelQuery})`);

  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}`;
}
