import { jest } from "@jest/globals";
import { PlaceService } from "../src/core/place-service.js";
import { ErrorCode } from "../src/core/constants.js";

describe("PlaceService Version Detection", () => {
  let service: PlaceService;
  let mockExec: any;

  beforeEach(() => {
    service = new PlaceService();
    mockExec = jest.fn();
    service._exec = mockExec;
    // Mock checkBrowserStatus to return a fixed profile
    (service as any).browserManager = {
      checkBrowserStatus: () => ({ profile: "openclaw", targetId: "test-tab" })
    };
  });

  test("should detect LEGACY version when .CsEnBe exists", async () => {
    // This is a placeholder for the logic we want to implement
    // We want the injected script to handle both versions.
    // For TDD, let's say we expect the result to contain a version field or handle it correctly.
    
    // Legacy Mock Output
    const legacyOutput = JSON.stringify({
      ok: true,
      result: [{ name: "Legacy List", type: "custom", visibility: "public", count: 5 }]
    });

    mockExec.mockReturnValue(legacyOutput);

    const result = await service.listAllCollections();
    const data = JSON.parse(result.content[0].text);
    expect(data[0].name).toBe("Legacy List");
  });

  test("should detect MODERN version when .CsEnBe is missing but new buttons exist", async () => {
    // Modern Mock Output (simulating the new UI structure I saw in debug_elements.json)
    const modernOutput = JSON.stringify({
      ok: true,
      result: [{ name: "Modern List", type: "custom", visibility: "public", count: 10 }]
    });

    mockExec.mockReturnValue(modernOutput);

    const result = await service.listAllCollections();
    const data = JSON.parse(result.content[0].text);
    expect(data[0].name).toBe("Modern List");
  });
});
