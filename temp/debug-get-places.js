import { PlaceService } from '../dist/core/place-service.js';
import { BrowserManager } from '../dist/core/browser-manager.js';

async function debugGetPlaces() {
  const service = new PlaceService();
  const collectionName = "想去的地點";
  
  console.log(`--- Debugging getPlaces for: ${collectionName} ---`);
  
  const result = await service.getPlacesFromCollection(collectionName);
  
  if (result.isError) {
    console.log("Result Error:", result.content[0].text);
    
    const browserManager = service.browserManager; 
    const { profile, targetId } = browserManager.checkBrowserStatus();
    const { execSync } = await import('child_process');
    
    console.log("Inspecting DOM state...");
    const inspectCmd = `openclaw browser --browser-profile ${profile} evaluate --target-id ${targetId} --fn "(() => {
      const buttons = Array.from(document.querySelectorAll('button.SMP2wb.fHEb6e'));
      const allButtons = document.querySelectorAll('button').length;
      const bodyText = document.body.innerText.substring(0, 1000);
      const main = document.querySelector('div[role=\\"main\\"]');
      return JSON.stringify({
        targetSelectorCount: buttons.length,
        totalButtonCount: allButtons,
        bodyPreview: bodyText,
        url: window.location.href,
        hasMain: !!main,
        mainClass: main ? main.className : null
      });
    })()"`;
    
    const inspectOutput = execSync(inspectCmd, { encoding: 'utf8' });
    console.log("Raw Output:", inspectOutput);
  } else {
    console.log("Success! Data:", result.content[0].text.substring(0, 200));
  }
}

debugGetPlaces().catch(console.error);
