import { GoogleMapsWrapper } from "./browser-wrapper.js";

async function testMissingIdError() {
  const wrapper = new GoogleMapsWrapper();
  
  try {
    await wrapper.init();
    console.log("🧪 Testing Missing ID Strictness...");

    console.log("📡 Fetching collections and validating ID presence...");
    try {
      const collections = await wrapper.listCollections();
      
      const missingId = collections.find(c => !c.id);
      if (missingId) {
        console.log(`❌ Error: Found a collection without ID: ${missingId.name}`);
      } else {
        console.log(`✅ All ${collections.length} collections have valid IDs.`);
      }
    } catch (e: any) {
      if (e.message.includes("ID_EXTRACTION_FAILED")) {
        console.log(`✅ Correctly caught ID extraction failure: ${e.message}`);
      } else {
        throw e;
      }
    }

  } catch (e: any) {
    console.log(`❌ Unexpected failure: ${e.message}`);
  } finally {
    await wrapper.close();
    console.log("\n🏁 Missing ID test finished.");
  }
}

testMissingIdError().catch(console.error);
