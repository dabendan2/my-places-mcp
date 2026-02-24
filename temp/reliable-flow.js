import { BrowserManager } from '../dist/core/browser-manager.js';
import { execSync } from 'child_process';
import { cleanJson } from '../dist/utils/system.js';

async function experimentReliableFlow() {
  const manager = new BrowserManager();
  const { profile, targetId } = manager.checkBrowserStatus();
  
  const script = `
(async () => {
  const sleep = m => new Promise(r => setTimeout(r, m));
  
  const savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
    b.innerText.includes('已儲存') || b.getAttribute('aria-label')?.includes('已儲存')
  );

  if (savedBtn) {
    savedBtn.click();
    await sleep(5000);
  }

  // 遍歷所有 role="main" 的元素並回傳類別與子元素摘要
  const mains = Array.from(document.querySelectorAll('[role="main"]')).map(el => ({
    tagName: el.tagName,
    className: el.className,
    childButtons: el.querySelectorAll('button').length,
    textPreview: el.innerText.substring(0, 100).replace(/\\n/g, ' ')
  }));

  // 遍歷所有 m6QErb 的元素
  const containers = Array.from(document.querySelectorAll('div.m6QErb')).map(el => ({
    className: el.className,
    childButtons: el.querySelectorAll('button').length,
    textPreview: el.innerText.substring(0, 100).replace(/\\n/g, ' ')
  }));

  return { mains, containers, url: window.location.href };
})()
  `.trim();

  const cmd = `openclaw browser --browser-profile ${profile} evaluate --target-id ${targetId} --fn - --json`;
  
  try {
    const output = execSync(cmd, { 
      input: script,
      encoding: 'utf8' 
    });
    console.log("Experiment Result:", JSON.stringify(JSON.parse(cleanJson(output)), null, 2));
  } catch (e) {
    console.error("Exec failed:", e.message);
  }
}

experimentReliableFlow().catch(console.error);
