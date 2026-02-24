import { LIST_COLLECTIONS_TEMPLATE } from "../src/core/constants.js";

describe("Google Maps Template - Version Adaptive Logic (TDD)", () => {
  test("should handle MODERN UI when Legacy elements are missing", async () => {
    // 驗證模板是否包含新版邏輯關鍵字
    expect(LIST_COLLECTIONS_TEMPLATE).toContain("detectFlow"); 
    expect(LIST_COLLECTIONS_TEMPLATE).toContain("個地點");
  });

  test("should handle icon filtering in modern mode", () => {
    expect(LIST_COLLECTIONS_TEMPLATE).toContain("replace(/^[\\u2000-\\uFFFF]/");
  });
});
