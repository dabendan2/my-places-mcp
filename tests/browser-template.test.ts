import { JSDOM } from "jsdom";
import { LIST_COLLECTIONS_TEMPLATE, BROWSER_UTILS } from "../src/core/constants.js";

describe("Browser Templates (TDD)", () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    window = dom.window;
    // Mock sleep
    (window as any).sleep = () => Promise.resolve();
  });

  const runTemplate = async (template: string) => {
    // Remove the IIFE wrapper to execute in current context
    const code = template
      .trim()
      .replace(/^\(async\s*\(\)\s*=>\s*\{/, '')
      .replace(/\}\)\(\)$/, '');
    
    const fn = new dom.window.Function('document', 'window', 'sleep', `
      ${BROWSER_UTILS}
      return (async () => {
        ${code}
      })();
    `);
    return await fn(document, window, window.sleep);
  };

  test("Flow A: should parse collections using button.CsEnBe", async () => {
    document.body.innerHTML = `
      <div role="main">
        <button class="CsEnBe">
          <span class="Io6YTe">Legacy List</span>
          <span class="gSkmPd">私人 · 5 個地點</span>
          <span class="google-symbols"></span>
        </button>
      </div>
      <button>已儲存</button>
    `;

    const result = await runTemplate(LIST_COLLECTIONS_TEMPLATE);
    expect(result).toContainEqual(expect.objectContaining({ name: "Legacy List", flow: "A" }));
  });

  test("Flow B: should parse collections using container markers", async () => {
    document.body.innerHTML = `
      <div class="m6QErb WNBkOb XiKgde">
        <button>
          <div class="Io6YTe">Modern List</div>
          <div class="gSkmPd">私人·10 個地點</div>
          <div class="google-symbols"></div>
        </button>
      </div>
      <button>已儲存</button>
    `;

    const result = await runTemplate(LIST_COLLECTIONS_TEMPLATE);
    expect(result).toContainEqual(expect.objectContaining({ name: "Modern List", flow: "B" }));
  });
});
