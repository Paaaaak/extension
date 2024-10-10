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

  const rightImageSrc = chrome.runtime.getURL("sheep-right.png");
  const leftImageSrc = chrome.runtime.getURL("sheep-left.png");

  Promise.all([loadImage(rightImageSrc), loadImage(leftImageSrc)])
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
      30, // 반지름
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
        capybara.isFalling = true;
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
  this.dx = Math.random() < 0.5 ? -0.5 : 0.5; // 50% 확률로 음수 또는 양수
  this.gravity = 0.1;
  this.isMoving = true;
  this.isDragging = false;
  this.isFalling = false;
  this.isMouseOn = false;
  this.offsetX = 0;
  this.offsetY = 0;
  this.currentFrame = 0; // 현재 프레임 변수 추가
  this.frameCount = 8; // 스프라이트의 총 프레임 수
  this.frameWidth = images[0].width / this.frameCount; // 프레임 너비 계산
  this.lastFrameTime = 0; // 마지막 프레임 시간
  this.frameDuration = 50; // 프레임 변경 시간 (밀리초)
  this.ctx = ctx;
  this.canvas = canvas;
  this.images = images;
};

Capybara.prototype.animate = function () {
  this.ctx.beginPath();
  this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
  this.ctx.fillStyle = this.color;
  this.ctx.fill();
  this.ctx.closePath();

  // 스프라이트 이미지 선택 (이동 방향에 따라)
  const imageToDraw = this.dx > 0 ? this.images[0] : this.images[1]; // dx가 양수면 오른쪽 이미지, 음수면 왼쪽 이미지

  // 공 위에 이미지 그리기 (중앙에 배치)
  const imageSize = this.radius * 2; // 이미지 크기를 공 크기에 맞게 설정

  this.ctx.drawImage(
    imageToDraw,
    this.currentFrame * this.frameWidth, // 스프라이트에서 현재 프레임 위치
    0, // 스프라이트 이미지의 Y 위치 (여기서는 0)
    this.frameWidth, // 프레임 너비
    imageToDraw.height, // 프레임 높이
    this.x - this.radius, // 공 위치 X
    this.y - this.radius, // 공 위치 Y
    imageSize, // 공 크기에 맞춘 이미지 너비
    imageSize // 공 크기에 맞춘 이미지 높이
  );
};

Capybara.prototype.update = function (currentTime) {
  if (this.isDragging) {
    this.color = "green";
    return; // 드래그 중일 때는 위치를 업데이트하지 않음
  } else if (this.isFalling) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // 이전 프레임 지우기

    this.color = "blue";

    // 중력 적용하여 아래로 떨어짐
    this.y += this.speed;

    // 땅에 닿았을 경우
    if (this.y + this.radius >= this.canvas.height) {
      this.isFalling = false;
      this.isMoving = true;
      this.isMouseOn = false;
      this.y = this.canvas.height;

      this.dx = Math.random() < 0.5 ? -0.5 : 0.5;
    } else {
      this.speed += this.gravity;
    }

    this.animate();
  } else if (this.isMouseOn) {
    this.color = "yellow";
    this.animate();
  } else if (this.isMoving) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // 이전 프레임 지우기

    this.color = "transparent";

    // 공의 위치 업데이트
    this.y = this.canvas.height - this.radius;
    this.x += this.dx;

    if (this.x > this.canvas.width) {
      this.dx = -0.5;
    }
    if (this.x < 0) {
      this.dx = 0.5;
    }

    // 프레임 변경 로직
    if (currentTime - this.lastFrameTime >= this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount; // 프레임 변경
      this.lastFrameTime = currentTime; // 현재 시간을 마지막 프레임 시간으로 업데이트
    }

    this.animate();
  }

  // 애니메이션을 다시 요청
  requestAnimationFrame(this.update.bind(this));
};

Capybara.prototype.resize = function () {
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
};
