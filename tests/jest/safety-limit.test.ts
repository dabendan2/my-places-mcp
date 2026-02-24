import { LIST_COLLECTIONS_TEMPLATE, ErrorCode } from "../src/core/constants.js";

describe("TDD: Safety Limit for Large Collections", () => {
  test("getPlaces logic should contain a safety limit of 100", () => {
    // 驗證程式碼中是否存在 100 的安全限制
    // 此測試目前會失敗，因為我還沒加上去
    expect(LIST_COLLECTIONS_TEMPLATE).toContain("100"); 
  });
});
