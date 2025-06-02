let video;
let pg;
let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 70; // 原本50，現在選項視覺與碰撞區更大
let numberX, numberY;
let numberSize = 64;
let canAnswer = true;
let answerDelay = 500;
let handPosition = null;
let touchThreshold = 100; // 原本60，手接近就能觸發
let brightnessThreshold = 130; // 降低亮度門檻，讓偵測更靈敏
let brightPixelThreshold = 5;  // 減少亮點數門檻

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
  handPosition = null;
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
    stroke(50);
    strokeWeight(4);
    fill(0, 100, 200);
    ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    text(options[i], optionPositions[i].x, optionPositions[i].y);
  }

  if (gameStarted) {
    video.loadPixels();
    if (video.pixels.length > 0) {
      let avgX = 0;
      let avgY = 0;
      let brightPixels = 0;
      let searchRadius = 50;

      for (let i = -searchRadius; i < searchRadius; i += 5) {
        for (let j = -searchRadius; j < searchRadius; j += 5) {
          let checkX = floor(video.width / 2 + i);
          let checkY = floor(video.height / 2 + j);
          if (checkX >= 0 && checkX < video.width && checkY >= 0 && checkY < video.height) {
            let index = (checkY * video.width + checkX) * 4;
            let brightness = (video.pixels[index] + video.pixels[index + 1] + video.pixels[index + 2]) / 3;
            if (brightness > brightnessThreshold) {
              avgX += checkX;
              avgY += checkY;
              brightPixels++;
            }
          }
        }
      }

      if (brightPixels > brightPixelThreshold) {
        handPosition = {
          x: map(avgX / brightPixels, 0, video.width, x, x + scaledWidth),
          y: map(avgY / brightPixels, 0, video.height, y, y + scaledHeight)
        };

        fill(255, 0, 0, 150);
        noStroke();
        ellipse(handPosition.x, handPosition.y, 30); // 更明顯的手部提示圈

        for (let i = 0; i < options.length; i++) {
          let distance = dist(handPosition.x, handPosition.y, optionPositions[i].x, optionPositions[i].y);
          if (distance < touchThreshold && canAnswer) {
            if (options[i] === correctAnswer) {
              score++;
              instructionDiv.html('答對了！分數：' + score);
              canAnswer = false;
              setTimeout(() => {
                generateQuestion();
                canAnswer = true;
                handPosition = null;
              }, answerDelay);
            } else {
              instructionDiv.html('再試一次！分數：' + score);
            }
            break;
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
