/**
 * test_rinin_frontend.ts
 * Frontend unit tests — roles.ts, category-mapping.ts, utils.ts, and type mappers (types.ts)
 * Place at: frontend/src/__tests__/test_rinin_frontend.ts
 */

import { isEndUser, isItSupport, isAdmin } from "@/lib/roles";
import {
  mapApiCategoryToIssueCategory,
  issueCategoryToApiCategory,
  issueCategoryLabel,
  ISSUE_CATEGORY_OPTIONS,
  type IssueCategorySlug,
} from "@/lib/category-mapping";
import { cn, debounce, formatFileSize } from "@/lib/utils";
import { ticketFromApi, userFromApi } from "@/lib/types";
import type { TicketOut, UserPublic } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTicketOut(overrides: Partial<TicketOut> = {}): TicketOut {
  return {
    id: 1,
    description: "Printer not responding after network change",
    affected_system: "Print Server",
    category: "Network",
    severity: "high",
    urgency: "high",
    priority_score: 88,
    status: "open",
    submitted_by_id: 42,
    assigned_to_id: null,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T10:05:00Z",
    escalated_at: null,
    resolved_at: null,
    attachment_path: null,
    internal_notes: null,
    region: "US-East",
    resolution_summary: null,
    in_progress_at: null,
    ...overrides,
  };
}

function makeUserPublic(overrides: Partial<UserPublic> = {}): UserPublic {
  return {
    id: 7,
    full_name: "Alice Smith",
    email: "alice@company.com",
    role: "it_support",
    department: "IT",
    region: "US-West",
    ...overrides,
  };
}

// ─── roles.ts ────────────────────────────────────────────────────────────────

describe("isEndUser", () => {
  it("returns true for 'end_user' (API role)", () => {
    expect(isEndUser("end_user")).toBe(true);
  });
  it("returns true for legacy 'user' mock role", () => {
    expect(isEndUser("user")).toBe(true);
  });
  it("returns false for 'it_support'", () => {
    expect(isEndUser("it_support")).toBe(false);
  });
  it("returns false for 'admin'", () => {
    expect(isEndUser("admin")).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(isEndUser(undefined)).toBe(false);
  });
});

describe("isItSupport", () => {
  it("returns true for 'it_support' (API role)", () => {
    expect(isItSupport("it_support")).toBe(true);
  });
  it("returns true for legacy 'technician' mock role", () => {
    expect(isItSupport("technician")).toBe(true);
  });
  it("returns false for 'end_user'", () => {
    expect(isItSupport("end_user")).toBe(false);
  });
  it("returns false for 'admin'", () => {
    expect(isItSupport("admin")).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(isItSupport(undefined)).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for 'admin'", () => {
    expect(isAdmin("admin")).toBe(true);
  });
  it("returns false for 'it_support'", () => {
    expect(isAdmin("it_support")).toBe(false);
  });
  it("returns false for 'end_user'", () => {
    expect(isAdmin("end_user")).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(isAdmin(undefined)).toBe(false);
  });
  it("roles are mutually exclusive for a standard technician", () => {
    const role = "it_support";
    expect(isItSupport(role)).toBe(true);
    expect(isEndUser(role)).toBe(false);
    expect(isAdmin(role)).toBe(false);
  });
});

// ─── category-mapping.ts ─────────────────────────────────────────────────────

describe("mapApiCategoryToIssueCategory — lowercase inputs", () => {
  it("maps 'network' → 'network'", () => {
    expect(mapApiCategoryToIssueCategory("network")).toBe("network");
  });
  it("maps 'software' → 'software'", () => {
    expect(mapApiCategoryToIssueCategory("software")).toBe("software");
  });
  it("maps 'hardware' → 'hardware'", () => {
    expect(mapApiCategoryToIssueCategory("hardware")).toBe("hardware");
  });
  it("maps 'security' → 'security'", () => {
    expect(mapApiCategoryToIssueCategory("security")).toBe("security");
  });
  it("maps 'access' alias → 'account'", () => {
    expect(mapApiCategoryToIssueCategory("access")).toBe("account");
  });
  it("maps 'vpn' alias → 'network'", () => {
    expect(mapApiCategoryToIssueCategory("vpn")).toBe("network");
  });
  it("maps 'email' alias → 'other'", () => {
    expect(mapApiCategoryToIssueCategory("email")).toBe("other");
  });
  it("maps unknown string → 'other'", () => {
    expect(mapApiCategoryToIssueCategory("bluetooth")).toBe("other");
  });
});

describe("mapApiCategoryToIssueCategory — title-case inputs (from API)", () => {
  it("maps 'Network' → 'network'", () => {
    expect(mapApiCategoryToIssueCategory("Network")).toBe("network");
  });
  it("maps 'Software' → 'software'", () => {
    expect(mapApiCategoryToIssueCategory("Software")).toBe("software");
  });
  it("maps 'Hardware' → 'hardware'", () => {
    expect(mapApiCategoryToIssueCategory("Hardware")).toBe("hardware");
  });
  it("maps 'Security' → 'security'", () => {
    expect(mapApiCategoryToIssueCategory("Security")).toBe("security");
  });
  it("maps 'Access' → 'account'", () => {
    expect(mapApiCategoryToIssueCategory("Access")).toBe("account");
  });
  it("maps 'VPN' → 'network'", () => {
    expect(mapApiCategoryToIssueCategory("VPN")).toBe("network");
  });
  it("maps 'Other' → 'other'", () => {
    expect(mapApiCategoryToIssueCategory("Other")).toBe("other");
  });
  it("maps unknown title-case string → 'other'", () => {
    expect(mapApiCategoryToIssueCategory("Bluetooth")).toBe("other");
  });
});

describe("issueCategoryToApiCategory — slug to API label", () => {
  it("'network' → 'Network'", () => {
    expect(issueCategoryToApiCategory("network")).toBe("Network");
  });
  it("'software' → 'Software'", () => {
    expect(issueCategoryToApiCategory("software")).toBe("Software");
  });
  it("'hardware' → 'Hardware'", () => {
    expect(issueCategoryToApiCategory("hardware")).toBe("Hardware");
  });
  it("'account' → 'Access' (backend ALLOWED_CATEGORIES label)", () => {
    expect(issueCategoryToApiCategory("account")).toBe("Access");
  });
  it("'security' → 'Security'", () => {
    expect(issueCategoryToApiCategory("security")).toBe("Security");
  });
  it("'other' → 'Other'", () => {
    expect(issueCategoryToApiCategory("other")).toBe("Other");
  });
  it("round-trip: toApi then fromApi returns original slug", () => {
    const slugs: IssueCategorySlug[] = ["network", "software", "hardware", "security", "other"];
    for (const slug of slugs) {
      const apiLabel = issueCategoryToApiCategory(slug);
      expect(mapApiCategoryToIssueCategory(apiLabel)).toBe(slug);
    }
  });
});

describe("issueCategoryLabel", () => {
  it("returns 'Network' for 'network'", () => {
    expect(issueCategoryLabel("network")).toBe("Network");
  });
  it("returns 'Account / access' for 'account'", () => {
    expect(issueCategoryLabel("account")).toBe("Account / access");
  });
  it("returns 'Security' for 'security'", () => {
    expect(issueCategoryLabel("security")).toBe("Security");
  });
  it("ISSUE_CATEGORY_OPTIONS has exactly 6 entries", () => {
    expect(ISSUE_CATEGORY_OPTIONS).toHaveLength(6);
  });
  it("all ISSUE_CATEGORY_OPTIONS values are unique", () => {
    const values = ISSUE_CATEGORY_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

// ─── utils.ts ────────────────────────────────────────────────────────────────

describe("cn (class name merger)", () => {
  it("joins two class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("ignores falsy values", () => {
    expect(cn("foo", false && "bar", undefined, "baz")).toBe("foo baz");
  });
  it("returns empty string with no args", () => {
    expect(cn()).toBe("");
  });
});

describe("formatFileSize", () => {
  it("formats bytes under 1 KB as 'N B'", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });
  it("formats bytes >= 1 KB as KB with 1 decimal", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });
  it("formats bytes >= 1 MB as MB with 1 decimal", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
  it("formats 0 bytes as '0 B'", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });
  it("formats 1536 bytes as '1.5 KB'", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});

describe("debounce", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("does not call fn before delay", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
  });
  it("calls fn after delay", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("resets timer on repeated calls", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    jest.advanceTimersByTime(100);
    debounced();
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── types.ts — ticketFromApi mapper ─────────────────────────────────────────

describe("ticketFromApi", () => {
  it("casts numeric id to string ticketId", () => {
    const t = ticketFromApi(makeTicketOut({ id: 99 }));
    expect(t.ticketId).toBe("99");
  });
  it("derives title from first 60 chars of description", () => {
    const desc = "A".repeat(80);
    const t = ticketFromApi(makeTicketOut({ description: desc }));
    expect(t.title).toBe("A".repeat(60));
    expect(t.title.length).toBe(60);
  });
  it("maps submitted_by_id to submittedBy string", () => {
    const t = ticketFromApi(makeTicketOut({ submitted_by_id: 42 }));
    expect(t.submittedBy).toBe("42");
  });
  it("maps assigned_to_id to assignedTo string when set", () => {
    const t = ticketFromApi(makeTicketOut({ assigned_to_id: 5 }));
    expect(t.assignedTo).toBe("5");
  });
  it("leaves assignedTo undefined when assigned_to_id is null", () => {
    const t = ticketFromApi(makeTicketOut({ assigned_to_id: null }));
    expect(t.assignedTo).toBeUndefined();
  });
  it("normalizes API category 'Network' to slug 'network'", () => {
    const t = ticketFromApi(makeTicketOut({ category: "Network" }));
    expect(t.category).toBe("network");
  });
  it("wraps single attachment_path in array", () => {
    const t = ticketFromApi(makeTicketOut({ attachment_path: "/tmp/file.pdf" }));
    expect(t.attachments).toEqual(["/tmp/file.pdf"]);
  });
  it("leaves attachments undefined when attachment_path is null", () => {
    const t = ticketFromApi(makeTicketOut({ attachment_path: null }));
    expect(t.attachments).toBeUndefined();
  });
  it("wraps internal_notes string into Note array", () => {
    const t = ticketFromApi(makeTicketOut({ internal_notes: "Check cable" }));
    expect(t.internalNotes).toHaveLength(1);
    expect(t.internalNotes![0].content).toBe("Check cable");
  });
  it("leaves internalNotes undefined when internal_notes is null", () => {
    const t = ticketFromApi(makeTicketOut({ internal_notes: null }));
    expect(t.internalNotes).toBeUndefined();
  });
  it("passes through priority_score as priorityScore", () => {
    const t = ticketFromApi(makeTicketOut({ priority_score: 77 }));
    expect(t.priorityScore).toBe(77);
  });
  it("passes through status", () => {
    const t = ticketFromApi(makeTicketOut({ status: "escalated" }));
    expect(t.status).toBe("escalated");
  });
  it("maps escalated_at to escalatedAt", () => {
    const ts = "2025-06-01T12:00:00Z";
    const t = ticketFromApi(makeTicketOut({ escalated_at: ts }));
    expect(t.escalatedAt).toBe(ts);
  });
  it("maps resolved_at to resolvedAt", () => {
    const ts = "2025-06-02T08:00:00Z";
    const t = ticketFromApi(makeTicketOut({ resolved_at: ts }));
    expect(t.resolvedAt).toBe(ts);
  });
  it("defaults region to empty string when null", () => {
    const t = ticketFromApi(makeTicketOut({ region: null }));
    expect(t.region).toBe("");
  });
});

// ─── types.ts — userFromApi mapper ───────────────────────────────────────────

describe("userFromApi", () => {
  it("casts numeric id to string userId", () => {
    const u = userFromApi(makeUserPublic({ id: 7 }));
    expect(u.userId).toBe("7");
  });
  it("maps full_name to name", () => {
    const u = userFromApi(makeUserPublic({ full_name: "Bob Jones" }));
    expect(u.name).toBe("Bob Jones");
  });
  it("passes through email", () => {
    const u = userFromApi(makeUserPublic({ email: "bob@company.com" }));
    expect(u.email).toBe("bob@company.com");
  });
  it("passes through role", () => {
    const u = userFromApi(makeUserPublic({ role: "admin" }));
    expect(u.role).toBe("admin");
  });
  it("passes through department", () => {
    const u = userFromApi(makeUserPublic({ department: "Engineering" }));
    expect(u.department).toBe("Engineering");
  });
  it("passes through region when set", () => {
    const u = userFromApi(makeUserPublic({ region: "EU-West" }));
    expect(u.region).toBe("EU-West");
  });
  it("sets region to undefined when null", () => {
    const u = userFromApi(makeUserPublic({ region: null }));
    expect(u.region).toBeUndefined();
  });
});
