import { PlaceService } from "./place-service.js";

/**
 * 嚴格穩定性測試：
 * 1. 驗證強制導航 (maps.google.com)
 * 2. 驗證側邊欄開啟與清單點擊
 * 3. 驗證地點抓取
 */
async function runStrictStabilityTest() {
  const service = new PlaceService();
  console.log("🚀 Starting STRICT Stability Test...");
  
  try {
    console.log("\n--- Task: getPlacesFromCollection('Hanoi') ---");
    const result = await service.getPlacesFromCollection("Hanoi");
    
    if (result.isError) {
       const errorMsg = (result.content[0] as any).text;
       console.error(`❌ FAILED: ${errorMsg}`);
       
       if (errorMsg.includes("Execution context was destroyed")) {
         console.warn("⚠️  Hint: Navigation happened but script wasn't resilient to reload.");
       }
       process.exit(1);
    }

    const places = JSON.parse((result.content[0] as any).text);
    console.log(`✅ SUCCESS: Extracted ${places.length} places.`);
    
    if (places.length > 0) {
      console.log("--- First Place Preview ---");
      console.log(JSON.stringify(places[0], null, 2));
    }
  } catch (e: any) {
    console.error(`💥 CRITICAL ERROR: ${e.message}`);
    process.exit(1);
  }
}

runStrictStabilityTest().catch(console.error);
