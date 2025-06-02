let video;
let pg; // p5.Graphics 物件
let circles = [];
let letters = [];
let bopomos = [];
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const bopomoChars = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ";
const numLetters = 26;
const numBopomos = 37;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO);
  video.size(640, 480); // 設定視訊尺寸 (可依您的攝影機調整)
  video.hide(); // 隱藏攝影機的 HTML 元素

  // 創建一個與視訊尺寸相同的 p5.Graphics 物件
  pg = createGraphics(video.width, video.height);

  // 初始化隨機掉落的圓形
  for (let i = 0; i < 100; i++) { // 調整圓形的數量
    circles.push({
      x: random(0, video.width),
      y: random(-height, 0), // 從畫布上方開始掉落
      r: random(10, 30),
      speedY: random(1, 5)
    });
  }

  // 初始化隨機字母的位置
  for (let i = 0; i < numLetters; i++) {
    letters.push({
      char: random(alphabet),
      x: random(0, video.width),
      y: random(0, video.height),
      size: random(12, 24)
    });
  }

  // 初始化隨機注音符號的位置
  for (let i = 0; i < numBopomos; i++) {
    bopomos.push({
      char: random(bopomoChars),
      x: random(0, video.width),
      y: random(0, video.height),
      size: random(12, 24)
    });
  }
}

function draw() {
  background('#ffe6a7'); // 確保每一幀都重新繪製背景

  let videoWidth = video.width;
  let videoHeight = video.height;
  let displayWidth = windowWidth * 0.8;
  let displayHeight = windowHeight * 0.8;

  // 計算保持原始比例的縮放比例
  let scaleFactor = min(displayWidth / videoWidth, displayHeight / videoHeight);

  // 計算縮放後的影像尺寸
  let scaledWidth = videoWidth * scaleFactor;
  let scaledHeight = videoHeight * scaleFactor;

  // 計算影像在視窗中央的 x 和 y 座標
  let x = (windowWidth - scaledWidth) / 2;
  let y = (windowHeight - scaledHeight) / 2;

  push(); // 保存當前的繪圖狀態
  translate(x + scaledWidth / 2, y + scaledHeight / 2); // 移動到影像的中心
  scale(-1, 1); // 水平翻轉
  image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight); // 繪製翻轉後的影像
  pop(); // 恢復之前的繪圖狀態

  // 在 p5.Graphics 物件上繪製隨機掉落的紅色圓形
  pg.background(0, 0, 0, 0); // 清空之前的繪圖 (透明背景)
  pg.fill(255, 0, 0);
  for (let i = 0; i < circles.length; i++) {
    ellipse(circles[i].x, circles[i].y, circles[i].r * 2, circles[i].r * 2);
    circles[i].y += circles[i].speedY;
    // 如果圓形掉落到底部，則重置其位置
    if (circles[i].y > pg.height + circles[i].r) {
      circles[i].y = -circles[i].r;
      circles[i].x = random(0, pg.width);
      circles[i].speedY = random(1, 5);
      circles[i].r = random(10, 30);
    }
  }

  // 找出紅色圓形包圍的範圍
  let minCircleX = pg.width;
  let maxCircleX = 0;
  let minCircleY = pg.height;
  let maxCircleY = 0;
  for (let c of circles) {
    minCircleX = min(minCircleX, c.x - c.r);
    maxCircleX = max(maxCircleX, c.x + c.r);
    minCircleY = min(minCircleY, c.y - c.r);
    maxCircleY = max(maxCircleY, c.y + c.r);
  }

  // 在紅色圓形包圍的範圍內隨機繪製字母
  pg.fill(0); // 黑色字母
  for (let i = 0; i < letters.length; i++) {
    if (letters[i].x >= minCircleX && letters[i].x <= maxCircleX &&
        letters[i].y >= minCircleY && letters[i].y <= maxCircleY) {
      textSize(letters[i].size);
      text(letters[i].char, letters[i].x, letters[i].y);
    } else {
      // 如果字母不在範圍內，則隨機移動它們
      letters[i].x = random(0, pg.width);
      letters[i].y = random(0, pg.height);
    }
  }

  // 在紅色圓形包圍的範圍內隨機繪製注音符號
  pg.fill(0, 0, 255); // 藍色注音符號
  for (let i = 0; i < bopomos.length; i++) {
    if (bopomos[i].x >= minCircleX && bopomos[i].x <= maxCircleX &&
        bopomos[i].y >= minCircleY && bopomos[i].y <= maxCircleY) {
      textSize(bopomos[i].size);
      text(bopomos[i].char, bopomos[i].x, bopomos[i].y);
    } else {
      // 如果注音符號不在範圍內，則隨機移動它們
      bopomos[i].x = random(0, pg.width);
      bopomos[i].y = random(0, pg.height);
    }
  }

  // 將 p5.Graphics 物件繪製到畫布上，位置與視訊相同
  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2);
  scale(-1, 1); // 確保 graphics 也做相同的翻轉
  image(pg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // 當按下 's' 鍵時儲存畫布
  if (key === 's' || key === 'S') {
    saveCanvas('flipped_camera_with_falling_circles_and_text', 'png');
  }
}
