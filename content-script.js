// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.isActive) {
    createAnimation();
  } else {
    removeAnimation();
  }
});

// Initial state check on page load
chrome.storage.sync.get(["isActive"], function (result) {
  if (result.isActive) {
    createAnimation();
  } else {
    removeAnimation();
  }
});

let animationId = null;

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

function createAnimation() {
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

  // 이미지 로드 함수
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
    });
  }

  const imageSources = {
    walkRight: chrome.runtime.getURL("images/capybara/walking-r.png"),
    walkLeft: chrome.runtime.getURL("images/capybara/walking-l.png"),
    sitRight: chrome.runtime.getURL("images/capybara/sitting-r.png"),
    sitLeft: chrome.runtime.getURL("images/capybara/sitting-l.png"),
    sleepRight: chrome.runtime.getURL("images/capybara/sleeping-r.png"),
    sleepLeft: chrome.runtime.getURL("images/capybara/sleeping-l.png"),
    moveToSitRight: chrome.runtime.getURL(
      "images/capybara/sitting-transition-r.png"
    ),
    moveToSitLeft: chrome.runtime.getURL(
      "images/capybara/sitting-transition-l.png"
    ),
    sitToMoveRight: chrome.runtime.getURL(
      "images/capybara/moving-transition-r.png"
    ),
    sitToMoveLeft: chrome.runtime.getURL(
      "images/capybara/moving-transition-l.png"
    ),
    sitToSleepRight: chrome.runtime.getURL(
      "images/capybara/sleeping-transition-r.png"
    ),
    sitToSleepLeft: chrome.runtime.getURL(
      "images/capybara/sleeping-transition-l.png"
    ),
    sleepToSitRight: chrome.runtime.getURL(
      "images/capybara/sleeping-sitting-transition-r.png"
    ),
    sleepToSitLeft: chrome.runtime.getURL(
      "images/capybara/sleeping-sitting-transition-l.png"
    ),
    childWalkRight: chrome.runtime.getURL("images/child/walking-r.png"),
    childWalkLeft: chrome.runtime.getURL("images/child/walking-l.png"),
    childSitRight: chrome.runtime.getURL("images/child/sitting-r.png"),
    childSitLeft: chrome.runtime.getURL("images/child/sitting-l.png"),
    childSleepRight: chrome.runtime.getURL("images/child/sleeping-r.png"),
    childSleepLeft: chrome.runtime.getURL("images/child/sleeping-l.png"),
    childMoveToSitRight: chrome.runtime.getURL(
      "images/child/sitting-transition-r.png"
    ),
    childMoveToSitLeft: chrome.runtime.getURL(
      "images/child/sitting-transition-l.png"
    ),
    childSitToMoveRight: chrome.runtime.getURL(
      "images/child/moving-transition-r.png"
    ),
    childSitToMoveLeft: chrome.runtime.getURL(
      "images/child/moving-transition-l.png"
    ),
    childSitToSleepRight: chrome.runtime.getURL(
      "images/child/sleeping-transition-r.png"
    ),
    childSitToSleepLeft: chrome.runtime.getURL(
      "images/child/sleeping-transition-l.png"
    ),
    childSleepToSitRight: chrome.runtime.getURL(
      "images/child/sleeping-sitting-transition-r.png"
    ),
    childSleepToSitLeft: chrome.runtime.getURL(
      "images/child/sleeping-sitting-transition-l.png"
    ),
  };

  // Load images using the image source values
  const imagePromises = Object.values(imageSources).map((src) =>
    loadImage(src)
  );

  Promise.all(imagePromises)
    .then((images) => {
      startAnimation(images);
    })
    .catch((error) => {
      console.error("Image load error:", error);
    });

  function startAnimation(images) {
    const capybara = new Capybara(
      canvas.width * Math.random(),
      canvas.height,
      45, // 반지름
      1, // 속도
      0.5,
      ctx,
      canvas,
      images,
      "parent"
    );

    const capybara2 = new Capybara(
      canvas.width * Math.random(),
      canvas.height,
      25, // 반지름
      null, // 속도
      0.2,
      ctx,
      canvas,
      images,
      "child"
    );

    const capybara3 = new Capybara(
      canvas.width * Math.random(),
      canvas.height,
      25, // 반지름
      null, // 속도
      0.3,
      ctx,
      canvas,
      images,
      "child"
    );

    function animate(currentTime) {
      // Clear the canvas before drawing both capybaras
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      capybara.update(currentTime);
      capybara2.update(currentTime);
      capybara3.update(currentTime);

      if (capybara.getDistanceTo(capybara2) > 200) {
        capybara2.followParent(capybara, 200);
      }

      if (capybara.getDistanceTo(capybara3) > 300) {
        capybara3.followParent(capybara, 300);
      }

      animationId = requestAnimationFrame(animate);
    }

    // Start the animation loop
    animationId = requestAnimationFrame(animate);

    // 공 주위에서만 공 멈추기
    document.addEventListener("mousemove", (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      if (!capybara.isDragging) {
        const distance = Math.sqrt(
          (mouseX - capybara.x) ** 2 + (mouseY - capybara.y) ** 2
        );

        if (distance < capybara.radius * 2) {
          capybara.isMouseOn = true;
        } else {
          capybara.isMouseOn = false;
        }
      }
      // Always draw after hover detection
      capybara.draw();
    });

    // 공을 클릭하면 드래그 시작
    document.addEventListener("mousedown", (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const distance = Math.sqrt(
        (mouseX - capybara.x) ** 2 + (mouseY - capybara.y) ** 2
      );

      if (distance < capybara.radius) {
        e.preventDefault();
        e.stopPropagation();
        capybara.isDragging = true;
        capybara.offsetX = mouseX - capybara.x;
        capybara.offsetY = mouseY - capybara.y;
      }
      // Redraw after clicking and setting drag state
      capybara.draw();
    });

    // 마우스 움직임에 따라 공을 드래그
    document.addEventListener("mousemove", (e) => {
      if (capybara.isDragging) {
        e.preventDefault();
        e.stopPropagation();
        capybara.x = e.clientX - capybara.offsetX;
        capybara.y = e.clientY - capybara.offsetY;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        capybara.draw();
      }
    });

    // 마우스를 놓으면 드래그 종료 및 공이 아래로 떨어짐
    document.addEventListener("mouseup", (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const distance = Math.sqrt(
        (mouseX - capybara.x) ** 2 + (mouseY - capybara.y) ** 2
      );

      if (distance < capybara.radius) {
        e.preventDefault();
        e.stopPropagation();
        capybara.isDragging = false;

        if (capybara.y < canvas.height - 500) {
          console.log("is falling from high place");
          capybara.isFallingFromHigh = true;
        } else {
          console.log("is falling from low place");
          capybara.isFalling = true;
        }

        capybara.speed = 2;
        capybara.dx = 0;
        capybara.update();
      }
    });

    window.addEventListener("resize", function () {
      capybara.resize();
    });
  }
}

var Capybara = function (
  x,
  y,
  radius,
  speed,
  walkingSpeed,
  ctx,
  canvas,
  images,
  type
) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.type = type;

  this.speed = speed;
  this.walkingSpeed = walkingSpeed;

  this.dx = Math.random() < 0.5 ? -this.walkingSpeed : this.walkingSpeed;

  this.isSitting = false;
  this.isDragging = false;
  this.isFallingFromHigh = false;
  this.isFalling = false;
  this.isShowUp = false;
  this.isMouseOn = false;

  this.offsetX = 0;
  this.offsetY = 0;
  this.currentFrame = 0;
  this.frameCount = 7;
  this.frameWidth = images[0].width / this.frameCount;
  this.lastFrameTime = 0;
  this.frameDuration = 100;
  this.ctx = ctx;
  this.canvas = canvas;
  this.images = images;
  this.randomState = "moving"; // 초기 상태는 sitting
  this.nextStateChange = 4000; // 다음 상태 변경 시간
};

Capybara.prototype.setRandomState = function () {
  let randomTime;
  this.currentFrame = 0;

  if (this.randomState === "moving") {
    const randomValue = Math.random();
    if (randomValue < 0.5) {
      this.randomState = "moving";
      this.dx = Math.random() < 0.5 ? -this.walkingSpeed : this.walkingSpeed;
      randomTime = 5000;
    } else {
      this.randomState = "sitting-transition";
      randomTime = 480;
    }
  } else if (this.randomState === "sitting-transition") {
    this.randomState = "sitting";
    randomTime = 5000;
  } else if (this.randomState === "sitting") {
    const randomValue = Math.random();
    if (randomValue < 0.3) {
      this.randomState = "moving-transition";
      randomTime = 480;
    } else if (randomValue < 0.3) {
      this.randomState = "sitting";
      randomTime = 5000;
    } else {
      this.randomState = "sleeping-transition";
      randomTime = 480;
    }
  } else if (this.randomState === "sleeping-transition") {
    this.randomState = "sleeping";
    randomTime = 7000;
  } else if (this.randomState === "moving-transition") {
    this.randomState = "moving";
    this.dx = Math.random() < 0.5 ? -this.walkingSpeed : this.walkingSpeed;
    randomTime = 5000;
  } else if (this.randomState === "sleeping") {
    const randomValue = Math.random();
    if (randomValue < 0.5) {
      this.randomState = "sleeping-sitting-transition";
      randomTime = 480;
    } else {
      this.randomState = "sleeping";
      randomTime = 7000;
    }
  } else if ((this.randomState = "sleeping-sitting-transition")) {
    this.randomState = "sitting";
    randomTime = 5000;
  }

  function formatTimeFromDate() {
    const now = new Date(Date.now());
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  // console.log(formatTimeFromDate(), "state:", this.randomState);

  // 다음 상태 변경 타이머 설정
  this.nextStateChange = Date.now() + randomTime;
};

Capybara.prototype.draw = function (status = null) {
  let imageToDraw = this.getImageByStatus(this.type, status);
  const imageSize = this.radius * 2;

  this.ctx.drawImage(
    imageToDraw,
    this.currentFrame * (imageToDraw.width / this.frameCount),
    0,
    imageToDraw.width / this.frameCount,
    imageToDraw.height,
    this.x - this.radius,
    this.y - this.radius,
    imageSize,
    imageSize
  );
};

// 상태에 따른 이미지 선택 로직 분리
Capybara.prototype.getImageByStatus = function (type, status) {
  let statusImageMap = null;
  if (type === "parent") {
    statusImageMap = {
      moving: [0, 1],
      sitting: [2, 3],
      sleeping: [4, 5],
      "sitting-transition": [6, 7],
      "moving-transition": [8, 9],
      "sleeping-transition": [10, 11],
      "sleeping-sitting-transition": [12, 13],
    };
  } else {
    statusImageMap = {
      moving: [14, 15],
      sitting: [16, 17],
      sleeping: [18, 19],
      "sitting-transition": [20, 21],
      "moving-transition": [22, 23],
      "sleeping-transition": [24, 25],
      "sleeping-sitting-transition": [26, 27],
    };
  }

  // Default to 'moving' if status is not found
  const imageIndices = statusImageMap[status] || statusImageMap["moving"];

  // Choose the correct image based on direction (dx)
  return this.images[imageIndices[this.dx > 0 ? 0 : 1]];
};

// 공통 프레임 업데이트 로직
Capybara.prototype.updateFrame = function (currentTime, frameDuration) {
  if (currentTime - this.lastFrameTime >= frameDuration) {
    this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    this.lastFrameTime = currentTime;
  }
};

// 캔버스 초기화
Capybara.prototype.clearCanvas = function () {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

// 상태별 업데이트 로직 분리
Capybara.prototype.handleState = function (currentTime) {
  if (this.isDragging) {
    this.handleStatic();
  } else if (this.isFallingFromHigh) {
    this.handleFallingFromHigh();
  } else if (this.isFalling) {
    this.handleFalling();
  } else if (this.isShowUp) {
    this.handleShowUp();
  } else if (this.isMouseOn) {
    this.handleStatic();
  } else {
    this.handleRandomState(currentTime);
  }
};

// 상태별 처리 로직 리팩토링
Capybara.prototype.handleFallingFromHigh = function () {
  this.clearCanvas();
  this.y += this.speed;
  this.speed += GRAVITY;
  this.draw();

  if (this.y > this.canvas.height + 200 && !this.fallTimeout) {
    this.fallTimeout = setTimeout(() => {
      this.isFallingFromHigh = false;
      this.isShowUp = true;
      this.fallTimeout = null;
    }, 1500);
  }
};

Capybara.prototype.handleFalling = function () {
  this.clearCanvas();
  this.y += this.speed;

  if (this.y + this.radius >= this.canvas.height) {
    this.y = this.canvas.height - this.radius;
    this.speed = -this.speed * 0.4;
    if (Math.abs(this.speed) < 1.5) {
      this.isFalling = false;
      this.isMouseOn = false;
      this.randomState = "moving";
      this.dx = Math.random() < 0.5 ? -this.walkingSpeed : this.walkingSpeed;
    }
  } else {
    this.speed += GRAVITY;
  }
  this.draw();
};

Capybara.prototype.handleStatic = function () {
  this.clearCanvas();
  this.draw();
};

Capybara.prototype.handleShowUp = function () {
  this.clearCanvas();
  this.y = this.canvas.height - this.radius;
  this.draw();

  if (!this.fallTimeout) {
    this.fallTimeout = setTimeout(() => {
      this.isShowUp = false;
      this.setRandomState();
      this.fallTimeout = null;
      this.draw();
    }, 1500);
  }
};

Capybara.prototype.handleRandomState = function (currentTime) {
  // this.clearCanvas();
  this.y = this.canvas.height - this.radius;

  if (this.randomState === "moving") {
    this.x += this.dx;
    if (this.x > this.canvas.width || this.x < 0) {
      this.dx =
        this.x > this.canvas.width ? -this.walkingSpeed : this.walkingSpeed;
    }
    this.updateFrame(currentTime, this.type === "parent" ? 100 : 60);
    this.draw("moving");
  } else if (this.randomState === "sitting-transition") {
    this.updateFrame(currentTime, 80);
    this.draw("sitting-transition");
  } else if (this.randomState === "moving-transition") {
    this.updateFrame(currentTime, 80);
    this.draw("moving-transition");
  } else if (this.randomState === "sleeping-transition") {
    this.updateFrame(currentTime, 80);
    this.draw("sleeping-transition");
  } else if (this.randomState === "sleeping-sitting-transition") {
    this.updateFrame(currentTime, 80);
    this.draw("sleeping-sitting-transition");
  } else if (this.randomState === "sitting") {
    this.updateFrame(currentTime, 200);
    this.draw("sitting");
  } else if (this.randomState === "sleeping") {
    this.updateFrame(currentTime, 300);
    this.draw("sleeping");
  }
};

// 메인 업데이트 함수
Capybara.prototype.update = function (currentTime) {
  this.handleState(currentTime);

  // 상태 전환 타이머
  if (Date.now() >= this.nextStateChange) {
    this.setRandomState();
  }

  // requestAnimationFrame(this.update.bind(this));
};

Capybara.prototype.resize = function () {
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
};

Capybara.prototype.followParent = function (parent, minDistance) {
  const distance = this.getDistanceTo(parent);

  if (distance > minDistance) {
    this.randomState = "moving";
    this.dx = parent.x - this.x < 0 ? -this.walkingSpeed : this.walkingSpeed;
  } else {
    this.update();
  }
};

Capybara.prototype.getDistanceTo = function (otherCapybara) {
  const dx = this.x - otherCapybara.x;
  const dy = this.y - otherCapybara.y;
  return Math.sqrt(dx * dx + dy * dy);
};
