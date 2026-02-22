import { PlaceService } from "../src/place-service.js";

async function testStrictNavigation() {
  const service = new PlaceService();
  console.log("--- Test: Strict Navigation and Extraction ---");
  
  try {
    // 故意使用一個需要導航的環境執行
    const result = await service.getPlacesFromCollection("Hanoi");
    console.log("Extraction Success!");
    if ((result.content[0] as any).text.length > 100) {
      console.log("Sample Data Received (Truncated):", (result.content[0] as any).text.substring(0, 100) + "...");
    } else {
      console.log("Result:", (result.content[0] as any).text);
    }
  } catch (e: any) {
    console.error(`FAILED: ${e.message}`);
    process.exit(1);
  }
}

testStrictNavigation().catch(console.error);
