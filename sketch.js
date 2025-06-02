let video;
let pg; // p5.Graphics 物件
let circles = []; // 用於儲存圓形物件的陣列

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO);
  video.size(640, 480); // 設定視訊尺寸 (可依您的攝影機調整)
  video.hide(); // 隱藏攝影機的 HTML 元素

  // 創建一個與視訊尺寸相同的 p5.Graphics 物件
  pg = createGraphics(video.width, video.height);

  // 初始化一些隨機掉落的圓形
  for (let i = 0; i < 50; i++) { // 初始生成 50 個圓形，可調整
    circles.push({
      x: random(pg.width),
      y: random(-pg.height, 0), // 從畫面上方隨機位置開始
      diameter: random(10, 40),
      speedY: random(2, 5)
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

  // 在 p5.Graphics 物件上繪製掉落的圓形
  pg.background(0, 0, 0, 0); // 清空之前的繪圖 (透明背景)
  pg.fill(255, 0, 0);
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    pg.ellipse(c.x, c.y, c.diameter, c.diameter);
    c.y += c.speedY; // 讓圓形掉落

    // 當圓形掉落到底部後，重新設定其位置
    if (c.y > pg.height + c.diameter / 2) {
      c.y = -c.diameter / 2;
      c.x = random(pg.width);
      c.speedY = random(2, 5);
      c.diameter = random(10, 40);
    }
  }

  // 將 p5.Graphics 物件繪製到畫布上，位置與視訊相同
  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2);
  scale(-1, 1); // 確保 graphics 也做相同的翻轉
  image(pg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();

  // 每隔一段時間新增一個新的圓形 (可調整生成頻率)
  if (frameCount % 30 === 0) { // 每 30 幀新增一個圓形
    circles.push({
      x: random(pg.width),
      y: random(-50, -10),
      diameter: random(10, 40),
      speedY: random(2, 5)
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // 當按下 's' 鍵時儲存畫布
  if (key === 's' || key === 'S') {
    saveCanvas('flipped_camera_with_falling_circles', 'png');
  }
}
