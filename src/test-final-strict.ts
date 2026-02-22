import { PlaceService } from "./place-service.js";

async function runStrictTest() {
  const service = new PlaceService();
  console.log("🚀 Starting Strict Navigation & Extraction Test...");
  
  try {
    console.log("--- Step 1: Execute getPlacesFromCollection('Hanoi') ---");
    const result = await service.getPlacesFromCollection("Hanoi");
    
    if (result.isError) {
       console.error("❌ Service reported an error:", (result.content[0] as any).text);
       process.exit(1);
    }

    const data = JSON.parse((result.content[0] as any).text);
    console.log(`✅ Success! Extracted ${data.length} places.`);
    
    if (data.length > 0) {
      console.log("--- Sample Place ---");
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.warn("⚠️ List extracted but it was empty.");
    }
  } catch (e: any) {
    console.error("💥 CRITICAL_TEST_FAILURE:", e.message);
    process.exit(1);
  }
}

runStrictTest().catch(console.error);
