// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

let targetNumber;
let dots = [];
let score = 0;
let timer = 10; // 倒計時秒數
let gameStarted = false;

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);

  startGame();
}

function startGame() {
  score = 0;
  timer = 10;
  dots = [];
  generateDots(5); // 產生初始數量的數字圓點
  pickTargetNumber();
  gameStarted = true;
  setTimeout(gameOver, timer * 1000); // 設定遊戲結束倒計時
}

function gameOver() {
  gameStarted = false;
  console.log("遊戲結束！你的得分是：" + score);
  // 可以在這裡顯示遊戲結束畫面或按鈕重新開始
}

function pickTargetNumber() {
  targetNumber = floor(random(1, 10)); // 隨機選擇 1 到 9 的數字作為目標
  console.log("目標數字：", targetNumber);
}

function generateDots(num) {
  for (let i = 0; i < num; i++) {
    dots.push({
      x: random(width * 0.2, width * 0.8), // 避免太靠近邊緣
      y: random(height * 0.2, height * 0.8),
      number: floor(random(1, 10)),
      radius: 30,
      hit: false // 標記是否被擊中
    });
  }
}

function gotHands(results) {
  hands = results;
}

function draw() {
  image(video, 0, 0);

  if (!gameStarted) {
    // 顯示遊戲開始畫面
    textSize(32);
    fill(255);
    textAlign(CENTER, CENTER);
    text("數字點點樂", width / 2, height / 2 - 50);
    textSize(20);
    text("揮動你的手開始遊戲", width / 2, height / 2);
    return;
  }

  // 顯示目標數字和分數、倒計時
  textSize(24);
  fill(255);
  textAlign(LEFT, TOP);
  text("目標數字: " + targetNumber, 10, 10);
  text("分數: " + score, 10, 40);
  text("時間: " + floor(timer), 10, 70);

  // 繪製數字圓點
  for (let dot of dots) {
    fill(200);
    if (dot.hit) {
      fill(0, 255, 0); // 擊中後變綠色
    }
    ellipse(dot.x, dot.y, dot.radius * 2);
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(dot.number, dot.x, dot.y);
  }

  // 檢查手部是否點擊到數字圓點
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.8) { // 提高信心度判斷
        // 取得食指指尖的關鍵點 (index 為 8)
        const indexFinger = hand.keypoints[8];
        if (indexFinger) {
          const fingerX = indexFinger.x;
          const fingerY = indexFinger.y;

          // 檢查是否點擊到未被擊中的目標數字圓點
          for (let i = dots.length - 1; i >= 0; i--) {
            const dot = dots[i];
            if (!dot.hit && dist(fingerX, fingerY, dot.x, dot.y) < dot.radius) {
              if (dot.number === targetNumber) {
                score++;
                dot.hit = true;
                pickTargetNumber();
                // 可以增加產生新圓點的邏輯，例如擊中後產生一個新的
                if (dots.filter(d => !d.hit).length === 0) {
                  generateDots(3); // 全部擊中後再產生新的
                }
              } else {
                // 點擊錯誤可以有反饋，例如短暫閃爍或扣分 (可選)
                console.log("點擊錯誤！");
              }
              break; // 只處理一個點擊
            }
          }
        }
      }
    }
  }

  // 更新倒計時
  if (gameStarted) {
    timer -= deltaTime / 1000;
    if (timer <= 0) {
      gameOver();
    }
  }
}

function mousePressed() {
  if (!gameStarted) {
    startGame(); // 按下滑鼠也能開始遊戲，方便測試
  }
  // console.log(hands); // 方便除錯時查看手部追蹤數據
}
