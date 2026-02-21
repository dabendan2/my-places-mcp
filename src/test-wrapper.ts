import { GoogleMapsWrapper } from "./browser-wrapper.js";

async function runTests() {
  const wrapper = new GoogleMapsWrapper();
  console.log("🧪 Comprehensive Error Code Coverage Test");

  const listScript = wrapper.listCollectionsScript;
  const placesScript = wrapper.getPlacesScript("test-id");

  const expectedCodes = [
    // 系統層級
    "NAVIGATING",
    "SIDEBAR_NOT_FOUND",
    // 業務邏輯層級
    "AUTH_REQUIRED",
    "COLLECTION_NOT_FOUND",
    "PARSE_ERROR",
    "MISSING_ID",
    // TDD 修復後已移除 STATUS_MISSING 與 CATEGORY_MISSING，改由容錯標記取代
    "DATA_INCONSISTENCY"
  ];

  const allScripts = listScript + placesScript;
  let missing: string[] = [];

  expectedCodes.forEach(code => {
    if (allScripts.includes(code)) {
      console.log(`✅ Found error code: ${code}`);
    } else {
      console.log(`❌ Missing error code in scripts: ${code}`);
      missing.push(code);
    }
  });

  if (missing.length > 0) {
    console.error(`\n🚨 Failed: The following codes are not implemented in scripts: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log("\n🏁 All defined error codes are present in generated scripts.");
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
