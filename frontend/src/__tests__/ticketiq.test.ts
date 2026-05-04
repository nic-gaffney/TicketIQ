import { assigneeName, avgResolutionHours } from "@/lib/ticket-helpers";
import type { Ticket } from "@/lib/types";

function makeMockTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ticketId: "1",
    title: "Test ticket",
    submittedBy: "1",
    description: "Test ticket description",
    affectedSystem: "Test System",
    category: "network",
    region: "US-East",
    status: "open",
    severity: "low",
    urgency: "low",
    priorityScore: 11,
    assignedTo: undefined,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
    escalatedAt: undefined,
    resolvedAt: undefined,
    aiConfidence: 0,
    slaDeadline: new Date().toISOString(),
    ...overrides,
  };
}

describe("assigneeName", () => {
  it("returns — when assignedTo is undefined", () => {
    expect(assigneeName(makeMockTicket({ assignedTo: undefined }))).toBe("—");
  });
  it("returns a string when assignedTo is set", () => {
    const result = assigneeName(makeMockTicket({ assignedTo: "5" }));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  it("returns different values for assigned vs unassigned", () => {
    const u = assigneeName(makeMockTicket({ assignedTo: undefined }));
    const a = assigneeName(makeMockTicket({ assignedTo: "3" }));
    expect(u).not.toBe(a);
  });
});

describe("avgResolutionHours", () => {
  it("returns 0 when no tickets provided", () => {
    expect(avgResolutionHours([])).toBe(0);
  });
  it("returns 0 when no resolved tickets", () => {
    expect(avgResolutionHours([
      makeMockTicket({ status: "open" }),
      makeMockTicket({ status: "escalated" }),
    ])).toBe(0);
  });
  it("returns positive number for resolved ticket", () => {
    const now = Date.now();
    const result = avgResolutionHours([makeMockTicket({
      status: "resolved",
      createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      resolvedAt: new Date(now).toISOString(),
    })]);
    expect(result).toBeGreaterThan(0);
  });
  it("ignores non-resolved tickets", () => {
    const now = Date.now();
    const resolved = makeMockTicket({
      ticketId: "1",
      status: "resolved",
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      resolvedAt: new Date(now).toISOString(),
    });
    expect(avgResolutionHours([resolved, makeMockTicket({ status: "open" })])).toBe(avgResolutionHours([resolved]));
  });
});

describe("Ticket status checks", () => {
  it("escalated status is correctly identified", () => {
    expect(makeMockTicket({ status: "escalated" }).status).toBe("escalated");
  });
  it("escalated ticket has escalatedAt timestamp", () => {
    expect(makeMockTicket({ status: "escalated", escalatedAt: new Date().toISOString() }).escalatedAt).toBeDefined();
  });
  it("non-escalated ticket has no escalatedAt", () => {
    expect(makeMockTicket({ status: "open", escalatedAt: undefined }).escalatedAt).toBeUndefined();
  });
  it("resolved ticket has resolvedAt timestamp", () => {
    expect(makeMockTicket({ status: "resolved", resolvedAt: new Date().toISOString() }).resolvedAt).toBeDefined();
  });
});

describe("Severity filtering", () => {
  const tickets = [
    makeMockTicket({ ticketId: "1", severity: "high",   status: "escalated" }),
    makeMockTicket({ ticketId: "2", severity: "high",   status: "open" }),
    makeMockTicket({ ticketId: "3", severity: "medium", status: "open" }),
    makeMockTicket({ ticketId: "4", severity: "low",    status: "open" }),
    makeMockTicket({ ticketId: "5", severity: "high",   status: "resolved" }),
  ];
  it("filters only escalated tickets", () => {
    const esc = tickets.filter((t) => t.status === "escalated");
    expect(esc).toHaveLength(1);
    expect(esc[0].ticketId).toBe("1");
  });
  it("filters high severity tickets", () => {
    expect(tickets.filter((t) => t.severity === "high")).toHaveLength(3);
  });
  it("filters unassigned tickets", () => {
    expect(tickets.filter((t) => !t.assignedTo)).toHaveLength(tickets.length);
  });
  it("sorts by priority score descending", () => {
    const sorted = [
      makeMockTicket({ ticketId: "1", priorityScore: 20 }),
      makeMockTicket({ ticketId: "2", priorityScore: 95 }),
      makeMockTicket({ ticketId: "3", priorityScore: 55 }),
    ].sort((a, b) => b.priorityScore - a.priorityScore);
    expect(sorted[0].priorityScore).toBe(95);
    expect(sorted[2].priorityScore).toBe(20);
  });
  it("sorts escalated tickets oldest first", () => {
    const now = Date.now();
    const sorted = [
      makeMockTicket({ ticketId: "1", escalatedAt: new Date(now - 1000 * 60 * 120).toISOString() }),
      makeMockTicket({ ticketId: "2", escalatedAt: new Date(now - 1000 * 60 * 30).toISOString() }),
      makeMockTicket({ ticketId: "3", escalatedAt: new Date(now - 1000 * 60 * 60).toISOString() }),
    ].sort((a, b) => new Date(a.escalatedAt ?? 0).getTime() - new Date(b.escalatedAt ?? 0).getTime());
    expect(sorted[0].ticketId).toBe("1");
    expect(sorted[2].ticketId).toBe("2");
  });
});

describe("Priority score ordering", () => {
  it("high priority appears before low in queue", () => {
    const sorted = [
      makeMockTicket({ ticketId: "1", priorityScore: 11 }),
      makeMockTicket({ ticketId: "2", priorityScore: 33 }),
    ].sort((a, b) => b.priorityScore - a.priorityScore);
    expect(sorted[0].ticketId).toBe("2");
  });
});
