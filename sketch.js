let video;
let handpose; // ml5.js Handpose 模型
let predictions = []; // 儲存手部偵測結果

let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 50;
let numberX, numberY;
let numberSize = 64;
let canAnswer = true; // 控制是否可以回答
let answerDelay = 1000; // 1 秒的延遲

let handPointToCheck = null; // 儲存最適合的偵測點（任何手指尖端）

// 定義每個手指的尖端關鍵點索引
const fingerTipKeypoints = [4, 8, 12, 16, 20];

// 你想要的連接方式，每個陣列代表一條線段
const connectionSegments = [
  // 拇指 (手腕到指尖)
  [0, 1], [1, 2], [2, 3], [3, 4],
  // 食指 (手腕到指尖)
  [0, 5], [5, 6], [6, 7], [7, 8],
  // 中指 (手腕到指尖)
  [0, 9], [9, 10], [10, 11], [11, 12],
  // 無名指 (手腕到指尖)
  [0, 13], [13, 14], [14, 15], [15, 16],
  // 小指 (手腕到指尖)
  [0, 17], [17, 18], [18, 19], [19, 20]
];

let numberPairs = [
  { number: 1, word: "one" },
  { number: 2, word: "two" },
  { number: 3, word: "three" },
  { number: 4, word: "four" },
  { number: 5, word: "five" }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); // 隱藏原生視訊元件

  // 初始化 Handpose 模型
  handpose = ml5.handpose(video, modelReady);

  // 當手部偵測到時，呼叫 gotHands 函數
  handpose.on('hand', gotHands);

  instructionDiv = createDiv('將你的任一手指移動到對應的英文單字上');
  instructionDiv.id('instruction');

  startGame();
}

// 模型載入完成後的回調函數
function modelReady() {
  console.log('Handpose Model Loaded!');
  instructionDiv.html('模型載入完成，請露出你的手！');
}

// 偵測到手部關鍵點後的回調函數
function function gotHands(results) {
  predictions = results;
}

function startGame() {
  score = 0;
  generateQuestion();
  gameStarted = true;
  instructionDiv.html('將你的任一手指移動到對應的英文單字上');
  canAnswer = true;
  handPointToCheck = null; // 重置偵測點
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

  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2);
  scale(-1, 1); // 翻轉視訊畫面，使其像鏡子
  image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();

  // 繪製數字和選項
  fill(0);
  textSize(numberSize);
  textAlign(CENTER, CENTER);
  text(currentNumber, numberX, numberY);

  textSize(24);
  for (let i = 0; i < options.length; i++) {
    fill(0, 100, 200);
    ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
    fill(255);
    textAlign(CENTER, CENTER);
    text(options[i], optionPositions[i].x, optionPositions[i].y);
  }

  handPointToCheck = null; // 每幀重置，找到最適合的點

  if (gameStarted && predictions.length > 0) {
    let minDistanceToCenter = Infinity;
    let closestFingerTip = null;

    // 遍歷所有偵測到的手 (通常只有一隻手)
    for (let i = 0; i < predictions.length; i++) {
      let hand = predictions[i];
      let keypoints = hand.landmarks; // 關鍵點數據

      // 繪製所有關鍵點
      fill(255, 0, 0); // 關鍵點顏色
      noStroke();
      for (let j = 0; j < keypoints.length; j++) {
        let keypoint = keypoints[j];
        // 將關鍵點座標從視訊空間映射到畫布空間
        let mappedX = map(keypoint[0], 0, video.width, x, x + scaledWidth);
        let mappedY = map(keypoint[1], 0, video.height, y, y + scaledHeight);
        ellipse(mappedX, mappedY, 10, 10); // 繪製關鍵點為小圓點

        // 找出最靠近畫面中央的手指尖端
        if (fingerTipKeypoints.includes(j)) {
          let distToCenter = dist(mappedX, mappedY, width / 2, height / 2);
          if (distToCenter < minDistanceToCenter) {
            minDistanceToCenter = distToCenter;
            closestFingerTip = { x: mappedX, y: mappedY };
          }
        }
      }

      // 如果找到了最靠近中央的手指尖端，將其設為 `handPointToCheck`
      if (closestFingerTip) {
        handPointToCheck = closestFingerTip;
        // 繪製移動的紅點 (代表你選擇的手指尖端)
        fill(255, 0, 0, 200); // 顯眼的紅色，帶透明度
        ellipse(handPointToCheck.x, handPointToCheck.y, 30); // 畫一個更大的紅點
      }

      // 繪製連接線
      stroke(0, 255, 0); // 連接線顏色 (綠色)
      strokeWeight(2);
      for (let k = 0; k < connectionSegments.length; k++) {
        let segment = connectionSegments[k];
        let p1 = keypoints[segment[0]];
        let p2 = keypoints[segment[1]];

        // 將關鍵點座標從視訊空間映射到畫布空間
        let mappedX1 = map(p1[0], 0, video.width, x, x + scaledWidth);
        let mappedY1 = map(p1[1], 0, video.height, y, y + scaledHeight);
        let mappedX2 = map(p2[0], 0, video.width, x, x + scaledWidth);
        let mappedY2 = map(p2[1], 0, video.height, y, y + scaledHeight);
        line(mappedX1, mappedY1, mappedX2, mappedY2);
      }
    }

    // 檢查最靠近中央的手指尖端是否靠近選項
    if (handPointToCheck && canAnswer) {
      for (let i = 0; i < options.length; i++) {
        let distance = dist(handPointToCheck.x, handPointToCheck.y, optionPositions[i].x, optionPositions[i].y);
        if (distance < optionRadius + 10) { // 觸碰閾值
          if (options[i] === correctAnswer) {
            score++;
            instructionDiv.html('答對了！分數：' + score);
          } else {
            instructionDiv.html('再試一次！分數：' + score);
          }
          canAnswer = false; // 暫停回答，避免重複觸發
          setTimeout(() => {
            generateQuestion(); // 生成新問題
            canAnswer = true; // 允許再次回答
            handPointToCheck = null; // 重置偵測點
            instructionDiv.html('將你的任一手指移動到對應的英文單字上'); // 重設提示
          }, answerDelay);
          break; // 避免同時觸發多個選項
        }
      }
    }
  }

  // 顯示分數
  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);
  text('分數: ' + score, 20, 20);
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
