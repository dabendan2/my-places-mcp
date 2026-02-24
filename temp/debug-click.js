import { PlaceService } from '../dist/core/place-service.js';
import { BrowserManager } from '../dist/core/browser-manager.js';
import { LIST_COLLECTIONS_TEMPLATE } from '../dist/core/constants.js';

async function debugCollectionFlow() {
  const service = new PlaceService();
  const manager = new BrowserManager();
  
  console.log("--- Starting Debug Flow ---");
  
  // 1. 執行列表抓取
  const result = await service.listAllCollections();
  if (result.isError) {
    console.error("List failed:", result.content[0].text);
    return;
  }
  
  const collections = JSON.parse(result.content[0].text);
  console.log(`Found ${collections.length} collections.`);
  
  // 2. 找出 count 為 -1 的清單 (通常是需要點擊進去的)
  const needsClick = collections.filter(c => c.count === -1);
  console.log(`Collections needing detail click: ${needsClick.length}`);
  needsClick.forEach(c => console.log(`- ${c.name} (${c.type})`));

  if (needsClick.length === 0) {
    console.log("No collections found with count -1. Trying a random one to force click logic.");
  }
  
  // 3. 檢查 openclaw.json 是否有更新
  console.log("--- Config Check ---");
  const { execSync } = await import('child_process');
  console.log(execSync('openclaw status', { encoding: 'utf8' }));
}

debugCollectionFlow().catch(console.error);
