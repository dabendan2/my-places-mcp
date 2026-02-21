import { GoogleMapsWrapper } from "./browser-wrapper.js";

async function testIdStrictness() {
  const wrapper = new GoogleMapsWrapper();
  
  try {
    await wrapper.init();
    console.log("🧪 Testing ID Strictness...");

    // Test Case: Invalid ID (should fail strictly)
    const invalidId = "non-existent-id-123";
    console.log(`📡 Attempting to fetch with invalid ID: ${invalidId}`);
    
    try {
      await wrapper.getPlaces(invalidId);
      console.log("❌ Error: Should have failed but succeeded.");
    } catch (e: any) {
      if (e.message.includes("COLLECTION_NOT_FOUND")) {
        console.log(`✅ Correctly caught strict error: ${e.message}`);
      } else {
        console.log(`❌ Caught wrong error: ${e.message}`);
      }
    }

    // Test Case: Valid workflow (Fetch list first to get real IDs)
    console.log("\n📡 Fetching real collections to get a valid ID...");
    const collections = await wrapper.listCollections();
    
    if (collections.length > 0) {
      const validId = collections[0].id;
      console.log(`✅ Found valid ID: ${validId}. Attempting fetch...`);
      const places = await wrapper.getPlaces(validId);
      console.log(`✅ Successfully fetched ${places.length} places using exact ID match.`);
    } else {
      console.log("⚠️ No collections found to test valid ID flow.");
    }

  } catch (e: any) {
    console.log(`❌ Unexpected failure: ${e.message}`);
  } finally {
    await wrapper.close();
    console.log("\n🏁 Strict ID tests finished.");
  }
}

testIdStrictness().catch(console.error);
