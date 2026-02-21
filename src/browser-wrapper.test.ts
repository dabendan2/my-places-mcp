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
    expect(placesScript).toContain(ErrorCode.DATA_INCONSISTENCY);
    // TDD 修復後，座標點不再拋出缺失錯誤，而是標記為座標
    expect(placesScript).toContain("座標位置");
  });

  test("should include browser utility functions", () => {
    const listScript = wrapper.listCollectionsScript;
    expect(listScript).toContain("const sleep =");
    expect(listScript).toContain("const ensureGoogleMaps =");
    expect(listScript).toContain("const checkAuth =");
  });
});
