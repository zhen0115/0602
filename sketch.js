let video;
let pg; // p5.Graphics 物件
let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 40;
let numberX, numberY;
let numberSize = 64;
let canAnswer = true; // 控制是否可以回答
let answerDelay = 500; // 0.5 秒的延遲

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

  instructionDiv = createDiv('將你的手移動到對應的英文單字上');
  instructionDiv.id('instruction');

  startGame();
}

function startGame() {
  score = 0;
  generateQuestion();
  gameStarted = true;
  instructionDiv.html('將你的手移動到對應的英文單字上');
  canAnswer = true; // 重新開始遊戲時允許回答
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
      let detectionRadius = 30;
      for (let i = 0; i < options.length; i++) {
        let optionX = optionPositions[i].x;
        let optionY = optionPositions[i].y;
        let scaledOptionX = map(optionX, x, x + scaledWidth, 0, video.width);
        let scaledOptionY = map(optionY, y, y + scaledHeight, 0, video.height);

        let handDetected = false;
        for (let dx = -detectionRadius; dx < detectionRadius; dx += 5) {
          for (let dy = -detectionRadius; dy < detectionRadius; dy += 5) {
            let checkX = floor(scaledOptionX + dx);
            let checkY = floor(scaledOptionY + dy);
            if (checkX >= 0 && checkX < video.width && checkY >= 0 && checkY < video.height) {
              let index = (checkY * video.width + checkX) * 4;
              if (video.pixels[index] > 50 || video.pixels[index + 1] > 50 || video.pixels[index + 2] > 50) {
                handDetected = true;
                break;
              }
            }
          }
          if (handDetected) break;
        }

        if (handDetected && canAnswer) {
          if (options[i] === correctAnswer) {
            score++;
            instructionDiv.html('答對了！分數：' + score);
            canAnswer = false; // 鎖定回答
            setTimeout(() => {
              generateQuestion();
              canAnswer = true; // 解鎖回答
            }, answerDelay);
          } else {
            instructionDiv.html('再試一次！分數：' + score);
          }
        }
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
  // 重新計算選項顯示位置和數字位置
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
