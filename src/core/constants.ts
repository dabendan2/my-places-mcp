export enum ErrorCode {
  AUTH_REQUIRED = "AUTH_REQUIRED",
  SIDEBAR_NOT_FOUND = "SIDEBAR_NOT_FOUND",
  COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
  BROWSER_CONNECTION_FAILED = "BROWSER_CONNECTION_FAILED",
  BROWSER_NO_ACTIVE_TABS = "BROWSER_NO_ACTIVE_TABS",
  PARSE_ERROR = "PARSE_ERROR",
  DATA_INCONSISTENCY = "DATA_INCONSISTENCY",
  ERROR_UNKNOWN_FLOW = "ERROR_UNKNOWN_FLOW",
  FLOW_B_STRUCTURE_CHANGED = "FLOW_B_STRUCTURE_CHANGED"
}

export const BROWSER_UTILS = `
  const sleep = m => new Promise(r => setTimeout(r, m));
  
  const checkAuth = () => {
    if (document.body.innerText.includes("登入") && document.body.innerText.includes("帳號")) {
      throw new Error("${ErrorCode.AUTH_REQUIRED}");
    }
  };

  const navigateToSaved = async () => {
    let savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('已儲存') || b.getAttribute('aria-label')?.includes('已儲存')
    );
    
    if (!savedBtn) {
       const menuBtn = document.querySelector('button#hArSBy, button[aria-label*="選單"]');
       if (menuBtn) {
         menuBtn.click();
         await sleep(1000);
         savedBtn = Array.from(document.querySelectorAll('a, button')).find(el => 
           el.innerText.includes('你的地點') || el.innerText.includes('Your places')
         );
       }
    }
    if (!savedBtn) throw new Error("${ErrorCode.SIDEBAR_NOT_FOUND}: MISSING_SAVED_BTN");
    
    if (savedBtn.tagName === 'A') {
      window.location.href = savedBtn.href;
    } else {
      savedBtn.click();
    }
    await sleep(3000);
  };

  const detectFlow = () => {
    // 優先檢查 Flow B 特徵類別，因為現代版 UI 也常包含 role="main"
    if (document.querySelector('.XiKgde, .WNBkOb')) return 'B';
    
    const mainEl = document.querySelector('div[role="main"]');
    if (mainEl && mainEl.querySelector('button.CsEnBe')) return 'A';
    
    return 'UNKNOWN';
  };

  const scrollAndCollect = async (selector, expectedCount) => {
    const scrollable = Array.from(document.querySelectorAll('div.m6QErb')).find(el => 
      el.classList.contains('dS8AEf') || el.style.overflowY === 'auto'
    );
    if (!scrollable) return;
    
    // TODO: 解決大規模地點抓取導致的 SIGKILL 問題。目前暫時限制為 100 以確保穩定性。
    const SAFETY_LIMIT = 100;
    const finalExpected = expectedCount > 0 ? Math.min(expectedCount, SAFETY_LIMIT) : SAFETY_LIMIT;

    let lastCount = 0;
    let retry = 0;
    while (true) {
      scrollable.scrollTo(0, scrollable.scrollHeight);
      await sleep(2000);
      let currentCount = document.querySelectorAll(selector).length;
      
      if (currentCount >= finalExpected) break;
      
      if (currentCount === lastCount) {
        retry++;
        if (retry >= 3) {
           if (finalExpected > 0 && currentCount < finalExpected) {
             throw new Error("${ErrorCode.DATA_INCONSISTENCY}: STUCK_AT_" + currentCount + "_EXPECTED_" + finalExpected);
           }
           break;
        }
      } else {
        retry = 0;
        lastCount = currentCount;
      }
    }
  };
`;

const FLOW_A = {
  listCollections: `
    const sidebar = document.querySelector('div[role="main"]');
    const items = Array.from(sidebar.querySelectorAll('button.CsEnBe'));
    const results = [];
    
    for (const btn of items) {
      const meta = btn.querySelector('.gSkmPd')?.innerText || "";
      const name = btn.querySelector('.Io6YTe')?.innerText?.trim() || "";
      const symbolChar = btn.querySelector('.google-symbols')?.innerText || "";
      const symbolClasses = btn.querySelector('.google-symbols')?.className || "";
      
      let type = "custom";
      if (symbolClasses.includes('JTqyM') || symbolChar === '') type = "want_to_go";
      else if (symbolClasses.includes('IheHDf') || symbolChar === '') type = "favorites";
      else if (name === "已加星號的地點" || name === "Starred places" || symbolChar === '') type = "starred";

      const countMatch = meta.match(/(\d+)/);
      let count = countMatch ? parseInt(countMatch[1], 10) : -1;

      // 如果抓不到數量且是內建清單，點進去抓取上方標題列的數量
      if (count === -1 && type !== "custom" && name !== "已加星號的地點") {
        btn.click();
        await sleep(1500);
        const headerCountMatch = document.body.innerText.match(/·\\s*(\\d+)\\s*個地點/);
        if (headerCountMatch) {
          count = parseInt(headerCountMatch[1], 10);
        }
        // 回到清單頁面
        const backBtn = document.querySelector('button[aria-label*="返回"], button[aria-label*="Back"]');
        if (backBtn) {
          backBtn.click();
          await sleep(1000);
        } else {
          // 若沒找到返回鍵，重新導航至儲存頁面
          await navigateToSaved();
        }
      }

      results.push({
        name,
        type,
        visibility: meta.includes('·') ? meta.split('·')[0].trim() : (meta.includes('私人') ? '私人' : (meta.trim() || '未知')),
        count,
        flow: "A"
      });
    }
    return results;
  `,
  getPlaces: (name) => `
    const sidebar = document.querySelector('div[role="main"]');
    const listBtn = Array.from(sidebar.querySelectorAll('button.CsEnBe')).find(b => 
      b.querySelector('.Io6YTe')?.innerText.trim() === "${name}"
    );
    if (!listBtn) throw new Error("${ErrorCode.COLLECTION_NOT_FOUND}");
    listBtn.click();
    await sleep(2000);
    const countText = document.body.innerText.match(/·\\s*(\\d+)\\s*個地點/);
    const expected = countText ? parseInt(countText[1], 10) : 0;
    await scrollAndCollect('button.SMP2wb.fHEb6e', expected);
    return Array.from(document.querySelectorAll('button.SMP2wb.fHEb6e')).slice(0, 100).map(item => ({
      name: item.querySelector('.Io6YTe')?.innerText?.trim() || item.innerText.split('\\n')[0],
      url: "https://www.google.com/maps/search/" + encodeURIComponent(item.innerText.split('\\n')[0]),
      flow: "A"
    }));
  `
};

const FLOW_B = {
  listCollections: `
    const sidebars = Array.from(document.querySelectorAll('div.m6QErb.WNBkOb.XiKgde'));
    const sidebar = sidebars.find(s => s.offsetParent !== null && s.querySelectorAll('button').length > 0) || sidebars[0];
    
    if (!sidebar) throw new Error("${ErrorCode.FLOW_B_STRUCTURE_CHANGED}");

    const listButtons = Array.from(sidebar.querySelectorAll('button')).filter(b => 
      b.querySelector('.Io6YTe') || b.querySelector('.gSkmPd')
    );
    if (listButtons.length === 0) throw new Error("${ErrorCode.FLOW_B_STRUCTURE_CHANGED}");
    
    const results = [];
    for (const btn of listButtons) {
      const meta = btn.querySelector('.gSkmPd')?.innerText || "";
      const rawName = btn.querySelector('.Io6YTe')?.innerText?.trim() || btn.innerText.split('\\n').find(l => !/[\\u2000-\\uFFFF]/.test(l))?.trim() || "";
      const name = rawName.replace(/^[\\u2000-\\uFFFF]/, '').trim();
      
      let type = "custom";
      if (name.includes("想去的地點") || name.includes("Want to go") || btn.querySelector('.google-symbols')?.innerText === '') type = "want_to_go";
      else if (name.includes("喜愛的地點") || name.includes("Favorites") || btn.querySelector('.google-symbols')?.innerText === '') type = "favorites";
      else if (name.includes("標記的地點") || name.includes("Starred places") || name.includes("已加星號的地點") || btn.querySelector('.google-symbols')?.innerText === '') type = "starred";

      const countMatch = meta.match(/(\\d+)/);
      let count = countMatch ? parseInt(countMatch[1], 10) : -1;

      if (count === -1 && type !== "custom") {
        btn.click();
        await sleep(1500);
        const headerCountMatch = document.body.innerText.match(/·\\s*(\\d+)\\s*個地點/);
        if (headerCountMatch) {
          count = parseInt(headerCountMatch[1], 10);
        }
        const backBtn = document.querySelector('button[aria-label*="返回"], button[aria-label*="Back"]');
        if (backBtn) {
          backBtn.click();
          await sleep(1000);
        } else {
          await navigateToSaved();
        }
      }

      results.push({
        name,
        type,
        visibility: meta.includes('·') ? meta.split('·')[0].trim() : (meta.includes('私人') ? '私人' : '未知'),
        count,
        flow: "B"
      });
    }
    return results;
  `,
  getPlaces: (name) => `
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => {
      const nameEl = b.querySelector('.Io6YTe');
      const text = nameEl?.innerText || b.innerText;
      return text.includes("${name}");
    });
    
    if (!listBtn) throw new Error("${ErrorCode.COLLECTION_NOT_FOUND}");
    listBtn.click();
    await sleep(3000);
    
    const countText = document.body.innerText.match(/·\\s*(\\d+)\\s*個地點/);
    const expected = countText ? parseInt(countText[1], 10) : 0;
    
    await scrollAndCollect('button.SMP2wb.fHEb6e', expected);

    return Array.from(document.querySelectorAll('button.SMP2wb.fHEb6e')).slice(0, 100).map(item => ({
      name: item.innerText.split('\\n')[0].trim(),
      url: "https://www.google.com/maps/search/" + encodeURIComponent(item.innerText.split('\\n')[0].trim()),
      flow: "B"
    }));
  `
};

export const LIST_COLLECTIONS_TEMPLATE = `
  (async () => {
    ${BROWSER_UTILS}
    checkAuth();
    await navigateToSaved();
    const flow = detectFlow();
    if (flow === 'UNKNOWN') throw new Error("${ErrorCode.ERROR_UNKNOWN_FLOW}");
    if (flow === 'A') {
      ${FLOW_A.listCollections}
    } else {
      ${FLOW_B.listCollections}
    }
  })()
`;

export const GET_PLACES_TEMPLATE = (collectionName: string) => `
  (async () => {
    ${BROWSER_UTILS}
    checkAuth();
    await navigateToSaved();
    const flow = detectFlow();
    if (flow === 'UNKNOWN') throw new Error("${ErrorCode.ERROR_UNKNOWN_FLOW}");
    if (flow === 'A') {
      ${FLOW_A.getPlaces(collectionName)}
    } else {
      ${FLOW_B.getPlaces(collectionName)}
    }
  })()
`;
