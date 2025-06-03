// Hand Pose Detection with ml5.js for a Simple Shape Matching Game
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let targetShape = "三角形"; // 初始目標形狀
let score = 0;
let gameStatus = "playing"; // 遊戲狀態：playing, success, fail
let timer = 3; // 倒數計時器
let timerInterval;

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);

  // 初始化計時器
  startTimer();
}

function gotHands(results) {
  hands = results;
}

function draw() {
  image(video, 0, 0);

  // 繪製手部關鍵點
  drawHands();

  textSize(32);
  fill(255);
  textAlign(LEFT, TOP);
  text("比出: " + targetShape, 20, 20);
  text("分數: " + score, 20, 60);
  text("時間: " + timer, 20, 100);

  if (gameStatus === "playing") {
    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.3) { // 提高信賴度閾值
          if (targetShape === "三角形" && isMakingTriangle(hand)) {
            gameStatus = "success";
            clearInterval(timerInterval);
            setTimeout(nextRound, 2000); // 成功後等待 2 秒進入下一輪
          }
          // 可以添加其他形狀的判斷
        }
      }
    }
  } else if (gameStatus === "success") {
    fill(0, 255, 0, 200);
    rect(0, height / 2 - 50, width, 100);
    fill(255);
    textAlign(CENTER, CENTER);
    text("成功！", width / 2, height / 2);
  } else if (gameStatus === "fail") {
    fill(255, 0, 0, 200);
    rect(0, height / 2 - 50, width, 100);
    fill(255);
    textAlign(CENTER, CENTER);
    text("時間到！", width / 2, height / 2);
  }
}

function drawHands() {
  for (let hand of hands) {
    if (hand.confidence > 0.1) {
      for (let i = 0; i < hand.keypoints.length; i++) {
        let keypoint = hand.keypoints[i];
        fill(hand.handedness == "Left" ? color(255, 0, 255) : color(255, 255, 0));
        noStroke();
        circle(keypoint.x, keypoint.y, 16);
      }
    }
  }
}

function isMakingTriangle(hand) {
  // 獲取關鍵點的索引 (拇指尖, 食指尖, 中指尖)
  const thumbTip = hand.keypoints[4];
  const indexTip = hand.keypoints[8];
  const middleTip = hand.keypoints[12];

  // 確保關鍵點存在且信賴度足夠
  if (!thumbTip || !indexTip || !middleTip ||
      thumbTip.score < 0.6 || indexTip.score < 0.6 || middleTip.score < 0.6) {
    return false;
  }

  // 計算三個關鍵點之間的距離
  const dist1 = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
  const dist2 = dist(indexTip.x, indexTip.y, middleTip.x, middleTip.y);
  const dist3 = dist(middleTip.x, middleTip.y, thumbTip.x, thumbTip.y);

  // 判斷距離是否足夠大，並且大致形成一個三角形
  // 這裡的閾值可能需要根據實際測試調整
  const minDistance = 50;
  const maxRatio = 1.5; // 允許邊長比例在一定範圍內

  if (dist1 > minDistance && dist2 > minDistance && dist3 > minDistance) {
    const sides = [dist1, dist2, dist3].sort((a, b) => a - b);
    // 檢查最長邊是否沒有明顯大於其他邊 (避免形成直線)
    return sides[2] < sides[0] + sides[1] * maxRatio;
  }

  return false;
}

function startTimer() {
  timer = 3;
  timerInterval = setInterval(() => {
    timer--;
    if (timer < 0) {
      gameStatus = "fail";
      clearInterval(timerInterval);
      setTimeout(resetGame, 3000); // 失敗後等待 3 秒重置遊戲
    }
  }, 1000);
}

function nextRound() {
  score++;
  targetShape = getRandomShape();
  gameStatus = "playing";
  startTimer();
}

function resetGame() {
  score = 0;
  targetShape = getRandomShape();
  gameStatus = "playing";
  startTimer();
}

function getRandomShape() {
  const shapes = ["三角形"]; // 目前只有三角形
  return random(shapes);
}
