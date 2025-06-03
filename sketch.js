let video;
let handtrackModel;
let hands = [];

// 遊戲相關變數
let currentNumber;
let options = [];
let score = 0;
let correctAnswer; // 儲存正確答案的英文單字
let gameStarted = false; // 遊戲是否已經開始
let feedbackMessage = ""; // 回饋訊息

// 數字與英文單字的對應
const numberWords = {
  0: "ZERO",
  1: "ONE",
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
  6: "SIX",
  7: "EIGHT",
  8: "NINE",
  9: "TEN",
};

// 選項框的尺寸和位置
const OPTION_WIDTH = 150;
const OPTION_HEIGHT = 60;
const OPTION_SPACING = 20; // 選項之間的間距

async function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  video = createCapture(VIDEO);
  video.size(width * 0.8, height * 0.8);
  video.hide();

  const modelParams = {
    flipHorizontal: true,
    maxNumHands: 1, // 這裡我們只偵測一隻手，方便單指點選
    scoreThreshold: 0.8
  };
  handtrackModel = await handtrack.load(modelParams);

  // 初始設定遊戲
  startNewRound();
  gameStarted = true;
}

function draw() {
  background('#5844cb');

  let videoWidth = width * 0.8;
  let videoHeight = height * 0.8;
  let videoX = (width - videoWidth) / 2;
  let videoY = (height - videoHeight) / 2;

  push();
  translate(videoWidth, 0);
  scale(-1, 1);
  image(video, 0, videoY, videoWidth, videoHeight);
  pop();

  predictHands();

  // 繪製手部關鍵點和連接線 (僅當偵測到手時繪製)
  for (let hand of hands) {
    stroke(255, 0, 0);
    strokeWeight(3);

    // 繪製連接線 (與之前相同，這裡簡化一下)
    let connections = [
      [0, 1, 2, 3, 4], // Thumb
      [5, 6, 7, 8],    // Index finger
      [9, 10, 11, 12], // Middle finger
      [13, 14, 15, 16], // Ring finger
      [17, 18, 19, 20]  // Pinky finger
    ];

    for (let connGroup of connections) {
      for (let i = 0; i < connGroup.length - 1; i++) {
        let p1 = hand.keypoints[connGroup[i]];
        let p2 = hand.keypoints[connGroup[i+1]];
        line(p1.x + videoX, p1.y + videoY, p2.x + videoX, p2.y + videoY);
      }
    }

    // 取得食指指尖 (keypoint 8)
    let indexFingerTip = hand.keypoints[8];
    fill(0, 255, 255); // 青色表示指尖
    ellipse(indexFingerTip.x + videoX, indexFingerTip.y + videoY, 20, 20); // 放大指尖圓圈

    // 偵測點擊
    if (gameStarted) {
      checkCollision(indexFingerTip.x + videoX, indexFingerTip.y + videoY);
    }
  }

  // 顯示數字題目
  fill(255);
  textSize(120);
  textAlign(CENTER, CENTER);
  // 將數字顯示在畫布的左側中央，與攝影機影像左側對齊
  text(currentNumber, videoX / 2 + videoX, height / 2);


  // 顯示選項
  for (let i = 0; i < options.length; i++) {
    let opt = options[i];
    let optX = width - videoX - OPTION_WIDTH; // 從右側計算位置
    let optY = (height - (options.length * (OPTION_HEIGHT + OPTION_SPACING))) / 2 + i * (OPTION_HEIGHT + OPTION_SPACING);

    // 繪製選項框
    fill(50, 150, 200); // 藍色選項框
    rect(optX, optY, OPTION_WIDTH, OPTION_HEIGHT, 10); // 圓角矩形

    // 繪製選項文字
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(opt, optX + OPTION_WIDTH / 2, optY + OPTION_HEIGHT / 2);
  }

  // 顯示分數
  fill(255);
  textSize(40);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);

  // 顯示回饋訊息
  fill(255, 255, 0); // 黃色
  textSize(40);
  textAlign(CENTER, BOTTOM);
  text(feedbackMessage, width / 2, height - 20);
}

// 偵測手部
async function predictHands() {
  if (video.loadedMetadata && handtrackModel) {
    const predictions = await handtrackModel.detect(video.elt);
    hands = predictions;
  }
}

// 檢查手指是否點擊到選項
function checkCollision(fingerX, fingerY) {
  for (let i = 0; i < options.length; i++) {
    let opt = options[i];
    let optX = width - (width * 0.8) / 2 - OPTION_WIDTH / 2; // 選項X座標 (大致對齊影像右側)
    let optY = (height - (options.length * (OPTION_HEIGHT + OPTION_SPACING))) / 2 + i * (OPTION_HEIGHT + OPTION_SPACING);

    // 重新計算選項的實際繪製位置
    let currentOptX = width - ((width - (width * 0.8)) / 2) - OPTION_WIDTH;
    let currentOptY = (height - (options.length * (OPTION_HEIGHT + OPTION_SPACING))) / 2 + i * (OPTION_HEIGHT + OPTION_SPACING);


    // 判斷手指尖是否在選項框內
    if (fingerX > currentOptX && fingerX < currentOptX + OPTION_WIDTH &&
        fingerY > currentOptY && fingerY < currentOptY + OPTION_HEIGHT) {
      // 避免重複計分
      if (feedbackMessage === "") { // 只有在沒有回饋訊息時才處理點擊
        if (opt === correctAnswer) {
          score += 1;
          feedbackMessage = "Correct!";
          console.log("Correct! Score: " + score);
        } else {
          feedbackMessage = "Incorrect.";
          console.log("Incorrect.");
        }
        // 點擊後等待一段時間再切換題目
        setTimeout(startNewRound, 1000); // 1秒後切換
      }
    }
  }
}


// 開始新一回合遊戲
function startNewRound() {
  feedbackMessage = ""; // 清除回饋訊息
  currentNumber = floor(random(0, 10)); // 0-9 隨機數字
  correctAnswer = numberWords[currentNumber];

  options = [];
  options.push(correctAnswer); // 加入正確答案

  // 加入其他錯誤選項
  let allNumbers = Object.keys(numberWords).map(Number);
  let incorrectNumbers = allNumbers.filter(n => n !== currentNumber);

  // 隨機選擇 2 到 3 個錯誤選項 (總共 3 到 4 個選項)
  while (options.length < 4) { // 固定顯示4個選項
    let randomIndex = floor(random(incorrectNumbers.length));
    let randomIncorrectNum = incorrectNumbers[randomIndex];
    let randomIncorrectWord = numberWords[randomIncorrectNum];

    if (!options.includes(randomIncorrectWord)) {
      options.push(randomIncorrectWord);
    }
    incorrectNumbers.splice(randomIndex, 1); // 避免重複選取
  }

  // 打亂選項順序
  options = shuffleArray(options);
}

// 輔助函數：打亂陣列順序
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(width * 0.8, height * 0.8);
  // 重新計算 videoX, videoY 以確保正確位置
  let newVideoWidth = width * 0.8;
  let newVideoHeight = height * 0.8;
  let newVideoX = (width - newVideoWidth) / 2;
  let newVideoY = (height - newVideoHeight) / 2;

  // 如果 video 元素需要重設位置，這裡可以加上
  // video.position(newVideoX, newVideoY);
}
