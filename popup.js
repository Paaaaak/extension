document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");

  // Retrieve the activation state from chrome storage
  // chrome.storage.sync.get(["isActive"], function (result) {
  //   toggle.checked = result.isActive || false; // Set the checkbox state
  // });

  // // Update the activation state on toggle
  // toggle.addEventListener("change", function () {
  //   const isActive = toggle.checked;
  //   chrome.storage.sync.set({ isActive });

  //   // Notify content scripts of the state change
  //   chrome.tabs.query({}, function (tabs) {
  //     tabs.forEach((tab) => {
  //       chrome.tabs.sendMessage(tab.id, { isActive });
  //     });
  //   });
  // });

  const parents = document.querySelectorAll(".popup__parent");
  const children = document.querySelectorAll(".popup__child");

  let activeParent = null; // 기본 활성화된 Parent
  const activeChildren = new Set();

  // Parent 클릭 이벤트 핸들러
  parents.forEach((parent) => {
    parent.addEventListener("click", () => {
      const parentId = parent.id;

      if (parent.classList.contains("active")) {
        // Deactivate the currently active parent
        parent.classList.remove("active");
        activeParent = null; // Clear the active parent
      } else {
        // Deactivate any previously active parent
        const currentlyActive = document.querySelector(".popup__parent.active");
        if (currentlyActive) {
          currentlyActive.classList.remove("active");
        }

        // Activate the clicked parent
        parent.classList.add("active");
        activeParent = parentId;
      }

      // Save the updated state to Chrome Storage
      saveToStorage();
    });
  });

  // Child 클릭 이벤트 핸들러
  children.forEach((child) => {
    child.addEventListener("click", () => {
      const childId = child.id;

      if (child.classList.contains("active")) {
        // 이미 활성화된 Child를 비활성화
        child.classList.remove("active");
        activeChildren.delete(childId);
      } else {
        // 새로운 Child를 활성화
        child.classList.add("active");
        activeChildren.add(childId);
      }

      // Chrome Storage에 저장
      saveToStorage();
    });
  });

  // 활성화된 Parent와 Children을 Chrome Storage에 저장
  function saveToStorage() {
    const data = {
      activeParent,
      activeChildren: Array.from(activeChildren),
    };

    chrome.storage.sync.set({ activeData: data }, () => {
      console.log("Active data saved to sync:", data);
    });
  }

  // 페이지 로드 시 Chrome Storage에서 데이터 가져오기
  chrome.storage.sync.get("activeData", (result) => {
    if (result.activeData) {
      const { activeParent: storedParent, activeChildren: storedChildren } =
        result.activeData;

      // Parent 상태 복원
      if (storedParent) {
        // document.querySelector(".popup__parent.active").classList.remove("active");
        document
          .getElementById(storedParent.toLowerCase())
          .classList.add("active");
        activeParent = storedParent;
      }

      // Children 상태 복원
      storedChildren.forEach((childId) => {
        const child = document.getElementById(childId);
        if (child) {
          child.classList.add("active");
          activeChildren.add(childId);
        }
      });
    }
  });

  // Chrome Storage 변경 시 UI 업데이트
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.activeData) {
      const { activeParent: newParent, activeChildren: newChildren } =
        changes.activeData.newValue;

      // Parent 상태 업데이트
      if (newParent && newParent !== activeParent) {
        document.querySelector(".parent.active").classList.remove("active");
        document
          .getElementById(newParent.toLowerCase())
          .classList.add("active");
        activeParent = newParent;
      }

      // Children 상태 업데이트
      const newActiveChildren = new Set(newChildren || []);
      activeChildren.forEach((childId) => {
        if (!newActiveChildren.has(childId)) {
          document.getElementById(childId)?.classList.remove("active");
          activeChildren.delete(childId);
        }
      });
      newActiveChildren.forEach((childId) => {
        if (!activeChildren.has(childId)) {
          document.getElementById(childId)?.classList.add("active");
          activeChildren.add(childId);
        }
      });
    }
  });
});

// Handle Tab Switching
document.querySelectorAll(".popup__tab").forEach((tab) => {
  tab.addEventListener("click", (event) => {
    // Remove active class from all tabs
    document
      .querySelectorAll(".popup__tab")
      .forEach((t) => t.classList.remove("active"));

    // Hide all tab contents
    document
      .querySelectorAll(".popup__tab-content")
      .forEach((content) => content.classList.add("hidden"));

    // Activate the clicked tab
    const targetTab = event.target;
    targetTab.classList.add("active");

    // Show the corresponding content
    const targetContentId = targetTab.getAttribute("data-tab");
    document.getElementById(targetContentId).classList.remove("hidden");
  });
});

const mainInput = document.getElementById("main-input");
const resultContainer = document.getElementById("result-container");

// 입력값 처리 함수
function handleInput() {
  const value = mainInput.value.trim();
  if (value === "") return; // 빈 값은 무시

  // 새 값 추가
  addValueToList(value);

  // 값 저장
  saveValueToStorage(value);

  // 입력 필드 비우기
  mainInput.value = "";
}

// 값 추가 함수
function addValueToList(value) {
  const item = document.createElement("div");
  item.className = "result-item";

  // 텍스트 표시
  const text = document.createElement("span");
  text.textContent = value;

  // 삭제 버튼 생성
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "X";
  deleteButton.className = "delete-button";
  deleteButton.onclick = () => {
    item.remove();
    removeValueFromStorage(value);
  };

  // 아이템 추가
  item.appendChild(text);
  item.appendChild(deleteButton);
  resultContainer.appendChild(item);
}

// 스토리지에 값 저장
function saveValueToStorage(value) {
  chrome.storage.local.get({ sitefilter: [] }, (result) => {
    const sitefilter = result.sitefilter;
    if (!sitefilter.includes(value)) {
      sitefilter.push(value);
      chrome.storage.local.set({ sitefilter });
    }
  });
}

// 스토리지에서 값 제거
function removeValueFromStorage(value) {
  chrome.storage.local.get({ sitefilter: [] }, (result) => {
    const sitefilter = result.sitefilter.filter((v) => v !== value);
    chrome.storage.local.set({ sitefilter });
  });
}

// 스토리지에서 값 불러오기
function loadValuesFromStorage() {
  chrome.storage.local.get({ sitefilter: [] }, (result) => {
    result.sitefilter.forEach((value) => {
      addValueToList(value);
    });
  });
}

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  loadValuesFromStorage();
});

// 이벤트 설정
mainInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleInput();
  }
});

mainInput.addEventListener("blur", () => {
  handleInput();
});

document.querySelector(".popup-tooltip-img").addEventListener("click", () => {
  const tooltip = document.querySelector(".popup-tooltip");
  tooltip.classList.toggle("visible");
});

document.querySelector(".popup-tooltip-img2").addEventListener("click", () => {
  const tooltip = document.querySelector(".popup-tooltip2");
  tooltip.classList.toggle("visible");
});
