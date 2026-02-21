import { GoogleMapsWrapper } from "./browser-wrapper.js";

describe("GoogleMapsWrapper Script Generation", () => {
  let wrapper: GoogleMapsWrapper;

  beforeEach(() => {
    wrapper = new GoogleMapsWrapper();
  });

  test("navigationUrl should be correct", () => {
    expect(wrapper.navigationUrl).toBe("https://www.google.com/maps/");
  });

  test("listCollectionsScript should contain core logic", () => {
    const script = wrapper.listCollectionsScript;
    expect(script).toContain("google.com");
    expect(script).toContain('div[role="main"]');
    expect(script).toContain("已儲存");
    expect(script).toContain("AUTH_REQUIRED");
    expect(script).toContain("PARSE_ERROR");
  });

  test("getPlacesScript should contain scrolling and parsing logic", () => {
    const script = wrapper.getPlacesScript("test-collection-id");
    expect(script).toContain("collectionId"); // 腳本內部使用的是參數名稱，字串拼接
    expect(script).toContain("scrollTo");
    expect(script).toContain("expectedCount");
    expect(script).toContain("DATA_INCONSISTENCY");
    expect(script).toContain("STATUS_MISSING");
    expect(script).toContain("CATEGORY_MISSING");
  });
});
