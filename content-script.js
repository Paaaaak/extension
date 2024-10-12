(function () {
  const canvasId = "backgroundCanvas";
  const existingCanvas = document.getElementById(canvasId);

  // 기존 canvas가 있다면 삭제
  if (existingCanvas) {
    existingCanvas.remove();
    return;
  }

  // 새로운 canvas 생성
  const canvas = document.createElement("canvas");
  canvas.id = canvasId;

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

  const rightImageSrc = chrome.runtime.getURL("capybara-walking-right.png");
  const leftImageSrc = chrome.runtime.getURL("capybara-walking-left.png");
  const sittingLeftSrc = chrome.runtime.getURL("sitting-left.png");
  const sittingRightSrc = chrome.runtime.getURL("sitting-right.png");
  const sleepingLeftSrc = chrome.runtime.getURL("sleeping-left.png");
  const sleepingRightSrc = chrome.runtime.getURL("sleeping-right.png");

  Promise.all([loadImage(rightImageSrc), loadImage(leftImageSrc), loadImage(sittingRightSrc), loadImage(sittingLeftSrc), loadImage(sleepingRightSrc), loadImage(sleepingLeftSrc)])
    .then((images) => {
      startAnimation(images);
    })
    .catch((error) => {
      console.error("이미지 로드 오류:", error);
    });

  function startAnimation(images) {
    const capybara = new Capybara(
      canvas.width * Math.random(),
      canvas.height,
      45, // 반지름
      "red", // 색상
      1, // 속도
      ctx,
      canvas,
      images
    );

    // 애니메이션 시작
    capybara.update();

    // 공 주위에서만 공 멈추기
    document.addEventListener("mousemove", (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      if (!capybara.isDragging) {
        const distance = Math.sqrt(
          (mouseX - capybara.x) ** 2 + (mouseY - capybara.y) ** 2
        );

        if (distance < capybara.radius * 2) {
          capybara.isMoving = false;
          capybara.isMouseOn = true;
        } else {
          capybara.isMoving = true;
          capybara.isMouseOn = false;
        }
      }
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
        capybara.isMoving = false;
      }
    });

    // 마우스 움직임에 따라 공을 드래그
    document.addEventListener("mousemove", (e) => {
      if (capybara.isDragging) {
        e.preventDefault();
        e.stopPropagation();
        capybara.x = e.clientX - capybara.offsetX;
        capybara.y = e.clientY - capybara.offsetY;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        capybara.animate();
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
        capybara.isMoving = false;

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
})();

var Capybara = function (x, y, radius, color, speed, ctx, canvas, images) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;
  this.speed = speed;
  this.dx = Math.random() < 0.5 ? -0.12 : 0.12; // 50% 확률로 음수 또는 양수
  this.gravity = 0.9;
  this.isMoving = false;
  this.isSitting = false; // 추가: 초기 상태는 sitting 아님
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
  this.nextStateChange = 0; // 다음 상태 변경 시간

  // 상태 전환을 위한 타이머 설정
  this.setRandomState();
};

Capybara.prototype.setRandomState = function () {
  let randomTime;

  if (this.randomState === "moving") {
    const randomValue = Math.random();
    if (randomValue < 0.5) {
      this.randomState = "moving";
      this.dx = Math.random() < 0.5 ? -0.12 : 0.12;
      randomTime = 5000;
    } else {
      this.randomState = "sitting";
      randomTime = 5000;
    }
  } else if (this.randomState === "sitting") {
    const randomValue = Math.random();
    if (randomValue < 0.3) {
      this.randomState = "moving";
      this.dx = Math.random() < 0.5 ? -0.12 : 0.12;
      randomTime = 5000;
    } else if (randomValue < 0.3) {
      this.randomState = "sitting";
      randomTime = 5000;
    } else {
      this.randomState = "sleeping";
      randomTime = 7000; 
    }
  } else if (this.randomState === "sleeping") {
    const randomValue = Math.random();
    if (randomValue < 0.5) {
      this.randomState = "sitting";
      randomTime = 5000;
    } else {
      this.randomState = "sleeping";
      randomTime = 7000; 
    }
  }

  console.log('random state', this.randomState)

  // 다음 상태 변경 타이머 설정
  this.nextStateChange = Date.now() + randomTime;
};

Capybara.prototype.animate = function (status = null) {
  this.ctx.beginPath();
  this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
  this.ctx.fillStyle = this.color;
  this.ctx.fill();
  this.ctx.closePath();

  let imageToDraw;

  if (status === "sitting") {
    imageToDraw = this.dx > 0 ? this.images[2] : this.images[3];
  } else if (status === "sleeping") {
    imageToDraw = this.dx > 0 ? this.images[4] : this.images[5];
  } else {
    imageToDraw = this.dx > 0 ? this.images[0] : this.images[1];
  }
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

Capybara.prototype.update = function (currentTime) {
  if (this.isDragging) {
    this.color = "green";
    return;
  } else if (this.isFallingFromHigh) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.color = "blue";

    this.y += this.speed;
    this.speed += this.gravity;
    this.animate();

    // 화면 하단으로 사라진 경우
    if (this.y > this.canvas.height + 200) {
      console.log("under the sea");

      // 1.5초 후 setRandomState 호출
      if (!this.fallTimeout) {
        this.fallTimeout = setTimeout(() => {
          this.isFallingFromHigh = false;
          this.isMouseOn = false;
          this.isShowUp = true;
          this.y = this.canvas.height - this.radius;
          this.fallTimeout = null; // timeout 초기화
        }, 1500);
      }
    }
  } else if (this.isFalling) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.color = "blue";

    this.y += this.speed;

    if (this.y + this.radius >= this.canvas.height) {
      this.y = this.canvas.height - this.radius;
      this.speed = -this.speed * 0.4;
      if (Math.abs(this.speed) < 1.5) {
        this.isFalling = false;
        this.isMouseOn = false;
        this.isMoving = true;
        this.dx = Math.random() < 0.5 ? -0.12 : 0.12;
      }
    } else {
      this.speed += this.gravity;
    }

    this.animate();
  } else if (this.isShowUp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.y = this.canvas.height - this.radius;
    this.color = "purple";
    this.animate();
    if (!this.fallTimeout) {
      this.fallTimeout = setTimeout(() => {
        this.isShowUp = false;
        this.setRandomState();
        this.fallTimeout = null;
      }, 1500);
    }
  } else if (this.isMouseOn) {
    this.color = "yellow";
    this.animate();
  } else if (this.randomState === "moving") {
    console.log('update')
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.color = "transparent";
    this.y = this.canvas.height - this.radius;
    this.x += this.dx;

    if (this.x > this.canvas.width) {
      this.dx = -0.12;
    }
    if (this.x < 0) {
      this.dx = 0.12;
    }

    this.frameDuration = 100;

    if (currentTime - this.lastFrameTime >= this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameTime = currentTime;
    }

    this.animate("moving");
  } else if (this.randomState === "sitting") {
    console.log('update1')
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.color = "transparent";
    this.y = this.canvas.height - this.radius;

    this.frameDuration = 200;

    if (currentTime - this.lastFrameTime >= this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameTime = currentTime;
    }
    
    this.animate("sitting");
  } else if (this.randomState === "sleeping") {
    console.log('update2')
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.color = "transparent";
    this.y = this.canvas.height - this.radius;

    this.frameDuration = 300;

    if (currentTime - this.lastFrameTime >= this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameTime = currentTime;
    }
    
    this.animate("sleeping");
  }

  // 상태 전환
  if (Date.now() >= this.nextStateChange) {
    this.setRandomState();
  }

  requestAnimationFrame(this.update.bind(this));
};

Capybara.prototype.resize = function () {
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
};
