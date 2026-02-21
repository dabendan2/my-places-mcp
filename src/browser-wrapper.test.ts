import { GoogleMapsWrapper } from "./browser-wrapper.js";
import { ErrorCode } from "./types.js";

describe("GoogleMapsWrapper (Refactored)", () => {
  let wrapper: GoogleMapsWrapper;

  beforeEach(() => {
    wrapper = new GoogleMapsWrapper();
  });

  test("should generate scripts containing normalized error codes", () => {
    const listScript = wrapper.listCollectionsScript;
    const placesScript = wrapper.getPlacesScript("test-id");

    expect(listScript).toContain(ErrorCode.AUTH_REQUIRED);
    expect(listScript).toContain(ErrorCode.SIDEBAR_NOT_FOUND);
    expect(placesScript).toContain(ErrorCode.COLLECTION_NOT_FOUND);
    expect(placesScript).toContain(ErrorCode.STATUS_MISSING);
    expect(placesScript).toContain(ErrorCode.CATEGORY_MISSING);
    expect(placesScript).toContain(ErrorCode.DATA_INCONSISTENCY);
  });

  test("should include browser utility functions", () => {
    const listScript = wrapper.listCollectionsScript;
    expect(listScript).toContain("const sleep =");
    expect(listScript).toContain("const ensureGoogleMaps =");
    expect(listScript).toContain("const checkAuth =");
  });
});
