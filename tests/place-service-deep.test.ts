import { jest } from "@jest/globals";

const mockExecSync = jest.fn();

jest.unstable_mockModule("child_process", () => ({
  execSync: mockExecSync,
}));

const { PlaceService } = await import("../src/core/place-service.js");

type PlaceServiceInstance = InstanceType<typeof PlaceService>;

describe("PlaceService (Deep Coverage)", () => {
  let service: PlaceServiceInstance;

  beforeEach(() => {
    service = new PlaceService();
    service._exec = mockExecSync as any;
    // @ts-ignore
    service.debug = true; 
    jest.clearAllMocks();
  });

  const mockTabs = (targetId = "t1") => Buffer.from(JSON.stringify({ tabs: [{ url: "maps", type: "page", targetId }] }));
  const mockProfiles = (running = true, tabCount = 1) => Buffer.from(JSON.stringify({ profiles: [{ name: "openclaw", running, tabCount }] }));
  const mockOk = (result: any) => Buffer.from(JSON.stringify({ ok: true, result }));
  const mockFail = (error: string) => Buffer.from(JSON.stringify({ ok: false, error }));

  test("should retry on execution context destroyed", async () => {
    let evalCount = 0;
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("profiles")) return mockProfiles();
      if (cmd.includes("tabs")) return mockTabs();
      if (cmd.includes("evaluate")) {
        if (!cmd.includes("documentElement")) {
          evalCount++;
          if (evalCount === 1) {
             const err = new Error("Execution context was destroyed") as any;
             err.stdout = Buffer.from("Execution context was destroyed");
             throw err;
          }
          return mockOk([{ name: "Success After Retry" }]);
        }
        return Buffer.from("<html></html>");
      }
      return mockOk({});
    });

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("Success After Retry");
    expect(evalCount).toBe(2);
  });

  test("should handle profile running but no tabs (open new tab)", async () => {
    let tabCheckCount = 0;
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("profiles")) return mockProfiles(true, 0); 
      if (cmd.includes("tabs")) {
         tabCheckCount++;
         if (tabCheckCount > 1) return mockTabs("new-id");
         return Buffer.from(JSON.stringify({ tabs: [] }));
      }
      if (cmd.includes("evaluate")) return mockOk([{ name: "Success" }]);
      return mockOk({});
    });

    const result = await service.listAllCollections();
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining("open \"https://www.google.com/maps/\""), expect.anything());
    expect(result.content[0].text).toContain("Success");
  });
});
