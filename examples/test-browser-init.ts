import { PlaceService } from "../src/place-service.js";

async function testProfileAndDisplay() {
  const service = new PlaceService();
  
  console.log("--- Test 1: getDisplay ---");
  const display = (service as any).getDisplay();
  console.log(`Detected DISPLAY: ${display}`);

  console.log("\n--- Test 2: getActiveProfile ---");
  const profile = (service as any).getActiveProfile();
  console.log(`Current Active Profile: ${profile}`);

  console.log("\n--- Test 3: checkBrowserStatus (Attempt Connection/Start) ---");
  try {
    const finalProfile = (service as any).checkBrowserStatus();
    console.log(`Final Selected Profile: ${finalProfile}`);
  } catch (e: any) {
    console.error(`Check Status Failed: ${e.message}`);
  }
}

testProfileAndDisplay().catch(console.error);
