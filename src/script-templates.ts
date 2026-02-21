import { ErrorCode } from "./types.js";

export const BROWSER_UTILS = `
  const sleep = m => new Promise(r => setTimeout(r, m));
  
  const ensureSavedList = async () => {
    if (!window.location.hostname.includes("google.com")) {
      window.location.href = "https://www.google.com/maps/";
      return null;
    }
    
    let sidebar = document.querySelector('div[role="main"]');
    if (!sidebar || !document.body.innerText.includes("你的地點")) {
      const savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('已儲存') || b.getAttribute('aria-label')?.includes('已儲存')
      );
      
      if (savedBtn) {
        savedBtn.click();
        await sleep(2000);
      } else {
        return null;
      }
    }
    return document.querySelector('div[role="main"]');
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
    checkAuth();
    const sidebar = await ensureSavedList();
    if (!sidebar) return "${ErrorCode.NAVIGATING}";

    const listButtons = Array.from(sidebar.querySelectorAll('button.CsEnBe'));
    if (listButtons.length === 0 && !document.body.innerText.includes("你的地點")) {
      throw new Error("${ErrorCode.SIDEBAR_NOT_FOUND}");
    }

    return listButtons.map(btn => {
      const name = btn.querySelector('.Io6YTe')?.innerText || "";
      const info = btn.querySelector('.gSkmPd')?.innerText || "";
      const iconText = btn.querySelector('.google-symbols')?.innerText || "";
      
      let type = "custom";
      if (iconText === "") type = "want_to_go";
      else if (iconText === "") type = "starred";
      else if (iconText === "") type = "favorites";

      const countMatch = info.match(/(\\d+)/);
      const count = countMatch ? parseInt(countMatch[1], 10) : 0;
      const visibility = info.split('·')[0].trim() || "私人";

      if (!name) throw new Error("${ErrorCode.PARSE_ERROR}");

      return {
        name: name.trim(),
        type: type,
        visibility: visibility,
        count: count
      };
    });
  })()
`;

export const GET_PLACES_TEMPLATE = (collectionName: string) => `
  (async () => {
    ${BROWSER_UTILS}
    checkAuth();
    const sidebar = await ensureSavedList();
    if (!sidebar) return "${ErrorCode.NAVIGATING}";

    const listBtn = Array.from(sidebar.querySelectorAll('button.CsEnBe')).find(b => 
      b.querySelector('.Io6YTe')?.innerText.trim() === "${collectionName}"
    );
    
    if (!listBtn) throw new Error("${ErrorCode.COLLECTION_NOT_FOUND}");

    listBtn.click();
    await sleep(2000);

    const expectedCountMatch = document.body.innerText.match(/·\\s*(\\d+)\\s*個地點/) || 
                         document.body.innerText.match(/超過\\s*(\\d+)\\s*個地點/);
    const expectedCount = expectedCountMatch ? parseInt(expectedCountMatch[1], 10) : 0;

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
      if (["分享", "新增地點", "更多選項", "路線", "返回", "刪除"].includes(name)) return null;

      const infoText = item.closest('div')?.innerText || "";
      const statusMatch = infoText.match(/(已歇業|暫停營業|營業中|地點已不存在)/);
      const categoryMatch = infoText.match(/(?:·\\s*|)([\\u4e00-\\u9fa5a-zA-Z\\s]+)$/m);

      return {
        name,
        url: "https://www.google.com/maps/search/" + encodeURIComponent(name),
        status: statusMatch ? statusMatch[0] : "未知",
        category: categoryMatch ? categoryMatch[1].trim() : "未知",
        note: "名稱索引版自動提取"
      };
    }).filter(p => p !== null);

    if (places.length < expectedCount) {
       throw new Error("${ErrorCode.DATA_INCONSISTENCY}");
    }

    return places;
  })()
`;
