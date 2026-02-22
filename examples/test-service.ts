import { PlaceService } from "../src/place-service.js";
import { execSync } from "child_process";

/**
 * PlaceService 整合測試
 * 測試在各種瀏覽器服務狀態下的報錯是否符合預期。
 */
async function testPlaceService() {
  const service = new PlaceService();
  console.log("🧪 Testing PlaceService Integration...");

  // 測試 1: 瀏覽器未連線時的報錯
  console.log("\n[Test 1] Testing Service when no tabs are active...");
  try {
    const result = await service.listAllCollections();
    console.log("Result:", JSON.stringify(result, null, 2));
    if (result.content[0].text.includes("BROWSER_NO_ACTIVE_TABS")) {
      console.log("✅ Success: Correct error message for missing tabs.");
    } else {
      console.log("❌ Failed: Unexpected result for missing tabs.");
    }
  } catch (e) {
    console.log("❌ Failed: Service threw an unhandled exception.");
  }

  // 測試 2: 模擬 JSON 解析與清洗 (單元測試形式)
  console.log("\n[Test 2] Testing JSON cleaning logic...");
  try {
    const dirtyOutput = `
Config warnings:
- some warning here
│
◇  Decorative line
├──────────────────
{
  "ok": true,
  "result": "test-data"
}
`;
    // @ts-ignore: Accessing private method for testing
    const cleaned = service.cleanJson(dirtyOutput);
    const parsed = JSON.parse(cleaned);
    if (parsed.result === "test-data") {
      console.log("✅ Success: JSON cleaned and parsed correctly.");
    } else {
      console.log("❌ Failed: JSON cleaning did not return expected data.");
    }
  } catch (e: any) {
    console.log(`❌ Failed: JSON cleaning threw error: ${e.message}`);
  }

  console.log("\n🏁 Integration test suite completed.");
}

testPlaceService().catch(console.error);
