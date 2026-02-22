import { jest } from "@jest/globals";

const mockExecSync = jest.fn();

jest.unstable_mockModule("child_process", () => ({
  execSync: mockExecSync,
}));

const { PlaceService } = await import("./place-service.js");

type PlaceServiceInstance = InstanceType<typeof PlaceService>;

describe("PlaceService (Native CLI)", () => {
  let service: PlaceServiceInstance;

  beforeEach(() => {
    service = new PlaceService();
    service._exec = mockExecSync as any;
    jest.clearAllMocks();
  });

  const mockTabs = () => Buffer.from(JSON.stringify({ tabs: [{ url: "maps" }] }));
  const mockOk = (result: any) => Buffer.from(JSON.stringify({ ok: true, result }));
  const mockFail = (error: string) => Buffer.from(JSON.stringify({ ok: false, error }));

  test("should handle successful execution", async () => {
    mockExecSync
      .mockReturnValueOnce(mockTabs())
      .mockReturnValueOnce(mockOk([{ name: "Test" }]));

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("Test");
  });

  test("should handle BROWSER_NO_ACTIVE_TABS", async () => {
    mockExecSync.mockReturnValueOnce(Buffer.from(JSON.stringify({ tabs: [] })));
    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("BROWSER_NO_ACTIVE_TABS");
  });

  test("should handle NAVIGATING retry", async () => {
    mockExecSync
      .mockReturnValueOnce(mockTabs())
      .mockReturnValueOnce(mockOk("NAVIGATING"))
      .mockReturnValueOnce(mockOk("slept"))
      .mockReturnValueOnce(mockTabs())
      .mockReturnValueOnce(mockOk([{ name: "RetrySuccess" }]));

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("RetrySuccess");
  });

  test("should handle CLI errors (AUTH_REQUIRED, etc)", async () => {
    mockExecSync
      .mockReturnValueOnce(mockTabs())
      .mockReturnValueOnce(mockFail("AUTH_REQUIRED"));

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("AUTH_REQUIRED");
  });
});
