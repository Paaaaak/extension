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

  // 이미지 로드
  const rightImage = new Image();
  rightImage.src = chrome.runtime.getURL("sheep-right.png"); // 오른쪽 이미지 경로 설정

  const leftImage = new Image();
  leftImage.src = chrome.runtime.getURL("sheep-left.png"); // 왼쪽 이미지 경로 설정

  // Ball 클래스로 변환
  class Ball {
    constructor(x, y, radius, color, speed, dx, gravity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.speed = speed;
      this.dx = Math.random() < 0.5 ? -0.5 : 0.5; // 50% 확률로 음수 또는 양수
      this.gravity = gravity;
      this.isMoving = true;
      this.isDragging = false;
      this.isFalling = false;
      this.isMouseOn = false;
      this.offsetX = 0;
      this.offsetY = 0;

      this.currentFrame = 0; // 현재 프레임 변수 추가
      this.frameCount = 8; // 스프라이트의 총 프레임 수
      this.frameWidth = rightImage.width / this.frameCount; // 프레임 너비 계산
      this.lastFrameTime = 0; // 마지막 프레임 시간
      this.frameDuration = 50; // 프레임 변경 시간 (밀리초)
    }

    // 공을 그리는 메서드
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();

      // 스프라이트 이미지 선택 (이동 방향에 따라)
      const imageToDraw = this.dx > 0 ? rightImage : leftImage; // dx가 양수면 오른쪽 이미지, 음수면 왼쪽 이미지

      // 공 위에 이미지 그리기 (중앙에 배치)
      const imageSize = this.radius * 2; // 이미지 크기를 공 크기에 맞게 설정

      ctx.drawImage(
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
    }

    // 공의 상태 업데이트 메서드
    update(currentTime) {
      if (this.isDragging) {
        this.color = "green";
        return; // 드래그 중일 때는 위치를 업데이트하지 않음
      } else if (this.isFalling) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임 지우기

        this.color = "blue";

        // 중력 적용하여 아래로 떨어짐
        this.y += this.speed;

        if (this.y + this.radius >= canvas.height) {
          this.isFalling = false;
          this.isMoving = true;
          this.isMouseOn = false;
          this.y = canvas.height;

          // dx를 랜덤하게 설정 (음수 또는 양수)
          this.dx = Math.random() < 0.5 ? -0.5 : 0.5; // 50% 확률로 음수 또는 양수
        } else {
          this.speed += this.gravity;
        }

        this.draw();

      } else if (this.isMouseOn) {
        this.color = "yellow";
        this.draw();

      } else if (this.isMoving) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임 지우기

        this.color = "transparent";

        // 공의 위치 업데이트
        this.y = canvas.height - this.radius;
        this.x += this.dx;

        // 좌우 화면 끝에 도달하면 반대 방향으로 이동
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
          this.dx *= -1; // 이동 방향 반전
        }

        // 프레임 변경 로직
        if (currentTime - this.lastFrameTime >= this.frameDuration) {
          this.currentFrame = (this.currentFrame + 1) % this.frameCount; // 프레임 변경
          this.lastFrameTime = currentTime; // 현재 시간을 마지막 프레임 시간으로 업데이트
        }

        this.draw();
      }

      // 애니메이션을 다시 요청
      requestAnimationFrame(this.update.bind(this));
    }
  }

  // Ball 인스턴스 생성
  const ball = new Ball(
    canvas.width * Math.random(), // 공의 초기 X 좌표
    canvas.height, // 공의 초기 Y 좌표
    30, // 반지름
    "red", // 색상
    1, // 속도
    0.5, // X축 이동 속도
    0.1 // 중력 값
  );

  // 애니메이션 시작
  ball.update();

  // 공 주위에서만 공 멈추기
  document.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    if (!ball.isDragging) {
      const distance = Math.sqrt(
        (mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2
      );

      if (distance < ball.radius * 2) {
        ball.isMoving = false;
        ball.isMouseOn = true;
      } else {
        ball.isMoving = true;
        ball.isMouseOn = false;
      }
    }
  });

  // 공을 클릭하면 드래그 시작
  document.addEventListener("mousedown", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);

    if (distance < ball.radius) {
      e.preventDefault();
      e.stopPropagation();
      ball.isDragging = true;
      ball.offsetX = mouseX - ball.x;
      ball.offsetY = mouseY - ball.y;
      ball.isMoving = false;
    }
  });

  // 마우스 움직임에 따라 공을 드래그
  document.addEventListener("mousemove", (e) => {
    if (ball.isDragging) {
      e.preventDefault();
      e.stopPropagation();
      ball.x = e.clientX - ball.offsetX;
      ball.y = e.clientY - ball.offsetY;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ball.draw();
    }
  });

  // 마우스를 놓으면 드래그 종료 및 공이 아래로 떨어짐
  document.addEventListener("mouseup", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);

    if (distance < ball.radius) {
      e.preventDefault();
      e.stopPropagation();
      ball.isDragging = false;
      ball.isMoving = false;
      ball.isFalling = true;
      ball.speed = 2;
      ball.dx = 0;
      ball.update();
    }
  });
})();
