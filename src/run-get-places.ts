import { PlaceService } from "./place-service.js";

async function run() {
  const service = new PlaceService();
  console.log("Calling getPlacesFromCollection('Hanoi')...");
  const result = await service.getPlacesFromCollection("Hanoi");
  console.log("Result:", JSON.stringify(result, null, 2));
}

run().catch(console.error);
