(async () => {
  const sleep = m => new Promise(r => setTimeout(r, m));
  
  const waitForElement = async (selector, timeout = 15000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el) return true;
      await sleep(500);
    }
    return false;
  };

  const detectFlow = () => {
    if (document.querySelector('div[role="main"]')) return 'A';
    if (document.querySelector('div.m6QErb.dS8AEf.XiKgde')) return 'B';
    if (document.querySelector('div.m6QErb.XiKgde')) return 'B';
    return 'UNKNOWN';
  };

  const result = {
    initialFlow: detectFlow(),
    navStarted: false,
    listRendered: false,
    finalFlow: 'UNKNOWN',
    url: window.location.href
  };

  let savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
    b.innerText.includes('已儲存') || b.getAttribute('aria-label')?.includes('已儲存')
  );
  
  if (savedBtn) {
    result.navStarted = true;
    if (savedBtn.tagName === 'A') {
      window.location.href = savedBtn.href;
    } else {
      savedBtn.click();
    }
    
    // 等待列表按鈕出現 (Flow A/B 通用的關鍵元素)
    result.listRendered = await waitForElement('button.CsEnBe, div.m6QErb.XiKgde button');
    result.finalFlow = detectFlow();
  }
  
  result.url = window.location.href;
  return result;
})()