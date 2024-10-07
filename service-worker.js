chrome.action.onClicked.addListener((tab) => {
  // 현재 탭에 content script를 실행
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content-script.js"],
  });
});
