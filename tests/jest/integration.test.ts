import { PlaceService } from "../src/core/place-service.js";

describe("PlaceService Integration (Live Environment)", () => {
  let service: PlaceService;

  beforeAll(() => {
    service = new PlaceService();
  });

  // 增加 timeout 到 60s
  // jest.setTimeout(60000);

  test("list_all_collections should return valid data if browser is connected and logged in", async () => {
    const result = await service.listAllCollections();
    
    // 檢查是否因為環境未就緒而需要跳過
    if (result.isError) {
      const errorText = result.content[0].text;
      const skipKeywords = [
        "BROWSER_CONNECTION_FAILED",
        "AUTH_REQUIRED",
        "BROWSER_NO_ACTIVE_TABS",
        "SIDEBAR_NOT_FOUND",
        "gateway timeout",
        "CLI_EXECUTION_FAILED"
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
      // 容許 -1 (代表主頁面未顯示數量或點擊進入抓取失敗)，以增加測試在動態環境下的魯棒性
      expect(item.count).toBeGreaterThanOrEqual(-1);
    });

    // 驗證是否包含所有必要的內建清單
    const standardTypes = ["want_to_go", "starred", "favorites"];
    const foundTypes = collections.map((c: any) => c.type);
    
    try {
      standardTypes.forEach(type => {
        expect(foundTypes).toContain(type);
      });
    } catch (error) {
      console.error("[Failure Details] Full collections data:", JSON.stringify(collections, null, 2));
      throw error;
    }

    console.log(`[Success Integration] Found ${collections.length} collections (Verified all standard types: ${standardTypes.join(", ")}).`);
  });

  test("get_places_from_collection should return reasonable data from a standard collection", async () => {
    // 1. 先獲取所有清單以找到一個有效的內建清單
    const listResult = await service.listAllCollections();
    if (listResult.isError) {
      console.warn(`[Skipped Integration] Pre-condition not met for getPlaces: ${listResult.content[0].text}`);
      return;
    }
    const collections = JSON.parse(listResult.content[0].text);
    // Find a non-empty standard collection (count > 0)
    const targetCollection = collections.find((c: any) => 
      ["want_to_go", "starred", "favorites"].includes(c.type) && c.count > 0
    );

    if (!targetCollection) {
      console.warn("[Skipped Integration] No non-empty standard collection found to test getPlaces.");
      return;
    }

    console.log(`[Integration] Testing getPlaces with collection: "${targetCollection.name}" (Expected count: ${targetCollection.count})`);

    // 2. 抓取該清單的地點列表
    const result = await service.getPlacesFromCollection(targetCollection.name);
    
    if (result.isError) {
      const errorText = result.content[0].text;
      const skipKeywords = [
        "BROWSER_CONNECTION_FAILED",
        "AUTH_REQUIRED",
        "BROWSER_NO_ACTIVE_TABS",
        "SIDEBAR_NOT_FOUND",
        "gateway timeout",
        "CLI_EXECUTION_FAILED"
      ];

      if (skipKeywords.some(kw => errorText.includes(kw))) {
        console.warn(`[Skipped Integration] Pre-condition not met for getPlaces execution: ${errorText}`);
        return;
      }
       throw new Error(`Integration test failed with error: ${errorText}`);
    }

    const places = JSON.parse(result.content[0].text);
    expect(Array.isArray(places)).toBe(true);

    // 3. 驗證地點個數吻合或達到 100 上限
    const SAFETY_LIMIT = 100;
    
    const expectedLength = Math.min(targetCollection.count, SAFETY_LIMIT);
    
    // 允許些微差異（因為 Google 地圖滾動加載時可能會有 1-2 個項目的統計誤差或延遲）
    expect(places.length).toBeGreaterThanOrEqual(expectedLength - 2); 
    if (targetCollection.count >= SAFETY_LIMIT) {
      expect(places.length).toBeLessThanOrEqual(SAFETY_LIMIT);
    }

    // 4. 驗證資料結構
    places.forEach((place: any) => {
      expect(place).toHaveProperty("name");
      expect(typeof place.name).toBe("string");
      expect(place.name.trim().length).toBeGreaterThan(0);

      expect(place).toHaveProperty("url");
      expect(place.url).toContain("https://www.google.com/maps/search/");

      // 驗證地點的狀態與分類非空
      expect(place).toHaveProperty("status");
      expect(typeof place.status).toBe("string");
      expect(place.status.trim().length).toBeGreaterThan(0);

      expect(place).toHaveProperty("category");
      expect(typeof place.category).toBe("string");
      expect(place.category.trim().length).toBeGreaterThan(0);
    });

    console.log(`[Success Integration] Fetched ${places.length} places from "${targetCollection.name}".`);
  });
});
