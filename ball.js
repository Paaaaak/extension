export class Ball {
  constructor(canvas, x, y, radius = 30, color = "red", speed = 2) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.x = x || canvas.width * Math.random(); // 공의 초기 위치 (X 좌표)
    this.y = y || canvas.height; // 공의 초기 위치 (Y 좌표)
    this.radius = radius; // 공의 반지름
    this.color = color; // 공의 색상
    this.speed = speed; // 공이 이동하는 속도
    this.dx = 2; // 공의 X축 방향 이동 속도
    this.gravity = 0.1; // 중력 값
    this.isMoving = true; // 공이 움직이고 있는지 여부
    this.isDragging = false; // 공이 드래그 중인지 여부
    this.isFalling = false; // 공이 하단으로 떨어지는 중인지 여부
    this.offsetX = 0; // 마우스 클릭 시 공과 마우스의 X축 오프셋
    this.offsetY = 0; // 마우스 클릭 시 공과 마우스의 Y축 오프셋
  }

  // 공을 그리는 메소드
  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
    this.ctx.closePath();
  }

  // 공의 위치 업데이트
  updatePosition() {
    if (!this.isDragging && this.isMoving) {
      this.x += this.dx;
      this.y = this.canvas.height; // 공이 바닥에서 움직이게 설정
      if (
        this.x + this.radius > this.canvas.width ||
        this.x - this.radius < 0
      ) {
        this.dx *= -1; // 벽에 부딪히면 반전
      }
    }
  }

  applyGravity() {
    if (this.isFalling) {
      this.y += this.speed;
      if (this.y + this.radius >= this.canvas.height) {
        this.isFalling = false;
        this.isMoving = true;
        this.y = this.canvas.height;
        this.dx = 2;
      } else {
        this.speed += this.gravity;
      }
    }
  }
}
