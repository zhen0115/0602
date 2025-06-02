let video;
let pg; // p5.Graphics 物件
let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 50; // 選項的半徑
let numberX, numberY;
let numberSize = 64;
let canAnswer = true; // 控制是否可以回答
let answerDelay = 500; // 0.5 秒的延遲
let handPosition = null; // 追蹤手部中心位置 (使用 Handtrack)
let touchThreshold = optionRadius; // 紅點中心進入選項圓心範圍即判斷觸碰
let model = null;
const modelParams = {
  flipHorizontal: true,   // 鏡像水平方向
  maxNumBoxes: 1,        // 最多偵測一個手
  iouThreshold: 0.5,      // 交並比閾值
  scoreThreshold: 0.75,   // 分數閾值
};

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

  instructionDiv = createDiv('移動紅點到對應的英文單字上');
  instructionDiv.id('instruction');

  // 加載 Handtrack.js 模型
  handtrack.load(modelParams).then(lmodel => {
    model = lmodel;
    console.log("Handtrack 模型加載完成");
    startGame(); // 模型加載完成後再開始遊戲
  });
}

function startGame() {
  score = 0;
  generateQuestion();
  gameStarted = true;
  instructionDiv.html('移動紅點到對應的英文單字上');
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
  scale(-1, 1);
  image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();

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

  if (gameStarted && model) {
    model.detect(video).then(predictions => {
      if (predictions.length > 0) {
        // 我們只取第一個偵測到的手
        const hand = predictions[0].bbox; // [x, y, width, height]
        // 計算手部中心位置並映射到畫布
        handPosition = {
          x: map(hand[0] + hand[2] / 2, 0, videoWidth, x, x + scaledWidth),
          y: map(hand[1] + hand[3] / 2, 0, videoHeight, y, y + scaledHeight)
        };

        // 繪製紅點表示手部位置
        fill(255, 0, 0);
        ellipse(handPosition.x, handPosition.y, 20);

        // 檢查紅點是否進入選項範圍
        if (handPosition && canAnswer) {
          for (let i = 0; i < options.length; i++) {
            let distance = dist(handPosition.x, handPosition.y, optionPositions[i].x, optionPositions[i].y);
            if (distance < touchThreshold) {
              if (options[i] === correctAnswer) {
                score++;
                instructionDiv.html('答對了！分數：' + score);
                canAnswer = false;
                setTimeout(() => {
                  generateQuestion();
                  canAnswer = true;
                  handPosition = null; // 重置手部位置
                }, answerDelay);
              } else {
                instructionDiv.html('再試一次！分數：' + score);
              }
              break;
            }
          }
        }
      } else {
        handPosition = null;
      }
    });
  }

  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);
  text('分數: ' + score, 20, 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
    startGame();
  }
  if (key === 's' || key === 'S') {
    saveCanvas('math_pairing_game', 'png');
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
