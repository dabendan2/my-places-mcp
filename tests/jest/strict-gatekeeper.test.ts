import { LIST_COLLECTIONS_TEMPLATE, BROWSER_UTILS } from "../src/core/constants.js";

describe("Strict Version Gatekeeper (TDD)", () => {
  const runTemplateInMock = (html: string) => {
    const mockDocument = {
      body: { innerText: "some content" },
      querySelector: (s: string) => {
        if (s === 'div[role="main"]' && html.includes('role="main"')) {
          return {
            querySelector: (ss: string) => {
              if (ss === 'button.CsEnBe' && html.includes('CsEnBe')) return {};
              return null;
            }
          };
        }
        if (s === '.XiKgde, .WNBkOb' && (html.includes('XiKgde') || html.includes('WNBkOb'))) return {};
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

    const detectorMatch = BROWSER_UTILS.match(/const detectFlow = \(\) => \{([\s\S]*?)\};/);
    const detectorBody = detectorMatch ? detectorMatch[1] : "";
    
    // 將 Array.from(document.querySelectorAll(...)) 模擬
    const detectFlow = new Function('document', 'Array', detectorBody);
    return detectFlow(mockDocument, Array);
  };

  test("should return UNKNOWN when no features match", () => {
    const unknownHtml = '<div class="something-new"></div>';
    expect(runTemplateInMock(unknownHtml)).toBe("UNKNOWN");
  });

  test("should detect Flow A", () => {
    const legacyHtml = '<div role="main"><button class="CsEnBe"></button></div>';
    expect(runTemplateInMock(legacyHtml)).toBe("A");
  });

  test("should detect Flow B", () => {
    const modernHtml = '<div class="XiKgde"></div>';
    expect(runTemplateInMock(modernHtml)).toBe("B");
  });
});
