import { ErrorCode } from "./types.js";

export const BROWSER_UTILS = `
  const sleep = m => new Promise(r => setTimeout(r, m));
  
  const ensureGoogleMaps = () => {
    if (!window.location.hostname.includes("google.com")) {
      window.location.href = "https://www.google.com/maps/";
      return false;
    }
    return true;
  };

  const checkAuth = () => {
    if (document.body.innerText.includes("登入") && document.body.innerText.includes("帳號")) {
      throw new Error("${ErrorCode.AUTH_REQUIRED}");
    }
  };
`;

export const LIST_COLLECTIONS_TEMPLATE = `
  (async () => {
    ${BROWSER_UTILS}
    if (!ensureGoogleMaps()) return "${ErrorCode.NAVIGATING}";
    
    let sidebar = document.querySelector('div[role="main"]');
    if (!sidebar || !document.body.innerText.includes("已儲存")) {
      const savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('已儲存') || b.getAttribute('aria-label')?.includes('已儲存')
      );
      
      if (savedBtn) {
        savedBtn.click();
      } else {
        const menuBtn = document.querySelector('button#searchbox-hamburger') || document.querySelector('button[aria-label*="選單"]');
        if (menuBtn) {
          menuBtn.click();
          await sleep(1000);
          const menuSavedBtn = Array.from(document.querySelectorAll('span, button')).find(el => 
            el.innerText.includes('您的地點') || el.innerText.includes('已儲存')
          );
          if (menuSavedBtn) menuSavedBtn.click();
        }
      }
      await sleep(2000);
      sidebar = document.querySelector('div[role="main"]');
    }

    checkAuth();
    if (!sidebar) throw new Error("${ErrorCode.SIDEBAR_NOT_FOUND}");

    const buttons = Array.from(sidebar.querySelectorAll('button[aria-label*="地點"]'));
    return buttons.map(btn => {
      const label = btn.getAttribute('aria-label') || "";
      const match = label.match(/^(.+) (私人|已分享|已公開)·(\\d+) 個地點$/);
      
      if (!match) throw new Error("${ErrorCode.PARSE_ERROR}: " + label);

      const id = btn.getAttribute('data-list-id');
      if (!id) throw new Error("${ErrorCode.MISSING_ID}: " + match[1]);

      return {
        id: id,
        name: match[1].trim(),
        visibility: match[2],
        count: parseInt(match[3], 10)
      };
    });
  })()
`;

export const GET_PLACES_TEMPLATE = (collectionId: string) => `
  (async () => {
    ${BROWSER_UTILS}
    if (!ensureGoogleMaps()) return "${ErrorCode.NAVIGATING}";

    let listBtn = document.querySelector('button[data-list-id="${collectionId}"]');
    if (!listBtn) throw new Error("${ErrorCode.COLLECTION_NOT_FOUND}");

    listBtn.click();
    await sleep(2000);

    const header = document.querySelector('div[role="main"] h2');
    const expectedCountMatch = header?.innerText?.match(/·\\s*(\\d+)\\s*個地點/);
    if (!expectedCountMatch) throw new Error("${ErrorCode.PARSE_ERROR}");
    const expectedCount = parseInt(expectedCountMatch[1], 10);

    const scrollable = document.querySelector('div.m6QErb.dS8AEf');
    if (scrollable) {
      let lastCount = 0;
      let currentCount = document.querySelectorAll('div[role="main"] button[aria-label]').length;
      let retry = 0;

      while (currentCount < expectedCount && retry < 10) {
        scrollable.scrollTo(0, scrollable.scrollHeight);
        await sleep(2000);
        lastCount = currentCount;
        currentCount = document.querySelectorAll('div[role="main"] button[aria-label]').length;
        if (currentCount === lastCount) retry++;
        else retry = 0;
      }
    }

    const items = Array.from(document.querySelectorAll('div[role="main"] button[aria-label]'));
    const places = items.map(item => {
      const name = item.getAttribute('aria-label') || "";
      if (["分享", "新增地點", "更多選項", "路線"].includes(name)) return null;

      const infoText = item.closest('div')?.innerText || "";
      const statusMatch = infoText.match(/(已歇業|暫停營業|營業中|地點已不存在)/);
      const categoryMatch = infoText.match(/(?:·\\s*|)([\\u4e00-\\u9fa5a-zA-Z\\s]+)$/m);

      if (!statusMatch) throw new Error("${ErrorCode.STATUS_MISSING}: " + name);
      if (!categoryMatch) throw new Error("${ErrorCode.CATEGORY_MISSING}: " + name);
      
      return {
        name,
        url: "https://www.google.com/maps/search/" + encodeURIComponent(name),
        status: statusMatch[0],
        category: categoryMatch[1].trim(),
        note: "重構版自動提取"
      };
    }).filter(p => p !== null);

    if (places.length !== expectedCount) {
      throw new Error("${ErrorCode.DATA_INCONSISTENCY}");
    }
    return places;
  })()
`;
