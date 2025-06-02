let video;
let pg; // p5.Graphics 物件
let targetX;
let targetY;
let score = 0;
let gameStarted = false;
let instructionDiv;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO);
  video.size(640, 480); // 設定視訊尺寸 (可依您的攝影機調整)
  video.hide(); // 隱藏攝影機的 HTML 元素

  // 創建一個與視訊尺寸相同的 p5.Graphics 物件
  pg = createGraphics(video.width, video.height);

  instructionDiv = createDiv('將你的手移動到紅色圓圈上');
  instructionDiv.id('instruction');

  startGame();
}

function startGame() {
  score = 0;
  generateTarget();
  gameStarted = true;
  instructionDiv.html('將你的手移動到紅色圓圈上');
}

function generateTarget() {
  targetX = random(width * 0.2, width * 0.8);
  targetY = random(height * 0.2, height * 0.8);
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

  // 在 p5.Graphics 物件上繪製目標圓圈
  pg.background(0, 0, 0, 0); // 清空之前的繪圖 (透明背景)
  pg.fill(255, 0, 0);
  let targetPgX = map(targetX, x, x + scaledWidth, 0, pg.width);
  let targetPgY = map(targetY, y, y + scaledHeight, 0, pg.height);
  pg.ellipse(targetPgX, targetPgY, 50, 50);

  // 將 p5.Graphics 物件繪製到畫布上，位置與視訊相同
  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2);
  scale(-1, 1); // 確保 graphics 也做相同的翻轉
  image(pg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();

  if (gameStarted) {
    // 取得目前影像的像素資料
    video.loadPixels();
    if (video.pixels.length > 0) {
      // 計算目標圓圈在影像像素陣列中的大致位置
      let scaledTargetX = map(targetX, x, x + scaledWidth, 0, video.width);
      let scaledTargetY = map(targetY, y, y + scaledHeight, 0, video.height);

      // 檢查目標圓圈中心附近的像素是否有明顯的移動 (簡化手部偵測)
      let detectionRadius = 20;
      let foundHand = false;
      for (let i = -detectionRadius; i < detectionRadius; i += 5) {
        for (let j = -detectionRadius; j < detectionRadius; j += 5) {
          let checkX = floor(scaledTargetX + i);
          let checkY = floor(scaledTargetY + j);
          if (checkX >= 0 && checkX < video.width && checkY >= 0 && checkY < video.height) {
            let index = (checkY * video.width + checkX) * 4;
            // 簡單地檢查是否有非背景色的像素 (這裡假設背景在沒有手的情況下是相對靜態的)
            if (video.pixels[index] > 50 || video.pixels[index + 1] > 50 || video.pixels[index + 2] > 50) {
              foundHand = true;
              break;
            }
          }
        }
        if (foundHand) break;
      }

      if (foundHand) {
        score++;
        generateTarget();
        instructionDiv.html('做得好！分數：' + score);
      }
    }

    fill(0);
    textSize(20);
    text('分數: ' + score, 20, height - 30);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // 當按下 'r' 鍵時重新開始遊戲
  if (key === 'r' || key === 'R') {
    startGame();
  }
  // 當按下 's' 鍵時儲存畫布
  if (key === 's' || key === 'S') {
    saveCanvas('hand_control_game', 'png');
  }
}
