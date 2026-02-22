import { ErrorCode } from "./types.js";

export const BROWSER_UTILS = `
  const sleep = m => new Promise(r => setTimeout(r, m));
  
  const ensureSavedList = async () => {
    // [STRICT_WAIT]: 既然上層 PlaceService 已經透過 browser navigate 強制跳轉並等待完成
    // 此處腳本僅需專注於尋找按鈕與開啟側邊欄
    
    let savedBtn = null;
    for (let i = 0; i < 10; i++) {
      savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('已儲存') || 
        b.getAttribute('aria-label')?.includes('已儲存') || 
        b.getAttribute('aria-label')?.includes('Saved')
      );
      if (savedBtn) break;
      await sleep(1000);
    }

    if (!savedBtn) throw new Error("${ErrorCode.SIDEBAR_NOT_FOUND}: MISSING_SAVED_BTN");

    savedBtn.click();
    
    let sidebar = null;
    for (let i = 0; i < 10; i++) {
      sidebar = document.querySelector('div[role="main"]');
      if (sidebar && (document.body.innerText.includes("你的地點") || document.body.innerText.includes("Your lists"))) break;
      await sleep(1000);
    }

    if (!sidebar) throw new Error("${ErrorCode.SIDEBAR_NOT_FOUND}: PANEL_TIMEOUT");
    return sidebar;
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
      let retry = 0;
      while (retry < 15) {
        scrollable.scrollTo(0, scrollable.scrollHeight);
        await sleep(2000);
        let currentCount = document.querySelectorAll('div[role="main"] button.SMP2wb.fHEb6e').length;
        if (currentCount >= expectedCount && expectedCount > 0) break;
        if (currentCount === lastCount) retry++;
        else {
          retry = 0;
          lastCount = currentCount;
        }
      }
    }

    const items = Array.from(document.querySelectorAll('div[role="main"] button.SMP2wb.fHEb6e'));
    const places = items.map(item => {
      const name = item.querySelector('.Io6YTe')?.innerText || item.innerText.split('\\n')[0];
      if (!name || ["分享", "新增地點", "更多選項", "路線", "返回", "刪除"].includes(name)) return null;

      const infoText = item.innerText || "";
      const statusMatch = infoText.match(/(已歇業|暫停營業|營業中|地點已不存在|暫時關閉|永久歇業)/);
      
      // 改進類別提取邏輯
      const categoryMatch = infoText.split('\\n').find(line => 
         line.includes('·') && !line.match(/\\d+\\.\\d+/) && !line.match(/\\(\\d+,?\\d*\\)/)
      ) || infoText.split('\\n').pop();

      return {
        name: name.trim(),
        url: "https://www.google.com/maps/search/" + encodeURIComponent(name.trim()),
        status: statusMatch ? statusMatch[0] : (infoText.includes("地點已不存在") ? "地點已不存在" : "營業中"),
        category: categoryMatch ? categoryMatch.replace(/·/g, '').trim() : "未知",
        note: "名稱索引版自動提取"
      };
    }).filter(p => p !== null);

    // 嚴格模式：數量必須完全吻合
    if (places.length !== expectedCount) {
       throw new Error("${ErrorCode.DATA_INCONSISTENCY}: Expected " + expectedCount + " but found " + places.length);
    }

    return places;
  })()
`;
