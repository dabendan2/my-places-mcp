import { PlaceService } from "../src/core/place-service.js";

describe("PlaceService Integration (Live Environment)", () => {
  let service: PlaceService;

  beforeAll(() => {
    service = new PlaceService();
  });

  test("list_all_collections should return valid data if browser is connected and logged in", async () => {
    const result = await service.listAllCollections();
    
    // 檢查是否因為環境未就緒而需要跳過
    if (result.isError) {
      const errorText = result.content[0].text;
      const skipKeywords = [
        "BROWSER_CONNECTION_FAILED",
        "AUTH_REQUIRED",
        "BROWSER_NO_ACTIVE_TABS",
        "SIDEBAR_NOT_FOUND"
      ];

      if (skipKeywords.some(kw => errorText.includes(kw))) {
        console.warn(`[Skipped Integration] Pre-condition not met: ${errorText}`);
        return; // 在 Jest 中直接 return 代表此測試 pass，達到跳過效果
      }
      
      // 若是其他未知錯誤則判定失敗
      throw new Error(`Integration test failed with unexpected error: ${errorText}`);
    }

    // 驗證回傳格式
    const collections = JSON.parse(result.content[0].text);
    expect(Array.isArray(collections)).toBe(true);
    expect(collections.length).toBeGreaterThan(0);

    const validTypes = ["want_to_go", "starred", "favorites", "custom"];
    
    collections.forEach((item: any) => {
      // 驗證欄位合理性
      expect(item).toHaveProperty("name");
      expect(typeof item.name).toBe("string");
      expect(item.name.trim().length).toBeGreaterThan(0);

      expect(item).toHaveProperty("type");
      expect(validTypes).toContain(item.type);

      expect(item).toHaveProperty("visibility");
      expect(typeof item.visibility).toBe("string");

      expect(item).toHaveProperty("count");
      expect(typeof item.count).toBe("number");
      expect(item.count).toBeGreaterThanOrEqual(0);
    });

    // 驗證是否包含所有必要的內建清單
    const standardTypes = ["want_to_go", "starred", "favorites"];
    const foundTypes = collections.map((c: any) => c.type);
    
    standardTypes.forEach(type => {
      expect(foundTypes).toContain(type);
    });

    console.log(`[Success Integration] Found ${collections.length} collections (Verified all standard types: ${standardTypes.join(", ")}).`);
  });
});
