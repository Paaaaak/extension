(async () => {
  const { Parent } = await import(chrome.runtime.getURL("src/js/parent.js"));
  const { Child } = await import(chrome.runtime.getURL("src/js/child.js"));

  let activeParent = null;
  let activeChildren = [];

  let animationId = null;

  // Listen for messages from the popup
  // chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //   if (request.isActive) {
  //     createAnimation();
  //   } else {
  //     removeAnimation();
  //   }
  // });

  // // Initial state check on page load
  // chrome.storage.sync.get(["isActive"], function (result) {
  //   if (result.isActive) {
  //     createAnimation();
  //   } else {
  //     removeAnimation();
  //   }
  // });

  // 현재 사이트가 필터에 포함되었는지 확인
  function isSiteBlocked(callback) {
    chrome.storage.local.get({ sitefilter: [] }, (result) => {
      const sitefilter = result.sitefilter;
      const currentUrl = window.location.hostname; // 현재 사이트의 호스트네임
      let isBlocked = false;
      sitefilter.forEach((blockedSite) => {
        if (currentUrl.includes(blockedSite)) {
          isBlocked = true;
          return;
        }
      });

      console.log(sitefilter, currentUrl, isBlocked);
      callback(isBlocked);
    });
  }

  // 초기 데이터 가져오기
  chrome.storage.sync.get("activeData", (result) => {
    isSiteBlocked((isBlocked) => {
      if (isBlocked) {
        console.log("This site is blocked. Animation will not run.");
        return;
      }

      if (result.activeData) {
        const { activeParent, activeChildren } = result.activeData;

        // 필요한 로직 추가
        createAnimation(activeParent, activeChildren);
      }
    });
  });

  // 스토리지 변경 감지
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.activeData) {
      isSiteBlocked((isBlocked) => {
        if (isBlocked) {
          console.log("This site is blocked. Animation will not run.");
          removeAnimation(); // 애니메이션이 실행 중이면 제거
          return;
        }

        const { activeParent, activeChildren } = changes.activeData.newValue;

        // 필요한 로직 추가
        removeAnimation(); // 기존 애니메이션 제거
        createAnimation(activeParent, activeChildren);
      });
    }
  });

  function removeAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    const canvas = document.getElementById("chrome-extension-canvas");
    if (canvas) {
      canvas.remove();
    }
  }

  function getStorageData(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  function createAnimation(a, b) {
    const GRAVITY = 0.9;

    this.window.GRAVITY = GRAVITY;

    // 새로운 canvas 생성
    const canvas = document.createElement("canvas");
    canvas.id = "chrome-extension-canvas";

    // 창 크기에 맞춰 canvas 크기 설정
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // canvas를 화면에 고정시키고, 스타일 적용
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "1000";
    canvas.style.pointerEvents = "none"; // 클릭 등 이벤트 무시
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const imageSources = {
      parent: {
        default: {
          idle: chrome.runtime.getURL("assets/images/parent/default/house.png"),
        },
      },
      child: {
        pisces: {
          idleR: chrome.runtime.getURL(
            "assets/images/child/pisces/sitting-r.png"
          ),
          idleL: chrome.runtime.getURL(
            "assets/images/child/pisces/sitting-l.png"
          ),
          walkR: chrome.runtime.getURL(
            "assets/images/child/pisces/walking-r.png"
          ),
          walkL: chrome.runtime.getURL(
            "assets/images/child/pisces/walking-l.png"
          ),
        },
        gemini: {
          idleR: chrome.runtime.getURL(
            "assets/images/child/gemini/sitting-r.png"
          ),
          idleL: chrome.runtime.getURL(
            "assets/images/child/gemini/sitting-l.png"
          ),
          walkR: chrome.runtime.getURL(
            "assets/images/child/gemini/walking-r.png"
          ),
          walkL: chrome.runtime.getURL(
            "assets/images/child/gemini/walking-l.png"
          ),
        },
      },
    };

    // 이미지 로드 함수
    function loadImage(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    }

    async function loadAllImages() {
      const loadedImages = { parent: {}, child: {} };

      for (const [parentId, states] of Object.entries(imageSources.parent)) {
        loadedImages.parent[parentId] = {};
        const statePromises = Object.entries(states).map(
          async ([state, src]) => {
            loadedImages.parent[parentId][state] = await loadImage(src);
          }
        );
        await Promise.all(statePromises);
      }

      for (const [childId, states] of Object.entries(imageSources.child)) {
        loadedImages.child[childId] = {};
        const statePromises = Object.entries(states).map(
          async ([state, src]) => {
            loadedImages.child[childId][state] = await loadImage(src);
          }
        );
        await Promise.all(statePromises);
      }

      return loadedImages;
    }

    loadAllImages()
      .then(async (images) => {
        await startAnimation(a, b, images);
      })
      .catch((error) => {
        console.error("Image load error:", error);
      });

    async function startAnimation(parentId, childrenIds, images) {
      try {
        // 스토리지에서 값을 가져오기
        const result = await getStorageData("parentX");
        const canvasWidth = canvas.width;

        if (result.parentX !== undefined) {
          if (result.parentX > canvasWidth) {
            parentX = canvas.width * Math.random(); // 랜덤 값 생성
            chrome.storage.sync.set({ parentX }); // 생성된 값을 스토리지에 저장
          } else {
            parentX = result.parentX; // 저장된 값을 사용
          }
        } else {
          parentX = canvas.width * Math.random(); // 랜덤 값 생성
          chrome.storage.sync.set({ parentX }); // 생성된 값을 스토리지에 저장
        }

        let parent = null;

        const frameHeigthRatioParent = 0.12; // 예: 너비를 캔버스 너비의 10%로 설정
        const frameHeight = canvas.height * frameHeigthRatioParent; // 특정 비율로 높이 설정
        const radius = frameHeight / 2; // 반지름 계산 (높이 기준)

        if (parentId) {
          parent = new Parent(
            parentId,
            parentX,
            canvas.height,
            radius, // 반지름
            0, // 속도
            ctx,
            canvas,
            images["parent"][parentId]
          );
        } else {
          parent = null;
        }

        activeParent = parent;

        const frameHeightRatio = 0.06; // 예: 높이를 캔버스 높이의 10%로 설정
        const frameWidthRatio = 0.1; // 예: 너비를 캔버스 너비의 10%로 설정

        childrenIds.forEach((childId) => {
          const frameHeight = canvas.height * frameHeightRatio; // 특정 비율로 높이 설정
          const frameWidth = canvas.width * frameWidthRatio; // 특정 비율로 너비 설정
          const radius = frameHeight / 2; // 반지름 계산 (높이 기준)

          const min = 0.07;
          const max = 0.1;

          const randomValue = Math.random() * (max - min) + min;

          const child = new Child(
            childId,
            canvas.width * Math.random(),
            canvas.height,
            radius, // 반지름
            null, // 속도
            randomValue,
            ctx,
            canvas,
            images["child"][childId],
            "child"
          );

          activeChildren.push(child);
        });

        // 연기 입자 배열
        const particles = [];

        // 연기 입자 생성 함수
        function createParticle(x, y) {
          const min = -0.3;
          const max = -0.2;
          const randomValue = Math.random() * (max - min) + min;

          return {
            x,
            y,
            size: Math.random() * 1.5 + 3, // 입자 크기
            alpha: 0.7, // 투명도
            speedX: (Math.random() - 0.5) * 0.1, // 좌우 이동 속도
            speedY: randomValue, // 위로 이동 속도
            shrink: 1.005, // 크기 감소율
          };
        }

        // 연기 애니메이션 함수
        function updateAndDrawParticles() {
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            // 입자 속성 업데이트
            p.x += p.speedX;
            p.y += p.speedY;
            p.size *= p.shrink;
            p.alpha -= 0.002; // 점점 투명해짐

            // 입자 그리기
            if (p.alpha > 0) {
              ctx.fillStyle = `rgba(100, 100, 100, ${p.alpha})`; // 연기 색상 (회색)
              ctx.beginPath();
              ctx.ellipse(
                p.x, // 중심 X
                p.y, // 중심 Y
                p.size, // 가로 반지름
                p.size * 0.6, // 세로 반지름 (가로보다 작게)
                0, // 회전각도
                0, // 시작 각도
                Math.PI * 2 // 끝 각도
              );
              ctx.fill();
            } else {
              // 투명도가 0 이하인 입자는 제거
              particles.splice(i, 1);
            }
          }
        }

        let lastParticleTime = 0; // 마지막 입자 생성 시간
        const particleInterval = 800; // 입자 생성 간격 (밀리초, 1초)

        function animate(currentTime) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (parent) {
            parent.update(currentTime);

            // Parent 위에 사각형 그리기
            ctx.fillStyle = "transparent"; // 반투명 빨간색
            const squareSize = 30; // 사각형 크기
            const squareX = parent.x + 43; // 중심 정렬
            const squareY = parent.y - 90; // 중심 정렬
            ctx.fillRect(squareX, squareY, squareSize, squareSize);

            // 연기 입자 생성 (1초에 한 번)
            if (currentTime - lastParticleTime > particleInterval) {
              particles.push(createParticle(squareX + squareSize / 2, squareY));
              lastParticleTime = currentTime; // 마지막 생성 시간 갱신
            }
          }

          // 연기 입자 업데이트 및 그리기
          updateAndDrawParticles();

          activeChildren.forEach((child) => {
            child.update(currentTime);

            if (!parent) {
              return;
            }

            if (parent.getDistanceTo(child) > 200) {
              child.followParent(parent, 200);
            }
          });

          animationId = requestAnimationFrame(animate);
        }

        // Start the animation loop
        animationId = requestAnimationFrame(animate);

        // Parent를 클릭하면 드래그 시작
        document.addEventListener("mousedown", (e) => {
          if (!parent) {
            return;
          }

          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const distance = Math.sqrt(
            (mouseX - parent.x) ** 2 + (mouseY - parent.y) ** 2
          );

          if (distance < parent.radius) {
            e.preventDefault();
            e.stopPropagation();
            parent.isDragging = true;
            parent.offsetX = mouseX - parent.x;
            parent.offsetY = mouseY - parent.y;
          }
          // Redraw after clicking and setting drag state
          parent.draw();
        });

        // 마우스 움직임에 따라 공을 드래그
        document.addEventListener("mousemove", (e) => {
          if (!parent) {
            return;
          }

          if (parent.isDragging) {
            e.preventDefault();
            e.stopPropagation();
            parent.x = e.clientX - parent.offsetX;
            parent.y = e.clientY - parent.offsetY;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            parent.draw();
          }
        });

        // 마우스를 놓으면 드래그 종료 및 공이 아래로 떨어짐
        document.addEventListener("mouseup", (e) => {
          if (!parent) {
            return;
          }

          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const distance = Math.sqrt(
            (mouseX - parent.x) ** 2 + (mouseY - parent.y) ** 2
          );

          if (distance < parent.radius) {
            e.preventDefault();
            e.stopPropagation();
            parent.isDragging = false;

            parent.isFalling = true;

            parent.speed = 2;
            parent.dx = 0;
            parent.update();

            // 데이터 저장
            chrome.storage.sync.set({ parentX: mouseX }, function () {
              console.log(mouseX);
            });
          }
        });

        window.addEventListener("resize", function () {
          if (!parent) {
            return;
          }

          parent.resize();
        });
      } catch (e) {
        console.error("Error fetching or saving data from storage:", e);
      }
    }
  }
})();
