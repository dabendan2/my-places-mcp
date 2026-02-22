import { GoogleMapsWrapper } from "../src/core/browser-wrapper.js";
import { ErrorCode } from "../src/core/types.js";

describe("GoogleMapsWrapper (Contract Tests)", () => {
  let wrapper: GoogleMapsWrapper;

  beforeEach(() => {
    wrapper = new GoogleMapsWrapper();
  });

  test("listCollectionsScript should extract name and type without id", () => {
    const script = wrapper.listCollectionsScript;
    expect(script).toContain("Io6YTe"); // Name selector
    expect(script).toContain("starred"); // Type check
  });

  test("getPlacesScript should accept collection name", () => {
    const name = "想去的地點";
    const script = wrapper.getPlacesScript(name);
    expect(script).toContain(name);
  });

  test("generated scripts should contain necessary ErrorCodes", () => {
    const allScripts = wrapper.listCollectionsScript + wrapper.getPlacesScript("test");
    const requiredCodes = [
      ErrorCode.AUTH_REQUIRED,
      ErrorCode.SIDEBAR_NOT_FOUND,
      ErrorCode.COLLECTION_NOT_FOUND,
      ErrorCode.PARSE_ERROR,
      ErrorCode.DATA_INCONSISTENCY
    ];

    requiredCodes.forEach(code => {
      expect(allScripts).toContain(code);
    });
  });
});
