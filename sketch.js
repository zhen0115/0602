// Hand Pose Detection with ml5.js for Number-Word Pairing Game
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
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
let touchThreshold = 60; // 觸碰的距離閾值
let handConfidenceThreshold = 0.1; // 手部偵測信賴度閾值
let fingerTipIndex = 8; // Index finger tip keypoint index

let numberPairs = [
  { number: 1, word: "one" },
  { number: 2, word: "two" },
  { number: 3, word: "three" },
  { number: 4, word: "four" },
  { number: 5, word: "five" }
  // 可以添加更多數字和單字
];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipHorizontal: true });
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO, { facingMode: 'user' });
  video.size(640, 480);
  video.hide();

  handPose.detect(video, gotHands);

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

  // Draw hand keypoints if detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > handConfidenceThreshold) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          fill(0, 255, 0);
          noStroke();
          ellipse(
            map(keypoint.x, 0, videoWidth, -scaledWidth / 2, scaledWidth / 2),
            map(keypoint.y, 0, videoHeight, -scaledHeight / 2, scaledHeight / 2),
            10
          );
        }

        // Get the index finger tip position
        let indexFingerTip = hand.keypoints[fingerTipIndex];
        let fingerTipX = map(indexFingerTip.x, 0, videoWidth, x, x + scaledWidth);
        let fingerTipY = map(indexFingerTip.y, 0, videoHeight, y, y + scaledHeight);

        // Draw a circle at the fingertip
        fill(255, 0, 0);
        ellipse(fingerTipX, fingerTipY, 20);

        // Check for touch on options
        if (canAnswer) {
          for (let i = 0; i < options.length; i++) {
            let distance = dist(fingerTipX, fingerTipY, optionPositions[i].x, optionPositions[i].y);
            if (distance < touchThreshold) {
              if (options[i] === correctAnswer) {
                score++;
                instructionDiv.html('答對了！分數：' + score);
                canAnswer = false;
                setTimeout(() => {
                  generateQuestion();
                  canAnswer = true;
                }, answerDelay);
              } else {
                instructionDiv.html('再試一次！分數：' + score);
                canAnswer = false;
                setTimeout(() => {
                  canAnswer = true;
                }, answerDelay);
              }
              break; // Only trigger one option at a time
            }
          }
        }
      }
    }
  }
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
