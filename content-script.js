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

  // 공의 속성
  const ball = {
    x: canvas.width * Math.random(), // 공의 초기 위치 (X 좌표)
    y: canvas.height, // 공의 초기 위치 (Y 좌표)
    radius: 30, // 공의 반지름
    color: "red", // 공의 색상
    speed: 2, // 공이 이동하는 속도
    dx: 2, // 공의 X축 방향 이동 속도
    isMoving: true, // 공이 움직이고 있는지 여부
  };

  // 공을 그리는 함수
  function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); // 공 그리기
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
  }

  // 애니메이션을 업데이트하는 함수
  function update() {
    if (ball.isMoving) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임 지우기

      // 공의 새로운 위치 계산
      ball.x += ball.dx;

      // 공이 화면 끝에 도달하면 반대 방향으로 이동
      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1; // 이동 방향 반전
      }

      // 공을 그리기
      drawBall();
    }

    // 애니메이션을 다시 요청
    requestAnimationFrame(update);
  }

  // 애니메이션 시작
  update();

  // 공 주위에서만 공 멈추기
  document.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // 마우스와 공 사이의 거리 계산
    const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);

    // 마우스가 공의 반지름 내에 있을 경우 공을 멈춤
    if (distance < ball.radius * 2) {
      ball.isMoving = false;
    } else {
      ball.isMoving = true;
    }
  });
})();
