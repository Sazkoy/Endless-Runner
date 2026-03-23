// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Backgrounds
const backgrounds = {
  forest: new Image(),
  desert: new Image(),
  space: new Image()
};

backgrounds.forest.src = "Pictures//forest.jpg";
backgrounds.desert.src = "Pictures//desert.jpg";
backgrounds.space.src = "Pictures//space.jpg";

let bgX = 0;
let currentMap = localStorage.getItem("map") || "forest";

let gameStarted = false;
let gameOver = false;

// Player
let player = {
  x: 100,
  y: 300,
  width: 40,
  height: 40,
  dy: 0,
  gravity: 0.6,
  jumpPower: -12,
  jumps: 0,
  maxJumps: 2,
  color: localStorage.getItem("skin") || "red",
  rotation: 0
};

let obstacles = [];
let coins = [];

let speed = 5;
let score = 0;
let totalCoins = parseInt(localStorage.getItem("coins")) || 0;

let lastObstacleSpawnX = 0; // ✅ NEW (spacing control)

const coinSound = new Audio("https://freesound.org/data/previews/146/146725_2437358-lq.mp3");

// Jump
function jump() {
  if (player.jumps < player.maxJumps && !gameOver) {
    player.dy = player.jumpPower;
    player.jumps++;
  }
}

// Controls
document.addEventListener("keydown", (e) => {
  if (!gameStarted) return;
  if (e.code === "Space") jump();
  if (e.code === "KeyR" && gameOver) restartGame();
});

// Restart
function restartGame() {
  obstacles = [];
  coins = [];
  score = 0;
  speed = 5;

  let ground = canvas.height - 60;
  player.y = ground - player.height;
  player.dy = 0;
  player.jumps = 0;
  player.rotation = 0;

  lastObstacleSpawnX = 0; // reset spacing

  gameOver = false;

  document.getElementById("restartBtn").style.display = "none";
}

// Shop
function buySkin(color, price) {
  if (totalCoins >= price) {
    totalCoins -= price;
    player.color = color;
    localStorage.setItem("skin", color);
    localStorage.setItem("coins", totalCoins);
    alert("Skin equipped!");
  } else {
    alert("Not enough coins!");
  }
}

// Map
function setMap(map) {
  currentMap = map;
  localStorage.setItem("map", map);
  bgX = 0;
  obstacles = [];
  coins = [];
  lastObstacleSpawnX = 0;
}

// Menu
function showShop() {
  document.getElementById("shop").style.display = "block";
  document.getElementById("mainMenu").style.display = "none";
}
function closeShop() {
  document.getElementById("shop").style.display = "none";
  document.getElementById("mainMenu").style.display = "block";
}
function showMapMenu() {
  document.getElementById("mapMenu").style.display = "block";
  document.getElementById("mainMenu").style.display = "none";
}
function closeMapMenu() {
  document.getElementById("mapMenu").style.display = "none";
  document.getElementById("mainMenu").style.display = "block";
}
function exitGame() {
  alert("Thanks for playing!");
}

// Start
function startGame() {
  gameStarted = true;
  document.getElementById("mainMenu").style.display = "none";
  restartGame();
}

// Coin timer
let coinTimer = 0;

// Update
function update() {
  player.dy += player.gravity;
  player.y += player.dy;

  let ground = canvas.height - 60;

  if (player.y + player.height >= ground) {
    player.y = ground - player.height;
    player.dy = 0;
    player.jumps = 0;
  }

  speed += 0.002;

  bgX -= speed * 0.5;
  if (bgX <= -canvas.width) bgX = 0;

  // ===== OBSTACLES (FIXED SPACING) =====
  // ===== OBSTACLES (PERFECT SPACING) =====
let minGap = 500; // minimum safe distance
let maxGap = 800; // variation

let lastObstacle = obstacles[obstacles.length - 1];

if (
  obstacles.length === 0 ||
  lastObstacle.x < canvas.width - (minGap + Math.random() * (maxGap - minGap))
) {
  let type = Math.floor(Math.random() * 3);
  let width, height, y;

  if (type === 0) {
    width = 20 + Math.random() * 50;
    height = 20 + Math.random() * 80;
    y = ground - height;

    obstacles.push({
      x: canvas.width,
      y,
      width,
      height,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });

  } else if (type === 1) {
    width = 30;
    height = 80 + Math.random() * 80;
    y = ground - height;

    obstacles.push({
      x: canvas.width,
      y,
      width,
      height,
      color: "#ff8800"
    });

  } else {
    width = 30 + Math.random() * 20;
    height = 30 + Math.random() * 40;
    y = ground - height - 50;

    obstacles.push({
      x: canvas.width,
      y,
      width,
      height,
      color: "#aa00ff",
      moving: true,
      direction: Math.random() > 0.5 ? 1 : -1
    });
  }


    lastObstacleSpawnX = canvas.width;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];

    o.x -= speed;
    lastObstacleSpawnX -= speed;

    if (o.moving) {
      o.y += o.direction * 2;
      if (o.y < ground - 140 || o.y > ground - o.height) {
        o.direction *= -1;
      }
    }

    if (
      player.x < o.x + o.width &&
      player.x + player.width > o.x &&
      player.y < o.y + o.height &&
      player.y + player.height > o.y
    ) {
      gameOver = true;
    }

    if (o.x < -o.width) {
      obstacles.splice(i, 1);
    }
  }

  // ===== COINS =====
  coinTimer++;
  if (coinTimer >= 180) {
    let yBase = ground - 20;
    for (let i = 0; i < 9; i++) {
      coins.push({
        x: canvas.width + i * 40,
        y: yBase,
        size: 12
      });
    }
    coinTimer = 0;
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    let c = coins[i];
    c.x -= speed;

    if (
      player.x < c.x + c.size &&
      player.x + player.width > c.x - c.size &&
      player.y < c.y + c.size &&
      player.y + player.height > c.y - c.size
    ) {
      coins.splice(i, 1);
      totalCoins++;
      localStorage.setItem("coins", totalCoins);
      coinSound.play();
    }

    if (c.x < -20) {
      coins.splice(i, 1);
    }
  }

  // Rotation
  if (player.y + player.height < ground) {
    player.rotation += 0.15;
  } else {
    player.rotation = 0;
  }

  score++;
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) return;

  const bg = backgrounds[currentMap];
  if (bg.complete) {
    ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
  }

  let ground = canvas.height - 60;

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, ground, canvas.width, 60);

  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate(player.rotation);
  ctx.fillStyle = player.color;
  ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
  ctx.restore();

  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });

  coins.forEach(c => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Coins: " + totalCoins, 10, 60);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);

    document.getElementById("restartBtn").style.display = "block";
  }
}

// Loop
function gameLoop() {
  if (gameStarted && !gameOver) update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();