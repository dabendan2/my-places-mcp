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

  test("should parse collections correctly from mock output", async () => {
    const mockOutput = JSON.stringify({
      ok: true,
      result: [
        { name: "Test List", type: "custom", visibility: "私人", count: 10 }
      ]
    });

    mockSpawn
      .mockReturnValueOnce({ status: 0, stdout: Buffer.from("Navigated"), stderr: Buffer.from("") })
      .mockReturnValueOnce({ status: 0, stdout: Buffer.from(mockOutput), stderr: Buffer.from("") });

    const result = await service.listAllCollections();
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data[0].name).toBe("Test List");
  });

  test("should handle CLI execution failure and capture debug info", async () => {
    // 1. Mock listAllCollections (navigate) failure
    mockSpawn.mockReturnValueOnce({ status: 1, stdout: Buffer.from(""), stderr: Buffer.from("CLI_ERROR") });
    // 2. Mock screenshot
    mockSpawn.mockReturnValueOnce({ status: 0, stdout: Buffer.from("MEDIA: ~/test.png"), stderr: Buffer.from("") });
    // 3. Mock evaluate (page source)
    mockSpawn.mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ ok: true, result: "<html></html>" }), stderr: Buffer.from("") });

    const result = await service.listAllCollections();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("CLI_ERROR");
  });

  test("getPlacesFromCollection should implement incremental scraping and limit", async () => {
    // 1. navigate
    mockSpawn.mockReturnValueOnce({ status: 0, stdout: Buffer.from("OK"), stderr: Buffer.from("") });
    // 2. evaluate (click collection)
    mockSpawn.mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ ok: true, result: "CLICKED" }), stderr: Buffer.from("") });
    
    // 3. Loop for evaluate (batch scraping)
    // We mock two batches: first 60 items, second 60 items (should hit 100 limit)
    const batch1 = Array(60).fill(0).map((_, i) => ({ name: `Place ${i}`, url: `http://${i}` }));
    const batch2 = Array(60).fill(0).map((_, i) => ({ name: `Place ${i+60}`, url: `http://${i+60}` }));

    mockSpawn
      .mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ ok: true, result: batch1 }), stderr: Buffer.from("") })
      .mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ ok: true, result: batch2 }), stderr: Buffer.from("") });

    const result = await service.getPlacesFromCollection("Test");
    const places = JSON.parse(result.content[0].text);
    expect(places.length).toBe(100);
    expect(places[99].name).toBe("Place 99");
  });
});
