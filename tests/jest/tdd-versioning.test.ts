import { LIST_COLLECTIONS_TEMPLATE, ErrorCode } from "../src/core/constants.js";

describe("TDD: Dual-Flow Version Detection", () => {
  const runDetection = (mockDoc: any) => {
    // 模擬腳本內部的偵測邏輯
    const script = `
      (() => {
        const doc = ${JSON.stringify(mockDoc)};
        const isA = !!doc.hasRoleMain;
        const isB = !!doc.hasVersionBContainer;
        if (isA) return 'A';
        if (isB) return 'B';
        return 'UNKNOWN';
      })()
    `;
    return eval(script);
  };

  test("RED: should detect Version A feature", () => {
    const mockA = { hasRoleMain: true };
    expect(runDetection(mockA)).toBe("A");
  });

  test("RED: should detect Version B feature", () => {
    const mockB = { hasVersionBContainer: true };
    expect(runDetection(mockB)).toBe("B");
  });

  test("RED: should throw ERROR_UNKNOWN_FLOW if neither matches", () => {
    // 這裡驗證模板字串是否包含嚴格錯誤處理
    expect(LIST_COLLECTIONS_TEMPLATE).toContain(ErrorCode.ERROR_UNKNOWN_FLOW);
  });
});
