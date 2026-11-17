import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCallerProfileRow, execute } = vi.hoisted(() => ({
  getCallerProfileRow: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("@/utils/fetchServerUser", () => ({ getCallerProfileRow }));
vi.mock("@/utils/db", () => ({ db: { execute } }));

import { GET } from "@/app/api/search/route";

const search = (params: string) =>
  GET(new Request(`http://localhost/api/search?${params}`));

describe("GET /api/search input checks", () => {
  beforeEach(() => {
    getCallerProfileRow.mockResolvedValue({ id: 1 });
    execute.mockReset().mockResolvedValue([]);
  });

  it("rejects signed-out requests", async () => {
    getCallerProfileRow.mockResolvedValue(null);
    expect((await search("type=users&term=jane")).status).toBe(401);
  });

  it.each(["", "term=", "term=a", "term=@a", "term=%20%20a%20"])(
    "rejects missing or too-short term (%s)",
    async (q) => {
      expect((await search(`type=users&${q}`)).status).toBe(400);
    },
  );

  it("rejects terms over 50 characters", async () => {
    expect((await search(`type=users&term=${"a".repeat(51)}`)).status).toBe(400);
  });

  it("rejects unknown types", async () => {
    expect((await search("type=sessions&term=jane")).status).toBe(400);
    expect((await search("term=jane")).status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it.each(["users", "tribes", "games"])("accepts a valid %s search", async (type) => {
    const res = await search(`type=${type}&term=jane`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
