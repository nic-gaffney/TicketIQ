const CAT = ["network", "software", "hardware", "account", "security", "other"] as const;

/** Same slugs as `IssueCategory` in `types.ts` — kept here to avoid import cycles. */
export type IssueCategorySlug = (typeof CAT)[number];

export const ISSUE_CATEGORY_OPTIONS: { value: IssueCategorySlug; label: string }[] = [
  { value: "network", label: "Network" },
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
  { value: "account", label: "Account / access" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const LOWER_MAP: Record<string, IssueCategorySlug> = {
  network: "network",
  software: "software",
  hardware: "hardware",
  account: "account",
  security: "security",
  other: "other",
  access: "account",
  email: "other",
  vpn: "network",
};

const TITLE_MAP: Record<string, IssueCategorySlug> = {
  Network: "network",
  Software: "software",
  Hardware: "hardware",
  Security: "security",
  Other: "other",
  Access: "account",
  Email: "other",
  VPN: "network",
};

/**
 * Normalize API or mock ticket category strings to the slug used in the UI
 * (submit form + technician specialization storage).
 */
export function mapApiCategoryToIssueCategory(raw: string): IssueCategorySlug {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (LOWER_MAP[lower]) return LOWER_MAP[lower];
  if (TITLE_MAP[t]) return TITLE_MAP[t];
  return "other";
}

export function issueCategoryLabel(value: IssueCategorySlug): string {
  return ISSUE_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Maps UI slug → backend `ALLOWED_CATEGORIES` label (`tickets.py`). */
export function issueCategoryToApiCategory(slug: IssueCategorySlug): string {
  const m: Record<IssueCategorySlug, string> = {
    network: "Network",
    software: "Software",
    hardware: "Hardware",
    account: "Access",
    security: "Security",
    other: "Other",
  };
  return m[slug];
}
