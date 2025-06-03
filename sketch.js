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
let answerDelay = 500; // 0.5 秒的延遲
let handPosition = null; // 追蹤手部中心位置 (簡化)
let touchThreshold = 60; // 觸碰的距離閾值
let brightnessThreshold = 150; // 亮度閾值
let brightPixelThreshold = 10; // 最少亮點數

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
      // 簡化手部中心估計 (尋找畫面中心附近的亮點)
      let avgX = 0;
      let avgY = 0;
      let brightPixels = 0;
      let searchRadius = 50; // 在畫面中心附近搜尋

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
          x: map(avgX / brightPixels, 0, video.width, x, x + scaledWidth),
          y: map(avgY / brightPixels, 0, video.height, y, y + scaledHeight)
        };

        // 繪製一個小圓圈表示偵測到的手部位置
        fill(255, 0, 0, 150);
        ellipse(handPosition.x, handPosition.y, 20);

        console.log("手部位置:", handPosition);

        // 檢查手部位置是否靠近選項
        if (handPosition && canAnswer) {
          for (let i = 0; i < options.length; i++) {
            let distance = dist(handPosition.x, handPosition.y, optionPositions[i].x, optionPositions[i].y);
            console.log(`與選項 ${i} ('${options[i]}') 的距離:`, distance);
            if (distance < touchThreshold) {
              console.log(`觸碰到選項 ${i} ('${options[i]}')`);
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
              break; // 避免同時觸發多個選項
            }
          }
        }
      } else {
        handPosition = null; // 沒有偵測到明顯的手部
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
Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  image(video, 0, 0);

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          circle(keypoint.x, keypoint.y, 16);
        }
      }
    }
  }
}

