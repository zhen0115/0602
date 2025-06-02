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
let handPosition = null; // 追蹤手部中心位置
let touchThreshold = optionRadius; // 紅點中心進入選項圓心範圍即判斷觸碰
let brightnessThreshold = 130; // 稍微降低亮度閾值
let brightPixelThreshold = 5; // 稍微降低最小亮點數

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

  startGame();
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

  if (gameStarted) {
    video.loadPixels();
    if (video.pixels.length > 0) {
      // 簡化手部中心估計 (尋找畫面中心附近的亮點) - 更穩定地追蹤
      let avgX = 0;
      let avgY = 0;
      let brightPixels = 0;
      let searchRadius = 60; // 稍微擴大搜尋範圍
      let totalBrightnessX = 0;
      let totalBrightnessY = 0;

      for (let i = -searchRadius; i < searchRadius; i += 5) {
        for (let j = -searchRadius; j < searchRadius; j += 5) {
          let checkX = floor(video.width / 2 + i);
          let checkY = floor(video.height / 2 + j);
          if (checkX >= 0 && checkX < video.width && checkY >= 0 && checkY < video.height) {
            let index = (checkY * video.width + checkX) * 4;
            let brightness = (video.pixels[index] + video.pixels[index + 1] + video.pixels[index + 2]) / 3;
            if (brightness > brightnessThreshold) {
              totalBrightnessX += checkX * brightness;
              totalBrightnessY += checkY * brightness;
              brightPixels++;
            }
          }
        }
      }

      if (brightPixels > brightPixelThreshold) {
        handPosition = {
          x: map(totalBrightnessX / (brightPixels * 255), 0, video.width, x, x + scaledWidth), // 使用加權平均
          y: map(totalBrightnessY / (brightPixels * 255), 0, video.height, y, y + scaledHeight)
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
    }

    fill(0);
    textSize(20);
    textAlign(LEFT, TOP);
    text('分數: ' + score, 20, 20);
  }
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
