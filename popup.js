document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggle");

  // Retrieve the activation state from chrome storage
  chrome.storage.sync.get(["isActive"], function (result) {
    toggle.checked = result.isActive || false; // Set the checkbox state
  });

  // Update the activation state on toggle
  toggle.addEventListener("change", function () {
    const isActive = toggle.checked;
    chrome.storage.sync.set({ isActive });

    // Notify content scripts of the state change
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { isActive });
      });
    });
  });
});
