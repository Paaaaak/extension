
const GRAVITY = 0.9;

export var Parent = function (
    id,
    x,
    y,
    radius,
    speed,
    ctx,
    canvas,
    images,
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
  
    this.speed = speed;
  
    this.isSitting = false;
    this.isDragging = false;
    this.isFalling = false;
  
    this.offsetX = 0;
    this.offsetY = 0;
    this.currentFrame = 0;
    this.frameCount = 7;
    this.frameWidth = images?.idle.width / this.frameCount;
    this.lastFrameTime = 0;
    this.frameDuration = 100;
    this.ctx = ctx;
    this.canvas = canvas;
    this.images = images;
    this.randomState = "moving";
  };
  
  Parent.prototype.setRandomState = function () {
  
    this.randomState = "sitting";
  };
  
  Parent.prototype.draw = function (status = null) {
    let imageToDraw = this.images.idle;
    const imageSize = this.radius * 2;
  
    this.ctx.drawImage(
      imageToDraw,
      this.currentFrame * (imageToDraw.width / this.frameCount), // 원본 이미지의 x 시작점
      0, // 원본 이미지의 y 시작점
      imageToDraw.width / this.frameCount, // 원본 이미지에서 잘라낼 폭
      imageToDraw.height, // 원본 이미지에서 잘라낼 높이
      this.x - this.radius, // 캔버스에 그릴 x 위치
      this.y - this.radius * 1.6, // 캔버스에 그릴 y 위치
      imageSize * 1.5, // 캔버스에 그릴 폭
      imageSize * 1.5 // 캔버스에 그릴 높이
    );
  };
  
  // 공통 프레임 업데이트 로직
  Parent.prototype.updateFrame = function (currentTime, frameDuration) {
    if (currentTime - this.lastFrameTime >= frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameTime = currentTime;
    }
  };
  
  // 캔버스 초기화
  Parent.prototype.clearCanvas = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };
  
  // 상태별 업데이트 로직 분리
  Parent.prototype.handleState = function (currentTime) {
    if (this.isDragging) {
      this.handleStatic();
    } else if (this.isFalling) {
      this.handleFalling();
    } else {
      this.handleRandomState(currentTime);
    }
  };
  
  Parent.prototype.handleFalling = function () {
    this.clearCanvas();
    this.y += this.speed;
  
    if (this.y + this.radius >= this.canvas.height) {
      this.y = this.canvas.height - this.radius;
      this.speed = -this.speed * 0.4;
      if (Math.abs(this.speed) < 1.5) {
        this.isFalling = false;
        this.randomState = "moving";
      }
    } else {
      this.speed += GRAVITY;
    }
    this.draw();
  };
  
  Parent.prototype.handleStatic = function () {
    this.clearCanvas();
    this.draw();
  };
  
  Parent.prototype.handleShowUp = function () {
    this.clearCanvas();
    this.y = this.canvas.height - this.radius;
    this.draw();
  
    if (!this.fallTimeout) {
      this.fallTimeout = setTimeout(() => {
        this.setRandomState();
        this.fallTimeout = null;
        this.draw();
      }, 1500);
    }
  };
  
  Parent.prototype.handleRandomState = function (currentTime) {
    this.y = this.canvas.height - this.radius;
  
    this.updateFrame(currentTime, 200);
    this.draw("sitting");
  };
  
  // 메인 업데이트 함수
  Parent.prototype.update = function (currentTime) {
    this.handleState(currentTime);
  };
  
  Parent.prototype.resize = function () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };
  
  Parent.prototype.getDistanceTo = function (otherCapybara) {
    const dx = this.x - otherCapybara.x;
    const dy = this.y - otherCapybara.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  