import { GoogleMapsWrapper } from "./browser-wrapper.js";

describe("GoogleMapsWrapper (Name-based Indexing)", () => {
  let wrapper: GoogleMapsWrapper;

  beforeEach(() => {
    wrapper = new GoogleMapsWrapper();
  });

  test("listCollectionsScript should extract name and type without id", () => {
    const script = wrapper.listCollectionsScript;
    expect(script).toContain("Io6YTe"); // Name selector
    expect(script).toContain("starred"); // Type check
    expect(script).not.toContain("data-list-id");
  });

  test("getPlacesScript should accept collection name", () => {
    const name = "想去的地點";
    const script = wrapper.getPlacesScript(name);
    expect(script).toContain(name);
  });

  test("Script should handle various navigation states", () => {
    const script = wrapper.listCollectionsScript;
    expect(script).toContain("google.com/maps");
    expect(script).toContain("已儲存");
  });
});
