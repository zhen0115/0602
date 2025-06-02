let video;
let handLandmarker;
let handsLoaded = false;
let redDot = { x: 200, y: 200, r: 30, held: false };
let pinchThreshold = 40;
let options = [];
let correctAnswer;
let currentNumber;
let numberPairs = [
  { number: 1, word: "one" },
  { number: 2, word: "two" },
  { number: 3, word: "three" },
  { number: 4, word: "four" },
  { number: 5, word: "five" }
];
let score = 0;
let optionRadius = 60;
let instructionDiv;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  instructionDiv = select('#instruction');
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  const vision = await window.FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  );

  handLandmarker = await window.HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/hand_landmarker.task',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });

  handsLoaded = true;
  generateQuestion();
}

function generateQuestion() {
  let randomPair = random(numberPairs);
  currentNumber = randomPair.number;
  correctAnswer = randomPair.word;
  options = [correctAnswer];

  while (options.length < 3) {
    let rand = random(numberPairs).word;
    if (!options.includes(rand)) options.push(rand);
  }

  shuffle(options);
}

function draw() {
  background('#ffe6a7');
  image(video, 0, 0, width, height);

  if (!handsLoaded) return;

  handLandmarker.detectForVideo(video.elt, performance.now()).then((results) => {
    if (!results || results.landmarks.length === 0) {
      redDot.held = false;
      return;
    }

    let hand = results.landmarks[0];
    let indexTip = hand[8];
    let thumbTip = hand[4];

    let ix = indexTip.x * width;
    let iy = indexTip.y * height;
    let tx = thumbTip.x * width;
    let ty = thumbTip.y * height;

    let d = dist(ix, iy, tx, ty);
    if (d < pinchThreshold) {
      redDot.held = true;
      redDot.x = (ix + tx) / 2;
      redDot.y = (iy + ty) / 2;
    } else {
      redDot.held = false;
    }

    fill(255, 0, 0, 180);
    noStroke();
    ellipse(redDot.x, redDot.y, redDot.r * 2);

    // 檢查是否進入選項
    for (let i = 0; i < options.length; i++) {
      let opt = optionPosition(i);
      fill(0, 100, 200);
      ellipse(opt.x, opt.y, optionRadius * 2);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(20);
      text(options[i], opt.x, opt.y);

      if (
        redDot.held &&
        dist(redDot.x, redDot.y, opt.x, opt.y) < optionRadius
      ) {
        if (options[i] === correctAnswer) {
          score++;
          instructionDiv.html(`答對了！目前分數：${score}`);
          generateQuestion();
        } else {
          instructionDiv.html(`錯了，再試一次！目前分數：${score}`);
        }
        redDot.held = false;
        break;
      }
    }

    // 顯示題目數字
    fill(0);
    textSize(64);
    textAlign(LEFT, CENTER);
    text(currentNumber, 40, height / 2);
  });

  // 分數顯示
  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);
  text('分數: ' + score, 20, 20);
}

function optionPosition(i) {
  let spacing = height / (options.length + 1);
  return {
    x: width - 150,
    y: spacing * (i + 1),
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
