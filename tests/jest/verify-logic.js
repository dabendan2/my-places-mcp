import { JSDOM } from "jsdom";
import { LIST_COLLECTIONS_TEMPLATE, BROWSER_UTILS } from "../src/core/constants.js";

async function test() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { document, window } = dom.window;
  const sleep = (m) => Promise.resolve();

  const runTemplate = async (template) => {
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
    return await fn(document, window, sleep);
  };

  console.log("Testing LEGACY version...");
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
  const legacyResult = await runTemplate(LIST_COLLECTIONS_TEMPLATE);
  if (legacyResult.some(i => i.name === "Legacy List")) {
    console.log("✅ LEGACY OK");
  } else {
    console.error("❌ LEGACY FAILED", legacyResult);
    process.exit(1);
  }

  console.log("Testing MODERN version...");
  document.body.innerHTML = `
    <div role="main">
      <button>
        <div class="Io6YTe">Modern List</div>
        <div class="gSkmPd">私人·10 個地點</div>
        <div class="google-symbols"></div>
      </button>
    </div>
    <button>已儲存</button>
  `;
  const modernResult = await runTemplate(LIST_COLLECTIONS_TEMPLATE);
  if (modernResult.some(i => i.name === "Modern List")) {
    console.log("✅ MODERN OK");
  } else {
    console.error("❌ MODERN FAILED", modernResult);
    process.exit(1);
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
