import { PlaceService } from "./place-service.js";

describe("PlaceService", () => {
  let service: PlaceService;

  beforeEach(() => {
    service = new PlaceService();
  });

  test("listAllCollections should return tool content with script", async () => {
    const result = await service.listAllCollections();
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Script:");
    expect(result.content[0].text).toContain("google.com");
  });

  test("getPlacesFromCollection should return tool content with id-specific script", async () => {
    const collectionId = "my-test-id";
    const result = await service.getPlacesFromCollection(collectionId);
    expect(result.content[0].text).toContain(collectionId);
    expect(result.content[0].text).toContain("scrollTo");
  });
});
