// Hand Pose Detection with ml5.js
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
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  // 取得攝影機影像，並設定為左右顛倒
  video = createCapture(VIDEO, { mirrored: true });
  video.hide();

  // 開始偵測手部
  handPose.detectStart(video, gotHands);
}

function draw() {
  background('#5844cb');

  // 計算影像顯示的位置和大小
  let videoWidth = width * 0.8;
  let videoHeight = height * 0.8;
  let x = (width - videoWidth) / 2;
  let y = (height - videoHeight) / 2;

  // 顯示左右顛倒的攝影機影像
  push();
  translate(x + videoWidth, y);
  scale(-1, 1);
  image(video, 0, 0, videoWidth, videoHeight);
  pop();

  // 確保至少偵測到一隻手
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // 遍歷手部的關鍵點並繪製圓圈
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // 根據左右手設定不同的顏色
          if (hand.handedness == "Left") {
            fill(255, 0, 255); // 紫紅色
          } else {
            fill(255, 255, 0); // 黃色
          }

          noStroke();
          circle(keypoint.x - (width - videoWidth) / 2 - videoWidth, keypoint.y - (height - videoHeight) / 2, 16);
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
