import { jest } from "@jest/globals";
import { PlaceService } from "../src/core/place-service.js";

describe("PlaceService (Fully Mocked Unit Test)", () => {
  let service: PlaceService;
  let mockSpawn: any;

  beforeEach(() => {
    service = new PlaceService();
    mockSpawn = jest.fn();
    service._spawn = mockSpawn as any;
    
    (service as any).browserManager = {
      checkBrowserStatus: jest.fn().mockReturnValue({ profile: "mock-profile", targetId: "mock-target" })
    };
  });

  test("should parse legacy collections correctly from mock output", async () => {
    const mockOutput = JSON.stringify({
      ok: true,
      result: [
        { name: "Test List", type: "custom", visibility: "私人", count: 10 }
      ]
    });

    mockSpawn.mockReturnValue({
      status: 0,
      stdout: Buffer.from(mockOutput),
      stderr: Buffer.from("")
    });

    const result = await service.listAllCollections();
    
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data[0].name).toBe("Test List");
    expect(data[0].count).toBe(10);
  });

  test("should handle CLI execution failure gracefully", async () => {
    mockSpawn.mockReturnValue({
      status: 1,
      stdout: Buffer.from(""),
      stderr: Buffer.from("Some error detail")
    });

    const result = await service.listAllCollections();
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error: Some error detail");
  });
});
