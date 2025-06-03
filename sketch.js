let video; // 宣告一個變數來存放攝影機影像
let score = 0; // 儲存分數
let currentNumber; // 當前顯示的數字題目
let options = []; // 儲存英文選項
let correctOptionIndex; // 正確答案在 options 陣列中的索引
let numberToWordMap; // 數字到英文單字的映射

let model = null; // 宣告 handtrack 模型變數
const modelParams = {
  flipHorizontal: false, // 攝影機影像在 draw 中會透過 scale(-1, 1) 翻轉，handtrack模型本身不需翻轉原始輸入
  maxNumBoxes: 1,       // 最多偵測一隻手
  iouThreshold: 0.5,    // 交集與聯集比值閾值
  scoreThreshold: 0.7,  // 偵測分數閾值
};

let predictions = []; // 用於記錄手部偵測的框框和分數

// 用於偵測手勢點擊的變數
let handClickThreshold = 0.8; // 手部偵測分數閾值，高於此值才算有效手勢
let lastHandActionTime = 0; // 上次手部動作（點擊）的時間
let debounceTime = 700; // 手勢去抖動時間（毫秒），防止連續觸發，稍微拉長一點

function setup() {
  // 創建一個全螢幕畫布，背景顏色設定為 #5844cb
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  // 創建攝影機捕捉物件
  // createCapture(VIDEO) 預設是會將影像鏡像翻轉的，所以 handtrack 的 flipHorizontal 應設為 false。
  video = createCapture(VIDEO);
  video.size(width * 0.8, height * 0.8); // 設定影像寬高為視窗的 80%
  video.hide(); // 隱藏預設的 HTML 影像元素

  // 載入 handtrack 模型
  handtrack.load(modelParams).then(lmodel => {
    model = lmodel;
    console.log("Handtrack Model Loaded!");
    // 開始偵測影片流
    model.detect(video.elt).then(preds => {
      predictions = preds;
      // 可以在這裡開始偵測，或者在 draw 迴圈中持續偵測
      // 為了持續偵測，我們通常會在 draw 裡調用 model.detect()
    });
  }).catch(err => {
    console.error("Error loading Handtrack Model:", err);
    alert("載入手部追蹤模型失敗，請檢查網路連線或函式庫載入。");
  });

  // 初始化數字到英文單字的映射
  numberToWordMap = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "five",
    5: "five", // 修正：數字 4, 5 的英文
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten"
  };

  generateNewQuestion(); // 生成第一道題目
}

function draw() {
  background('#5844cb'); // 重新設定背景顏色

  // 顯示分數
  fill(255);
  textSize(32);
  textAlign(RIGHT, TOP);
  text(`Score: ${score}`, width - 20, 20);

  // 計算攝影機影像在畫布上的實際位置和大小
  // 由於攝影機影像寬高是視窗的 80%，並且要置中
  let videoDisplayWidth = width * 0.8;
  let videoDisplayHeight = height * 0.8;
  let videoDisplayX = (width - videoDisplayWidth) / 2;
  let videoDisplayY = (height - videoDisplayHeight) / 2;

  push(); // 儲存繪圖狀態
  translate(width, 0); // 將原點移到右邊
  scale(-1, 1); // 左右翻轉，實現鏡像效果 (因為攝影機影像本身可能已經鏡像了，這裡確保總體是鏡像)
  // 如果 createCapture(VIDEO) 已經自動鏡像，且你希望 final 效果是左右顛倒的，那麼這裡的 scale(-1,1) 是對的
  // 如果你希望顯示非鏡像（就像真實攝影機看到的那樣），那麼 createCapture() 應該是沒翻轉，而這裡的 scale(-1,1) 也應該去掉。
  // 根據你想要的 "攝影機畫面左右顛倒" 效果，scale(-1,1) 是正確的。
  
  // 繪製攝影機影像，考慮翻轉和置中
  // 由於前面 translate(width, 0) 和 scale(-1, 1) 的影響
  // 影像的 X 座標計算變為 -(videoDisplayX + videoDisplayWidth)
  image(video, -(videoDisplayX + videoDisplayWidth), videoDisplayY, videoDisplayWidth, videoDisplayHeight);
  pop(); // 恢復繪圖狀態

  // 執行手部偵測
  if (model) {
    model.detect(video.elt).then(preds => {
      predictions = preds; // 更新偵測結果
    }).catch(err => {
      console.error("Error during hand detection:", err);
      // 可以考慮在這裡停止偵測或顯示錯誤訊息
    });
  }

  // 繪製偵測到的手部框框並處理點擊
  if (predictions.length > 0 && predictions[0].score > handClickThreshold) {
    let p = predictions[0]; // 只處理第一個偵測到的手

    // 將 handtrack 偵測到的座標轉換到畫布上顯示的攝影機影像位置
    // handtrack 的座標是基於原始 video.elt 的解析度
    // p[0], p[1] 是 bounding box 的 x, y
    // p[2], p[3] 是 bounding box 的 width, height
    
    // 計算手部在原始影片流中的中心點 (考慮到 video.size 設定)
    // 假設 video.elt.videoWidth 是攝影機原始寬度，video.width 是 p5 顯示寬度
    let handXInVideo = p[0] + p[2] / 2; // 手部在原始 video.elt 中的 X 中心
    let handYInVideo = p[1] + p[3] / 2; // 手部在原始 video.elt 中的 Y 中心

    // 將手部中心點轉換到 p5 畫布上的顯示位置
    // 考慮到攝影機影像的置中和大小縮放 (video.size)
    // 以及影像在 draw 中被 scale(-1,1) 翻轉
    
    // 由於我們在 draw 裡面對整個畫布做 scale(-1, 1)，手部偵測框的繪製也需要逆向處理
    // 如果 handtrack.js 的 output 是基於非翻轉的原始影像，那麼我們在繪製時需要將 x 座標翻轉
    
    // 翻轉 X 座標：從原始影像的左到右，變成畫布上翻轉後的右到左
    // 原始 video.elt 寬度是 video.elt.videoWidth
    // 顯示在 p5 畫布上的 video 寬度是 videoDisplayWidth
    // 手部在原始影像中的 x: p[0]
    // 顯示時的 x 座標應該是 (videoDisplayX + videoDisplayWidth) - (p[0] + p[2]) * (videoDisplayWidth / video.elt.videoWidth);
    // 加上 videoDisplayX 是為了讓它在整個畫布中置中
    let handDisplayX = videoDisplayX + videoDisplayWidth - (p[0] + p[2]); // 調整 X 座標以匹配翻轉
    let handDisplayY = videoDisplayY + p[1]; // Y 座標不變

    // 繪製手部偵測框 (視覺化)
    noFill();
    stroke(0, 255, 0); // 綠色框
    strokeWeight(4);
    rectMode(CORNER); // 以左上角繪製矩形
    // 這裡直接繪製原始偵測框，但考慮到影像縮放和位置
    // p[0], p[1] 是原始影片流中的像素座標
    // video.elt.videoWidth, video.elt.videoHeight 是原始影片流的解析度
    // videoDisplayWidth, videoDisplayHeight 是實際繪製的尺寸
    let rectX = videoDisplayX + (videoDisplayWidth - (p[0] + p[2])) ; // 翻轉 X 軸
    let rectY = videoDisplayY + p[1];
    let rectW = p[2];
    let rectH = p[3];

    // 根據影像縮放比例調整矩形大小
    rect(videoDisplayX + (video.width - (p[0] + p[2]) ) , videoDisplayY + p[1], p[2], p[3]); // 修正繪製位置

    // 處理手勢點擊
    let currentTime = millis();
    if (currentTime - lastHandActionTime > debounceTime) {
      // 根據手部偵測的中心點來判斷點擊
      // 我們需要將手部偵測到的點映射到畫布上的座標
      // 由於影像已經翻轉了，手部中心點的 X 也要相對翻轉
      let mappedHandX = videoDisplayX + (videoDisplayWidth - (p[0] + p[2]/2) * (videoDisplayWidth / video.elt.videoWidth));
      let mappedHandY = videoDisplayY + (p[1] + p[3]/2) * (videoDisplayHeight / video.elt.videoHeight);


      let optionY = height / 2 - (options.length / 2) * 40; // 選項文字的起始 Y 座標

      for (let j = 0; j < options.length; j++) {
        let optX = width * 0.25; // 選項的 X 座標
        let optY = optionY + j * 50; // 每個選項間隔 50 像素

        let textW = textWidth(options[j]);
        // 計算選項點擊區域的中心點和寬高
        let rectCenterX = optX + textW / 2 + 10;
        let rectCenterY = optY;
        let rectWidth = textW + 40;
        let rectHeight = 40;

        // 判斷手部中心點是否在選項的矩形區域內
        if (mappedHandX > rectCenterX - rectWidth / 2 && mappedHandX < rectCenterX + rectWidth / 2 &&
            mappedHandY > rectCenterY - rectHeight / 2 && mappedHandY < rectCenterY + rectHeight / 2) {
          handleOptionClick(j);
          lastHandActionTime = currentTime; // 更新上次動作時間
          break;
        }
      }
    }
  }

  // 顯示數字題目 (攝影機左邊，位於藍色背景上)
  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER);
  // 將數字題目放在攝影機畫面左側，並根據攝影機的 X 座標和寬度來調整
  // 攝影機左側的背景是寬度 * 0.125 的區域
  text(currentNumber, (width - videoDisplayWidth) / 4, height / 2);

  // 顯示英文選項 (數字題目旁邊，位於藍色背景上)
  textSize(32);
  let optionY = height / 2 - (options.length / 2) * 40; // 選項文字的起始 Y 座標
  for (let i = 0; i < options.length; i++) {
    // 選項的 X 座標，放在數字題目和攝影機影像之間
    let x = (width - videoDisplayWidth) / 2 + (width - videoDisplayWidth) / 4;
    let y = optionY + i * 50;

    // 繪製選項框 (視覺化點擊區域)
    noFill();
    stroke(255);
    strokeWeight(1);
    rectMode(CENTER);
    // 計算選項框的中心點
    let optionRectCenterX = x + textWidth(options[i]) / 2 + 10;
    let optionRectCenterY = y;
    let optionRectWidth = textWidth(options[i]) + 40;
    let optionRectHeight = 40;

    rect(optionRectCenterX, optionRectCenterY, optionRectWidth, optionRectHeight);

    fill(255);
    textAlign(LEFT, CENTER);
    text(options[i], x, y);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(width * 0.8, height * 0.8);
  background('#5844cb');
  // 重新載入手部追蹤模型（如果需要，或者在 resize 後重新呼叫 detect）
  if (model) {
    model.detect(video.elt).then(preds => predictions = preds);
  }
}

// 處理滑鼠點擊事件 (保留滑鼠點擊功能作為備用)
function mousePressed() {
  let optionY = height / 2 - (options.length / 2) * 40;

  for (let i = 0; i < options.length; i++) {
    // 計算選項的 X 座標，與 draw 函數中繪製選項的位置保持一致
    let x = (width - videoDisplayWidth) / 2 + (width - videoDisplayWidth) / 4;
    let y = optionY + i * 50;

    let textW = textWidth(options[i]);
    let rectCenterX = x + textW / 2 + 10;
    let rectCenterY = y;
    let rectWidth = textW + 40;
    let rectHeight = 40;

    if (mouseX > rectCenterX - rectWidth / 2 && mouseX < rectCenterX + rectWidth / 2 &&
        mouseY > rectCenterY - rectHeight / 2 && mouseY < rectCenterY + rectHeight / 2) {
      handleOptionClick(i);
      break;
    }
  }
}

// 統一處理選項點擊的邏輯 (無論是滑鼠還是手勢)
function handleOptionClick(clickedIndex) {
  if (clickedIndex === correctOptionIndex) {
    score++;
    console.log("Correct! Score: " + score);
  } else {
    console.log("Incorrect. Score: " + score);
  }
  generateNewQuestion();
}

// 生成新的數字題目和選項
function generateNewQuestion() {
  currentNumber = floor(random(0, 11));

  let correctAnswer = numberToWordMap[currentNumber];
  options = [];

  options.push(correctAnswer);

  while (options.length < 3) {
    let randomNum = floor(random(0, 11));
    let randomWord = numberToWordMap[randomNum];
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
  }

  shuffleArray(options);
  correctOptionIndex = options.indexOf(correctAnswer);

  console.log("New question:", currentNumber, "Options:", options, "Correct:", correctAnswer);
}

// 隨機打亂陣列的函數 (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
