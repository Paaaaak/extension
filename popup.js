document.getElementById("action-button").addEventListener("click", () => {
  // 현재 활성 탭 정보를 가져오기
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    // 현재 탭에 content script를 실행
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["content-script.js"],
    });

    // 팝업 닫기 (선택 사항)
    // window.close();
  });
});
