import { GoogleMapsWrapper } from "./browser-wrapper.js";

async function runTests() {
  const wrapper = new GoogleMapsWrapper();

  // Test Case 1: Uninitialized call
  console.log("🧪 Test 1: Calling without initialization...");
  try {
    await wrapper.listCollections();
  } catch (e: any) {
    console.log(`✅ Caught expected error: ${e.message}`);
  }

  // Test Case 2: Initialization and Fetching
  console.log("\n🧪 Test 2: Normal initialization and fetching...");
  try {
    await wrapper.init();
    console.log("📡 Initialized. Fetching collections...");
    const collections = await wrapper.listCollections();
    console.log(`📊 Found ${collections.length} collections.`);
    
    if (collections.length > 0) {
      console.log(`📍 Fetching places from: ${collections[0].name}...`);
      const places = await wrapper.getPlaces(collections[0].name);
      console.log(`✅ Found ${places.length} places.`);
    }
  } catch (e: any) {
    console.log(`❌ Test 2 failed: ${e.message}`);
  }

  // Test Case 3: Connection Loss (Simulated by closing browser)
  console.log("\n🧪 Test 3: Detecting connection loss...");
  try {
    await wrapper.close();
    console.log("💀 Browser closed. Attempting to fetch...");
    await wrapper.listCollections();
  } catch (e: any) {
    console.log(`✅ Caught expected connection loss error: ${e.message}`);
  }

  console.log("\n🏁 All tests finished.");
}

runTests().catch(console.error);
