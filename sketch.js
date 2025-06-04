// Hand Pose Quiz Game with ml5.js
// 遊戲規則：左側顯示數字，右側三個英文單字選項，食指指向正確選項得分

let video;
let handPose;
let hands = [];

// 題庫與分數
const numberWords = [
  { num: 1, word: "one" },
  { num: 2, word: "two" },
  { num: 3, word: "three" },
  { num: 4, word: "four" },
  { num: 5, word: "five" },
  { num: 6, word: "six" },
  { num: 7, word: "seven" },
  { num: 8, word: "eight" },
  { num: 9, word: "nine" },
  { num: 10, word: "ten" }
];
let score = 0;
let currentQuestion;
let options = [];
let optionPositions = [];
let message = "";
let showMessageTimer = 0;
const messageDuration = 60; // 幀數顯示訊息
const optionBoxW = 180;
const optionBoxH = 60;
const optionBoxMargin = 30;
const detectThreshold = 50; // 可維持原本的碰撞半徑

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  centerCanvas();
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);
  resetGame();
}

function centerCanvas() {
  // 將畫布移到視窗正中央
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  let cnv = document.getElementsByTagName('canvas')[0];
  if (cnv) {
    cnv.style.position = 'absolute';
    cnv.style.left = x + 'px';
    cnv.style.top = y + 'px';
  }
}

function windowResized() {
  centerCanvas();
}

let gameOver = false;
let gameStarted = false;
let showStartBtn = true;
let countdown = 0;
let countdownTimer = 0;
let waitingForStartTouch = false;

function draw() {
  background(255);
  image(video, 0, 0);

  // 遊戲尚未開始，僅顯示「開始遊戲」按鈕
  if (showStartBtn) {
    let btnX = width / 2, btnY = height - 120, btnR = 70;
    stroke(30, 80, 200);
    strokeWeight(6);
    fill(255);
    ellipse(btnX, btnY, btnR * 2, btnR * 2);
    fill(30, 80, 200);
    noStroke();
    textSize(36);
    textAlign(CENTER, CENTER);
    text("開始遊戲", btnX, btnY);
    // 判斷食指是否碰到按鈕
    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.1) {
          let indexFinger = hand.keypoints[8];
          fill(255, 0, 0);
          noStroke();
          circle(indexFinger.x, indexFinger.y, 24);
          let d = dist(indexFinger.x, indexFinger.y, btnX, btnY);
          if (d < btnR) {
            waitingForStartTouch = true;
          }
        }
      }
    }
    if (waitingForStartTouch) {
      countdown = 3;
      countdownTimer = frameCount;
      showStartBtn = false;
      waitingForStartTouch = false;
    }
    return;
  }

  // 倒數階段
  if (countdown > 0) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(100);
    textAlign(CENTER, CENTER);
    text(countdown, width / 2, height / 2);
    if (frameCount - countdownTimer > 60) { // 每秒倒數
      countdown--;
      countdownTimer = frameCount;
    }
    if (countdown === 0) {
      gameStarted = true;
      resetGame();
    }
    return;
  }

  if (!gameStarted) return;

  // 顯示分數
  fill(0);
  textSize(28);
  textAlign(LEFT, TOP);
  text("分數: " + score, 16, 10);

  if (gameOver) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("遊戲結束！\n你的分數: " + score, width / 2, height / 2 - 40);
    // 顯示再玩一次圓形按鈕（下方）
    let btnX = width / 2, btnY = height - 120, btnR = 70;
    stroke(30, 80, 200);
    strokeWeight(6);
    fill(255);
    ellipse(btnX, btnY, btnR * 2, btnR * 2);
    fill(30, 80, 200);
    noStroke();
    textSize(32);
    textAlign(CENTER, CENTER);
    text("再玩一次", btnX, btnY);
    // 判斷食指是否碰到按鈕
    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.1) {
          let indexFinger = hand.keypoints[8];
          fill(255, 0, 0);
          noStroke();
          circle(indexFinger.x, indexFinger.y, 24);
          let d = dist(indexFinger.x, indexFinger.y, btnX, btnY);
          if (d < btnR) {
            waitingForStartTouch = true;
          }
        }
      }
    }
    if (waitingForStartTouch) {
      countdown = 3;
      countdownTimer = frameCount;
      showStartBtn = false;
      waitingForStartTouch = false;
      gameOver = false;
      gameStarted = false;
    }
    return;
  }

  // 顯示題目（左側大數字或動物，無外框）
  let topicCenterX = 120;
  let topicCenterY = height / 2;
  textSize(80);
  textAlign(CENTER, CENTER);
  fill(30, 80, 200);
  noStroke();
  text(currentQuestion.num, topicCenterX, topicCenterY);

  // 顯示三個選項（右側，圓形藍色外框，黑色文字，縮小圓形避免重疊）
  textSize(36);
  textAlign(CENTER, CENTER);
  const optionCircleR = 55; // 半徑55，直徑110
  for (let i = 0; i < options.length; i++) {
    let pos = optionPositions[i];
    // 畫圓形藍色外框
    stroke(30, 80, 200);
    strokeWeight(4);
    fill(255);
    ellipse(pos.x + optionBoxW / 2, pos.y + optionBoxH / 2, optionCircleR * 2, optionCircleR * 2);
    // 黑色文字
    fill(0);
    noStroke();
    text(options[i], pos.x + optionBoxW / 2, pos.y + optionBoxH / 2);
  }

  // 顯示訊息
  if (showMessageTimer > 0) {
    fill(0, 180);
    rect(0, height - 60, width, 60);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(message, width / 2, height - 30);
    showMessageTimer--;
  }

  // 偵測食指碰撞選項
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        let indexFinger = hand.keypoints[8];
        // 畫出食指圓點
        fill(255, 0, 0);
        noStroke();
        circle(indexFinger.x, indexFinger.y, 24);
        // 檢查是否碰到任一選項
        for (let i = 0; i < optionPositions.length; i++) {
          let pos = optionPositions[i];
          let centerX = pos.x + optionBoxW / 2;
          let centerY = pos.y + optionBoxH / 2;
          let d = dist(indexFinger.x, indexFinger.y, centerX, centerY);
          if (d < detectThreshold) {
            handleAnswer(i, d);
            break;
          }
        }
      }
    }
  }

  // 偵測手指離開選項
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        let indexFinger = hand.keypoints[8];
        // 畫出食指圓點
        fill(255, 0, 0);
        noStroke();
        circle(indexFinger.x, indexFinger.y, 24);
        checkResetJudge(indexFinger);
      }
    }
  }
}

function gotHands(results) {
  hands = results;
}

let canJudge = true;
let lastSelected = -1;

function handleAnswer(selectedIdx, distVal) {
  if (showMessageTimer > 0 || gameOver) return;
  if (!canJudge) return;
  if (lastSelected !== selectedIdx) {
    canJudge = true;
  }
  if (canJudge) {
    if (options[selectedIdx] === currentQuestion.word) {
      score++;
      message = "答對了！+1分";
      showMessageTimer = messageDuration;
      canJudge = false;
      lastSelected = selectedIdx;
      if (score >= 10) {
        setTimeout(() => { gameOver = true; }, 600);
      } else {
        setTimeout(() => {
          nextQuestion();
          canJudge = true;
          lastSelected = -1;
        }, 600);
      }
    } else {
      message = "再試一次！";
      showMessageTimer = messageDuration;
      canJudge = false;
      lastSelected = selectedIdx;
      setTimeout(() => {
        canJudge = true;
        lastSelected = -1;
      }, 600);
    }
  }
}

function nextQuestion() {
  // 隨機選一題
  currentQuestion = random(numberWords);
  // 產生選項
  let optionSet = [currentQuestion.word];
  while (optionSet.length < 3) {
    let w = random(numberWords).word;
    if (!optionSet.includes(w)) optionSet.push(w);
  }
  shuffle(optionSet, true);
  options = optionSet;
  // 計算選項位置（右側垂直排列，間距加大避免重疊）
  optionPositions = [];
  const optionCircleR = 55;
  let totalH = 3 * optionCircleR * 2 + 2 * 50; // 3個圓+2個間隔
  let startY = (height - totalH) / 2;
  for (let i = 0; i < 3; i++) {
    optionPositions.push({
      x: width - optionCircleR * 2 - 40,
      y: startY + i * (optionCircleR * 2 + 50)
    });
  }
}

function resetGame() {
  score = 0;
  message = "";
  showMessageTimer = 0;
  gameOver = false;
  nextQuestion();
}

function keyPressed() {
  if (key === "r" || key === "R") {
    resetGame();
  }
}

// 只要食指離開所有選項範圍，才允許再次判定
function checkResetJudge(indexFinger) {
  let out = true;
  for (let i = 0; i < optionPositions.length; i++) {
    let pos = optionPositions[i];
    let centerX = pos.x + optionBoxW / 2;
    let centerY = pos.y + optionBoxH / 2;
    let d = dist(indexFinger.x, indexFinger.y, centerX, centerY);
    if (d < detectThreshold) {
      out = false;
      break;
    }
  }
  if (out) {
    canJudge = true;
    lastSelected = -1;
  }
}
