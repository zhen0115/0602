let video;
let pg; // p5.Graphics 物件
let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 50; // 稍微增大選項的觸碰範圍
let numberX, numberY;
let numberSize = 64;
let canAnswer = true; // 控制是否可以回答
let answerDelay = 1000; // 1 秒的延遲 (稍微增加，讓使用者有時間反應)
let handPosition = null; // 追蹤手部中心位置 (簡化)
let touchThreshold = 80; // 增大觸碰的距離閾值，讓偵測更寬鬆
let brightnessThreshold = 150; // 亮度閾值
let brightPixelThreshold = 30; // 最少亮點數 (增加，避免誤判)

let numberPairs = [
  { number: 1, word: "one" },
  { number: 2, word: "two" },
  { number: 3, word: "three" },
  { number: 4, word: "four" },
  { number: 5, word: "five" }
  // 可以添加更多數字和單字
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  pg = createGraphics(video.width, video.height);

  instructionDiv = createDiv('將你的食指移動到對應的英文單字上');
  instructionDiv.id('instruction');

  startGame();
}

function startGame() {
  score = 0;
  generateQuestion();
  gameStarted = true;
  instructionDiv.html('將你的食指移動到對應的英文單字上');
  canAnswer = true;
  handPosition = null; // 重置手部位置
}

function generateQuestion() {
  let randomIndex = floor(random(numberPairs.length));
  let pair = numberPairs[randomIndex];
  currentNumber = pair.number;
  correctAnswer = pair.word;

  options = [correctAnswer];
  while (options.length < 3) {
    let wrongPair = random(numberPairs);
    if (wrongPair.word !== correctAnswer && !options.includes(wrongPair.word)) {
      options.push(wrongPair.word);
    }
  }
  shuffle(options);

  numberX = width / 4;
  numberY = height / 2;

  // 確保選項位置在 generateQuestion 之後被正確設定
  optionPositions = [
    { x: width * 0.6, y: height / 3 },
    { x: width * 0.8, y: height / 2 },
    { x: width * 0.6, y: height * 2 / 3 }
  ];
}

function draw() {
  background('#ffe6a7');

  let videoWidth = video.width;
  let videoHeight = video.height;
  let displayWidth = windowWidth * 0.8;
  let displayHeight = windowHeight * 0.8;
  let scaleFactor = min(displayWidth / videoWidth, displayHeight / videoHeight);
  let scaledWidth = videoWidth * scaleFactor;
  let scaledHeight = videoHeight * scaleFactor;
  let x = (windowWidth - scaledWidth) / 2;
  let y = (windowHeight - scaledHeight) / 2;

  // 繪製視訊畫面，並翻轉，讓畫面看起來像鏡子
  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2);
  scale(-1, 1);
  image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();

  // 顯示當前數字
  fill(0);
  textSize(numberSize);
  textAlign(CENTER, CENTER);
  text(currentNumber, numberX, numberY);

  // 顯示選項
  textSize(24);
  for (let i = 0; i < options.length; i++) {
    fill(0, 100, 200);
    ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
    fill(255);
    textAlign(CENTER, CENTER);
    text(options[i], optionPositions[i].x, optionPositions[i].y);
  }

  if (gameStarted) {
    video.loadPixels();
    if (video.pixels.length > 0) {
      // 簡化手部中心估計 (尋找畫面中心附近的亮點)
      let avgX = 0;
      let avgY = 0;
      let brightPixels = 0;
      let searchRadius = 100; // 擴大搜尋範圍，更容易找到手

      // 遍歷視訊像素，尋找亮度超過閾值的點
      for (let i = -searchRadius; i < searchRadius; i += 5) {
        for (let j = -searchRadius; j < searchRadius; j += 5) {
          let checkX = floor(video.width / 2 + i);
          let checkY = floor(video.height / 2 + j);
          if (checkX >= 0 && checkX < video.width && checkY >= 0 && checkY < video.height) {
            let index = (checkY * video.width + checkX) * 4;
            let brightness = (video.pixels[index] + video.pixels[index + 1] + video.pixels[index + 2]) / 3;
            if (brightness > brightnessThreshold) { // 判斷為亮點 (可能的手指)
              avgX += checkX;
              avgY += checkY;
              brightPixels++;
            }
          }
        }
      }

      if (brightPixels > brightPixelThreshold) { // 至少要有一定數量的亮點才認為偵測到手
        handPosition = {
          // 將視訊座標映射到畫布座標
          x: map(avgX / brightPixels, 0, video.width, x, x + scaledWidth),
          y: map(avgY / brightPixels, 0, video.height, y, y + scaledHeight)
        };

        // 繪製一個小圓圈表示偵測到的手部位置 (紅點)
        fill(255, 0, 0, 150);
        ellipse(handPosition.x, handPosition.y, 20);

        // 檢查手部位置是否靠近選項
        if (handPosition && canAnswer) {
          for (let i = 0; i < options.length; i++) {
            let distance = dist(handPosition.x, handPosition.y, optionPositions[i].x, optionPositions[i].y);
            if (distance < touchThreshold) {
              // 觸碰到任何選項
              if (options[i] === correctAnswer) {
                score++;
                instructionDiv.html('答對了！分數：' + score);
              } else {
                instructionDiv.html('再試一次！分數：' + score);
              }
              // 無論答對或答錯，都設定為不能再回答，並延遲後換題目
              canAnswer = false; // 暫停回答，避免重複觸發
              setTimeout(() => {
                generateQuestion(); // 生成新問題
                canAnswer = true; // 允許再次回答
                handPosition = null; // 重置手部位置，避免下一個問題立即觸發
                instructionDiv.html('將你的食指移動到對應的英文單字上'); // 重設提示
              }, answerDelay);
              break; // 避免同時觸發多個選項
            }
          }
        }
      } else {
        handPosition = null; // 沒有偵測到明顯的手部
      }
    }

    // 顯示分數
    fill(0);
    textSize(20);
    textAlign(LEFT, TOP);
    text('分數: ' + score, 20, 20);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 視窗大小改變時，重新計算選項和數字的位置
  optionPositions = [
    { x: width * 0.6, y: height / 3 },
    { x: width * 0.8, y: height / 2 },
    { x: width * 0.6, y: height * 2 / 3 }
  ];
  numberX = width / 4;
  numberY = height / 2;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    startGame(); // 按下 'R' 鍵重新開始遊戲
  }
  if (key === 's' || key === 'S') {
    saveCanvas('math_pairing_game', 'png'); // 按下 'S' 鍵儲存畫布截圖
  }
}

// 隨機排序陣列的輔助函數
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
