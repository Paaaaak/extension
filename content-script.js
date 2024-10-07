(function () {
  const overlayId = "overlay";

  // 이미 투명 배경이 존재하는지 확인
  const existingOverlay = document.getElementById(overlayId);

  if (existingOverlay) {
    // 이미 배경이 존재하면 제거
    existingOverlay.remove();
  } else {
    // 배경이 없으면 새로 생성하고 추가
    const overlay = document.createElement("div");
    overlay.id = overlayId; // ID 설정
    overlay.className = "overlay";
    document.body.appendChild(overlay);
  }
})();
