import { PlaceService } from "../src/core/place-service.js";
import { jest } from "@jest/globals";

describe("PlaceService Strict Gatekeeping (Mocked)", () => {
  let service: PlaceService;
  let mockSpawn: any;

  beforeEach(() => {
    service = new PlaceService();
    mockSpawn = jest.fn();
    service._spawn = mockSpawn as any;
    (service as any).browserManager = {
      checkBrowserStatus: () => ({ profile: "mock", targetId: "mock" })
    };
  });

  test("should throw error when version is UNKNOWN in real execution", async () => {
    // 模擬 CLI 返回一個讓 detectVersion 回傳 UNKNOWN 的 DOM 結構
    const mockOutput = JSON.stringify({
      ok: true,
      error: "ERROR_UNKNOWN_VERSION"
    });

    // 這裡我們預期如果 script 丟出錯誤，parsed.ok 會是 false 
    // 或者我們模擬 script 執行時丟出錯誤的 JSON 回應
    mockSpawn.mockReturnValue({
      status: 0,
      stdout: Buffer.from(JSON.stringify({ ok: false, error: "ERROR_UNKNOWN_VERSION" })),
      stderr: Buffer.from("")
    });

    const result = await service.listAllCollections();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("ERROR_UNKNOWN_VERSION");
  });
});
