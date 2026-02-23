import { LIST_COLLECTIONS_TEMPLATE, BROWSER_UTILS } from "../src/core/constants.js";

describe("Strict Version Gatekeeper (TDD)", () => {
  const runTemplateInMock = (html: string) => {
    const mockDocument = {
      body: { innerText: "some content" },
      querySelector: (s: string) => {
        if (s === 'div[role="main"]' && html.includes('role="main"')) return {};
        return null;
      },
      querySelectorAll: (s: string) => {
        if (s === 'div.m6QErb' && html.includes('m6QErb')) {
          const className = html.match(/class="([^"]+)"/)?.[1] || "";
          return [{ className }];
        }
        return [];
      }
    };

    const detectorMatch = BROWSER_UTILS.match(/const detectVersion = \(\) => \{([\s\S]*?)\};/);
    const detectorBody = detectorMatch ? detectorMatch[1] : "";
    
    // 將 Array.from(document.querySelectorAll(...)) 模擬
    const detectVersion = new Function('document', 'Array', detectorBody);
    return detectVersion(mockDocument, Array);
  };

  test("should return UNKNOWN when no features match", () => {
    const unknownHtml = '<div class="something-new"></div>';
    expect(runTemplateInMock(unknownHtml)).toBe("UNKNOWN");
  });

  test("should detect Flow A", () => {
    const legacyHtml = '<div role="main"></div>';
    expect(runTemplateInMock(legacyHtml)).toBe("A");
  });

  test("should detect Flow B", () => {
    const modernHtml = '<div class="m6QErb WNBkOb XiKgde"></div>';
    expect(runTemplateInMock(modernHtml)).toBe("B");
  });
});
