import { jest } from "@jest/globals";

const mockExecSync = jest.fn();

jest.unstable_mockModule("child_process", () => ({
  execSync: mockExecSync,
}));

const { PlaceService } = await import("../src/core/place-service.js");

type PlaceServiceInstance = InstanceType<typeof PlaceService>;

describe("PlaceService (Native CLI)", () => {
  let service: PlaceServiceInstance;

  beforeEach(() => {
    service = new PlaceService();
    service._exec = mockExecSync as any;
    jest.clearAllMocks();
  });

  const mockTabs = () => Buffer.from(JSON.stringify({ tabs: [{ url: "maps", type: "page", targetId: "t1" }] }));
  const mockProfiles = () => Buffer.from(JSON.stringify({ profiles: [{ name: "openclaw", running: true, tabCount: 1 }] }));
  const mockOk = (result: any) => Buffer.from(JSON.stringify({ ok: true, result }));
  const mockFail = (error: string) => Buffer.from(JSON.stringify({ ok: false, error }));

  test("should handle successful execution", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("profiles")) return mockProfiles();
      if (cmd.includes("tabs")) return mockTabs();
      if (cmd.includes("evaluate")) return mockOk([{ name: "Test" }]);
      return Buffer.from("");
    });

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("Test");
  });

  test("should handle BROWSER_CONNECTION_FAILED on startup attempt", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("profiles")) return Buffer.from(JSON.stringify({ profiles: [{ name: "openclaw", running: false }] }));
      if (cmd.includes("tabs")) return Buffer.from(JSON.stringify({ tabs: [] }));
      if (cmd.includes("google-chrome")) throw new Error("Spawn error");
      return Buffer.from("");
    });

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("BROWSER_CONNECTION_FAILED");
  });

  test("should handle CLI errors (AUTH_REQUIRED, etc)", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("profiles")) return mockProfiles();
      if (cmd.includes("tabs")) return mockTabs();
      if (cmd.includes("evaluate")) return mockFail("AUTH_REQUIRED");
      return Buffer.from("");
    });

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("AUTH_REQUIRED");
  });

  test("should handle DATA_INCONSISTENCY if count mismatch", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("profiles")) return mockProfiles();
      if (cmd.includes("tabs")) return mockTabs();
      if (cmd.includes("evaluate")) return mockFail("DATA_INCONSISTENCY: Expected 10 but found 8");
      return Buffer.from("");
    });

    const result = await service.getPlacesFromCollection("Test");
    expect(result.content[0].text).toContain("DATA_INCONSISTENCY");
  });
});
