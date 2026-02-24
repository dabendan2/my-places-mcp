import { JSDOM } from "jsdom";
import { LIST_COLLECTIONS_TEMPLATE, BROWSER_UTILS } from "../src/core/constants.js";
import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";

describe("Browser Templates (TDD Native)", () => {
  let document: Document;
  let window: any;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    window = dom.window;
  });

  const runTemplate = async (template: string) => {
    const code = template
      .trim()
      .replace(/^\(async\s*\(\)\s*=>\s*\{/, '')
      .replace(/\}\)\(\)$/, '');
    
    // 手動模擬 browser 環境
    if (!('innerText' in (window.HTMLElement.prototype))) {
       Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
         get() { return this.textContent || ""; }
       });
    }

    const wrappedCode = BROWSER_UTILS + '\n' +
      'const document = window.document;\n' +
      'return (async () => {\n' +
        'try {\n' +
        code + '\n' +
        '} catch(e) { return "ERROR: " + e.message + "\\n" + e.stack; }\n' +
      '})();';

    const fn = new window.Function('window', wrappedCode);
    return await fn.call(window, window);
  };

  test("Flow A: should parse collections using button.CsEnBe", async () => {
    document.body.innerHTML = '<div role="main">' +
        '<button class="CsEnBe">' +
          '<span class="Io6YTe">Legacy List</span>' +
          '<span class="gSkmPd">私人 · 5 個地點</span>' +
          '<span class="google-symbols"></span>' +
        '</button>' +
      '</div>' +
      '<button>已儲存</button>';

    const result = await runTemplate(LIST_COLLECTIONS_TEMPLATE);
    if (typeof result === 'string' && result.startsWith("ERROR:")) assert.fail("Template error: " + result);
    assert.ok(result.some((c: any) => c.name === "Legacy List" && c.flow === "A"));
  });

  test("Flow B: should parse collections using container markers", async () => {
    // 模擬 Flow B 環境：多個容器，其中一個有內容
    document.body.innerHTML = 
      '<div class="m6QErb WNBkOb XiKgde" style="display:none"></div>' + // 空容器
      '<div class="m6QErb WNBkOb XiKgde">' + // 有效容器
        '<button>' +
          '<div class="Io6YTe">Modern List</div>' +
          '<div class="gSkmPd">私人·10 個地點</div>' +
          '<div class="google-symbols"></div>' +
        '</button>' +
      '</div>' +
      '<button>已儲存</button>';

    // 模擬 offsetParent 來讓 detectFlow 認為它是可見的
    // JSDOM 不支援 layout，所以 offsetParent 總是 null
    // 我們需要手動 patch
    const containers = document.querySelectorAll('div.m6QErb.WNBkOb.XiKgde');
    Object.defineProperty(containers[1], 'offsetParent', { get: () => document.body });

    const result = await runTemplate(LIST_COLLECTIONS_TEMPLATE);
    if (typeof result === 'string' && result.startsWith("ERROR:")) assert.fail("Template error: " + result);
    assert.ok(result.some((c: any) => c.name === "Modern List" && c.flow === "B"));
  });
});
