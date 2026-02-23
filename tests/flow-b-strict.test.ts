import { LIST_COLLECTIONS_TEMPLATE, ErrorCode } from "../src/core/constants.js";

describe("TDD: Flow B Structural Integrity", () => {
  test("Flow B should NOT use semantic text filtering for list buttons", () => {
    // 驗證 Flow B 的實作代碼中不包含語義關鍵字如 '個地點' 或 'places'
    // 這些關鍵字目前應該只出現在註釋或被移除的路徑中
    const flowBScript = LIST_COLLECTIONS_TEMPLATE.split('} else {')[1];
    expect(flowBScript).not.toContain("innerText.includes('個地點')");
    expect(flowBScript).not.toContain("innerText.includes('places')");
    
    // 驗證是否使用了結構化選擇器
    // 注意：目前的實作 detectFlow 使用了結構化判斷，我們確保範本中包含版本 B 的關鍵特徵
    expect(flowBScript).toContain("className.includes('WNBkOb')");
    expect(flowBScript).toContain("className.includes('XiKgde')");
  });

  test("Flow B should throw FLOW_B_STRUCTURE_CHANGED if structural elements are missing", () => {
    expect(LIST_COLLECTIONS_TEMPLATE).toContain(ErrorCode.FLOW_B_STRUCTURE_CHANGED);
  });
});
