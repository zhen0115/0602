let video;
let handtrackModel;
let hands = [];

async function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  video = createCapture(VIDEO);
  video.size(width * 0.8, height * 0.8);
  video.hide();

  const modelParams = {
    flipHorizontal: true,
    maxNumHands: 2, // 允許偵測兩隻手
    scoreThreshold: 0.8
  };
  handtrackModel = await handtrack.load(modelParams);
}

function draw() {
  background('#5844cb');

  let videoWidth = width * 0.8;
  let videoHeight = height * 0.8;
  let x = (width - videoWidth) / 2;
  let y = (height - videoHeight) / 2;

  push();
  translate(videoWidth, 0);
  scale(-1, 1);
  image(video, 0, y, videoWidth, videoHeight);
  pop();

  predictHands();

  // 繪製手部關鍵點和連接線
  for (let hand of hands) {
    // 繪製關鍵點 (可選)
    for (let i = 0; i < hand.keypoints.length; i++) {
      const keypoint = hand.keypoints[i];
      fill(0, 255, 0);
      ellipse(keypoint.x + x, keypoint.y + y, 10, 10); // 加上偏移量以在正確位置繪製
    }

    stroke(255, 0, 0); // 設定線條顏色為紅色
    strokeWeight(3);

    // 連接關鍵點 0 到 4 (拇指)
    for (let i = 0; i < 4; i++) {
      line(hand.keypoints[i].x + x, hand.keypoints[i].y + y,
           hand.keypoints[i + 1].x + x, hand.keypoints[i + 1].y + y);
    }

    // 連接關鍵點 5 到 8 (食指)
    for (let i = 5; i < 8; i++) {
      line(hand.keypoints[i].x + x, hand.keypoints[i].y + y,
           hand.keypoints[i + 1].x + x, hand.keypoints[i + 1].y + y);
    }

    // 連接關鍵點 9 到 12 (中指)
    for (let i = 9; i < 12; i++) {
      line(hand.keypoints[i].x + x, hand.keypoints[i].y + y,
           hand.keypoints[i + 1].x + x, hand.keypoints[i + 1].y + y);
    }

    // 連接關鍵點 13 到 16 (無名指)
    for (let i = 13; i < 16; i++) {
      line(hand.keypoints[i].x + x, hand.keypoints[i].y + y,
           hand.keypoints[i + 1].x + x, hand.keypoints[i + 1].y + y);
    }

    // 連接關鍵點 17 到 20 (小指)
    for (let i = 17; i < 20; i++) {
      line(hand.keypoints[i].x + x, hand.keypoints[i].y + y,
           hand.keypoints[i + 1].x + x, hand.keypoints[i + 1].y + y);
    }
  }
}

async function predictHands() {
  if (video.loadedMetadata && handtrackModel) {
    const predictions = await handtrackModel.detect(video.elt);
    hands = predictions;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(width * 0.8, height * 0.8);
}
