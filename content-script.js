(function () {
  const overlayId = "overlay2cdacaq313g";
  const existingOverlay = document.getElementById(overlayId);

  if (existingOverlay) {
    // Existing overlay found, remove circles and the overlay
    const circles = document.querySelectorAll(".circle");
    circles.forEach((circle) => circle.remove());
    existingOverlay.remove(); // Remove the overlay
  } else {
    // Create and add a new overlay
    const overlay = document.createElement("div");
    overlay.id = overlayId; // Set ID
    overlay.className = "overlay2cdacaq313g";
    overlay.style.position = "fixed"; // Make overlay fixed
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    document.body.appendChild(overlay);

    overlay.addEventListener("click", () => {
      console.log("workworkwor");
    });

    // Create 50 circles
    for (let i = 0; i < 50; i++) {
      createRandomCircle();
    }
  }

  function createRandomCircle() {
    const circle = document.createElement("div");
    const size = Math.random() * 70 + 30; // Size: 30px ~ 100px
    const color = getRandomColor(); // Random color

    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.backgroundColor = color;
    circle.style.borderRadius = "50%"; // Make it circular
    circle.style.position = "absolute"; // Use absolute positioning
    circle.className = "circle"; // Add class name
    circle.style.pointerEvents = "none"; // Ignore click events
    circle.style.zIndex = 9999;
    circle.style.cursor = "pointer";

    // Add hover effect
    circle.addEventListener("mouseover", () => {
      console.log("work");
    });

    circle.addEventListener("mouseout", () => {
      console.log("work2");
    });

    // Randomly choose an edge to place the circle
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;

    switch (edge) {
      case 0: // Top
        x = Math.random() * (window.innerWidth - size);
        y = 0; // Fixed at the top
        break;
      case 1: // Right
        x = window.innerWidth - size; // Fixed at the right
        y = Math.random() * (window.innerHeight - size);
        break;
      case 2: // Bottom
        x = Math.random() * (window.innerWidth - size);
        y = window.innerHeight - size; // Fixed at the bottom
        break;
      case 3: // Left
        x = 0; // Fixed at the left
        y = Math.random() * (window.innerHeight - size);
        break;
    }

    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;

    document.getElementById("overlay2cdacaq313g").appendChild(circle);
  }

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
})();
