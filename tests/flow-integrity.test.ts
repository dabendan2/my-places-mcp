import { LIST_COLLECTIONS_TEMPLATE, BROWSER_UTILS } from "../src/core/constants.js";

describe("Strict Flow Integrity (TDD)", () => {
  const runTemplate = (html: string, version: string) => {
    // 這裡我們模擬執行環境，但重點是測試「邏輯是否分流」
    if (version === 'A') {
      expect(LIST_COLLECTIONS_TEMPLATE).toContain("document.querySelector('div[role=\"main\"]')");
    } else if (version === 'B') {
      expect(LIST_COLLECTIONS_TEMPLATE).toContain("document.querySelectorAll('div.m6QErb')");
    }
  };

  test("LIST_COLLECTIONS should contain Flow A logic", () => {
    runTemplate("", "A");
  });

  test("LIST_COLLECTIONS should contain Flow B logic", () => {
    runTemplate("", "B");
  });

  test("LIST_COLLECTIONS should throw Error when version is UNKNOWN", () => {
    expect(LIST_COLLECTIONS_TEMPLATE).toContain('throw new Error("ERROR_UNKNOWN_FLOW")');
  });
});
