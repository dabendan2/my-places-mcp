import { BrowserManager } from '../dist/core/browser-manager.js';
import { execSync } from 'child_process';
import { cleanJson } from '../dist/utils/system.js';

async function testStdinEvaluate() {
  const manager = new BrowserManager();
  const { profile, targetId } = manager.checkBrowserStatus();
  
  const script = `(() => { return { status: "ok", time: Date.now() }; })()`;

  const cmd = `openclaw browser --browser-profile ${profile} evaluate --target-id ${targetId} --fn - --json`;
  
  try {
    const output = execSync(cmd, { 
      input: script,
      encoding: 'utf8' 
    });
    console.log("Result:", JSON.stringify(JSON.parse(cleanJson(output)), null, 2));
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

testStdinEvaluate().catch(console.error);
