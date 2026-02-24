import { jest } from "@jest/globals";
import { PlaceService } from "../src/core/place-service.js";
import { ErrorCode } from "../src/core/constants.js";

describe("PlaceService Version Detection", () => {
  let service: PlaceService;
  let mockExec: any;
  let mockSpawn: any;

  beforeEach(() => {
    service = new PlaceService();
    mockExec = jest.fn();
    mockSpawn = jest.fn();
    service._exec = mockExec;
    service._spawn = mockSpawn;

    // Mock checkBrowserStatus to return a fixed profile
    (service as any).browserManager = {
      checkBrowserStatus: () => ({ profile: "openclaw", targetId: "test-tab" })
    };
  });

  test("should detect LEGACY version when .CsEnBe exists", async () => {
    // Legacy Mock Output
    const legacyOutput = JSON.stringify({
      ok: true,
      result: [{ name: "Legacy List", type: "custom", visibility: "public", count: 5 }]
    });

    // Mock spawnSync return structure
    mockSpawn.mockReturnValue({
      status: 0,
      stdout: legacyOutput,
      stderr: ""
    });

    const result = await service.listAllCollections();
    const data = JSON.parse(result.content[0].text);
    expect(data[0].name).toBe("Legacy List");
  });

  test("should detect MODERN version when .CsEnBe is missing but new buttons exist", async () => {
    // Modern Mock Output
    const modernOutput = JSON.stringify({
      ok: true,
      result: [{ name: "Modern List", type: "custom", visibility: "public", count: 10 }]
    });

    // Mock spawnSync return structure
    mockSpawn.mockReturnValue({
      status: 0,
      stdout: modernOutput,
      stderr: ""
    });

    const result = await service.listAllCollections();
    const data = JSON.parse(result.content[0].text);
    expect(data[0].name).toBe("Modern List");
  });
});
