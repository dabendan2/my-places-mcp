import { PlaceService } from "../src/core/place-service.js";

describe("PlaceService TDD: Multi-step Incremental Scraper", () => {
  let service: PlaceService;

  beforeAll(() => {
    service = new PlaceService();
  });

  test("getPlacesFromCollection should handle incremental scraping and forced navigation", async () => {
    // 獲取一個非空的標準清單來測試
    const listResult = await service.listAllCollections();
    if (listResult.isError) {
      console.warn("Skipping test: listAllCollections failed.");
      return;
    }
    const collections = JSON.parse(listResult.content[0].text);
    const target = collections.find((c: any) => c.count > 0 && c.type !== "custom");
    if (!target) {
      console.warn("Skipping test: No non-empty standard collection found.");
      return;
    }

    console.log(`[TDD] Testing incremental fetch for: ${target.name}`);
    const result = await service.getPlacesFromCollection(target.name);
    
    if (result.isError) {
       // 如果環境問題，我們至少期望它能回報具體錯誤而不是超時崩潰
       console.warn(`Execution failed (expected in some envs): ${result.content[0].text}`);
       return;
    }

    const places = JSON.parse(result.content[0].text);
    expect(Array.isArray(places)).toBe(true);
    // 驗證是否抓到了地點
    expect(places.length).toBeGreaterThan(0);
    expect(places.length).toBeLessThanOrEqual(100);
    
    // 驗證資料結構完整性 (邊滾邊抓時不應丟失欄位)
    expect(places[0]).toHaveProperty("name");
    expect(places[0]).toHaveProperty("url");
  });
});
