export var Child = function (
    id,
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
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type;

    this.speed = speed;
    this.walkingSpeed = walkingSpeed;

    this.dx = Math.random() < 0.5 ? -this.walkingSpeed : this.walkingSpeed;

    this.isSitting = false;
    this.isDragging = false;
    this.isFalling = false;
    this.isMouseOn = false;

    this.offsetX = 0;
    this.offsetY = 0;
    this.currentFrame = 0;
    this.frameCount = 6;
    this.frameWidth = images.idleL.width / this.frameCount;
    this.lastFrameTime = 0;
    this.frameDuration = 100;
    this.ctx = ctx;
    this.canvas = canvas;
    this.images = images;
    this.randomState = "walk"; // 초기 상태는 sitting
    this.nextStateChange = 4000; // 다음 상태 변경 시간
};

Child.prototype.setRandomState = function () {
    let randomTime;
    this.currentFrame = 0;

    if (this.randomState === "walk") {
        const randomValue = Math.random();
        if (randomValue < 0.5) {
            this.randomState = "walk";
            this.dx = Math.random() < 0.5 ? -this.walkingSpeed : this.walkingSpeed;
            randomTime = 5000;
        } else {
            this.randomState = "idle";
            randomTime = 5000;
        }
    } else if (this.randomState === "idle") {
        const randomValue = Math.random();
        if (randomValue < 0.5) {
            this.randomState = "walk";
            randomTime = 5000;
        } else {
            this.randomState = "idle";
            randomTime = 5000;
        }
    }

    // 다음 상태 변경 타이머 설정
    this.nextStateChange = Date.now() + randomTime;
};

Child.prototype.draw = function (status = null) {
    let imageToDraw = this.getImageByStatus(status);

    // 이미지 원본 비율 계산
    const imageAspectRatio = imageToDraw.width / this.frameCount / imageToDraw.height;

    // 이미지의 캔버스 크기 계산
    const imageWidth = this.radius * 1.1; // 원하는 너비
    const imageHeight = imageWidth / imageAspectRatio; // 원본 비율에 따른 높이 계산

    // 이미지의 Y 좌표를 캔버스 바닥에 맞춤
    const canvasHeight = this.ctx.canvas.height; // 캔버스 높이
    const yPosition = canvasHeight - imageHeight; // 바닥에 맞춘 Y 좌표

    this.ctx.drawImage(
        imageToDraw,
        this.currentFrame * (imageToDraw.width / this.frameCount), // sx
        0, // sy
        imageToDraw.width / this.frameCount, // sWidth
        imageToDraw.height, // sHeight
        this.x - this.radius, // dx
        yPosition, // dy
        imageWidth, // dWidth
        imageHeight // dHeight
    );
};

// 상태에 따른 이미지 선택 로직 분리
Child.prototype.getImageByStatus = function (status) {
    let a = null;
    const left = this.dx > 0;
    if (status === "idle") {
        a = left ? "idleR" : "idleL";
    } else {
        a = left ? "walkR" : "walkL";
    }

    return this.images[a];
};

// 공통 프레임 업데이트 로직
Child.prototype.updateFrame = function (currentTime, frameDuration) {
    if (currentTime - this.lastFrameTime >= frameDuration) {
        this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        this.lastFrameTime = currentTime;
    }
};

// 캔버스 초기화
Child.prototype.clearCanvas = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

// 상태별 업데이트 로직 분리
Child.prototype.handleState = function (currentTime) {
    if (this.isDragging) {
        this.handleStatic();
    } else if (this.isFalling) {
        this.handleFalling();
    } else if (this.isMouseOn) {
        this.handleStatic();
    } else {
        this.handleRandomState(currentTime);
    }
};

Child.prototype.handleStatic = function () {
    this.clearCanvas();
    this.draw();
};

Child.prototype.handleShowUp = function () {
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

Child.prototype.handleRandomState = function (currentTime) {
    // this.clearCanvas();
    this.y = this.canvas.height - this.radius;

    if (this.randomState === "walk") {
        this.x += this.dx;
        if (this.x > this.canvas.width || this.x < 0) {
            this.dx = this.x > this.canvas.width ? -this.walkingSpeed : this.walkingSpeed;
        }
        this.updateFrame(currentTime, 200);
        this.draw("walk");
    } else if (this.randomState === "idle") {
        this.updateFrame(currentTime, 200);
        this.draw("idle");
    }
};

// 메인 업데이트 함수
Child.prototype.update = function (currentTime) {
    this.handleState(currentTime);

    // 상태 전환 타이머
    if (Date.now() >= this.nextStateChange) {
        this.setRandomState();
    }

    // requestAnimationFrame(this.update.bind(this));
};

Child.prototype.resize = function () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
};

Child.prototype.followParent = function (parent, minDistance) {
    const distance = this.getDistanceTo(parent);

    if (distance > minDistance) {
        this.randomState = "walk";
        this.dx = parent.x - this.x < 0 ? -this.walkingSpeed : this.walkingSpeed;
    } else {
        this.update();
    }
};

Child.prototype.getDistanceTo = function (otherCapybara) {
    const dx = this.x - otherCapybara.x;
    const dy = this.y - otherCapybara.y;
    return Math.sqrt(dx * dx + dy * dy);
};