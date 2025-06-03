let video;
let handPose;
let hands = [];
let learningTargets = [
  { target: "A", gesture: "thumbUp" },
  { target: "B", gesture: "twoFingers" } // 你需要實現 "twoFingers" 的檢測
  // 可以添加更多字母和手勢
];
let currentTargetIndex = 0;
let currentTarget;
let score = 0;
let targetDisplay;
let scoreDisplay;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose.detectStart(video, gotHands);

  targetDisplay = select('#target');
  scoreDisplay = select('#score');

  nextTarget();
}

function nextTarget() {
  currentTargetIndex = floor(random(learningTargets.length));
  currentTarget = learningTargets[currentTargetIndex];
  targetDisplay.html(currentTarget.target);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  image(video, 0, 0);

  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // 繪製手部關鍵點
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          fill(255, 204, 0);
          noStroke();
          ellipse(keypoint.x, keypoint.y, 10, 10);
        }

        // 檢查手勢是否匹配
        if (checkGesture(hand, currentTarget.gesture)) {
          score++;
          scoreDisplay.html(score);
          nextTarget();
          // 可以添加成功的回饋動畫或音效
        }
      }
    }
  }
}

function checkGesture(hand, targetGesture) {
  if (targetGesture === "thumbUp") {
    // 檢查拇指是否豎起 (簡化判斷)
    const thumbTip = hand.keypoints[4];
    const indexTip = hand.keypoints[8];
    if (thumbTip && indexTip && thumbTip.y < indexTip.y && thumbTip.y < hand.keypoints[5].y) {
      // 確保拇指指尖高於拇指根部和食指指尖
      return true;
    }
  } else if (targetGesture === "twoFingers") {
    // 檢查是否伸出食指和中指 (需要更精確的判斷)
    const indexFingerTip = hand.keypoints[8];
    const middleFingerTip = hand.keypoints[12];
    const ringFingerTip = hand.keypoints[16];
    const pinkyFingerTip = hand.keypoints[20];

    const indexFingerBase = hand.keypoints[5];
    const middleFingerBase = hand.keypoints[9];
    const ringFingerBase = hand.keypoints[13];
    const pinkyFingerBase = hand.keypoints[17];

    if (indexFingerTip && middleFingerTip && indexFingerBase && middleFingerBase &&
        indexFingerTip.y < indexFingerBase.y &&
        middleFingerTip.y < middleFingerBase.y &&
        (ringFingerTip.y > ringFingerBase.y || !ringFingerTip) && // 確保無名指彎曲或不存在
        (pinkyFingerTip.y > pinkyFingerBase.y || !pinkyFingerTip)) { // 確保小指彎曲或不存在
      return true;
    }
  }
  return false;
}
