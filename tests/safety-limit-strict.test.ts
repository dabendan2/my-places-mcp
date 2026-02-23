import { LIST_COLLECTIONS_TEMPLATE, GET_PLACES_TEMPLATE } from "../src/core/constants.js";

describe("TDD: Safety Limit Implementation", () => {
  test("RED: getPlaces logic should implement a 100-item safety limit", () => {
    // 驗證代碼中是否包含 .slice(0, 100)
    expect(GET_PLACES_TEMPLATE("test")).toContain(".slice(0, 100)");
  });

  test("RED: scrollAndCollect should respect a 100-item limit", () => {
    // 驗證 scroll 邏輯中是否有 100 的限制
    expect(LIST_COLLECTIONS_TEMPLATE).toContain("100");
  });
});
