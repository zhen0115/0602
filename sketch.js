let video; // 宣告一個變數來存放攝影機影像
let score = 0; // 儲存分數
let currentNumber; // 當前顯示的數字題目
let options = []; // 儲存英文選項
let correctOptionIndex; // 正確答案在 options 陣列中的索引
let numberToWordMap; // 數字到英文單字的映射

let model = null; // 宣告 handtrack 模型變數
const modelParams = {
  flipHorizontal: true, // 攝影機影像已在 draw 中翻轉，所以這裡也翻轉
  maxNumBoxes: 1,       // 最多偵測一隻手
  iouThreshold: 0.5,    // 交集與聯集比值閾值
  scoreThreshold: 0.7,  // 偵測分數閾值
};

// 用於記錄手部偵測的框框和分數
let predictions = [];

// 用於偵測手勢點擊的變數
let handClickThreshold = 0.8; // 手部偵測分數閾值，高於此值才算有效手勢
let lastHandDetectedTime = 0; // 上次偵測到手部的時間
let debounceTime = 500; // 手勢去抖動時間（毫秒），防止連續觸發

function setup() {
  // 創建一個全螢幕畫布，背景顏色設定為 #5844cb
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  // 創建攝影機捕捉物件
  video = createCapture(VIDEO);
  video.size(width * 0.8, height * 0.8); // 設定影像寬高為視窗的 80%
  video.hide(); // 隱藏預設的 HTML 影像元素

  // 載入 handtrack 模型
  // 注意：load() 是一個異步操作，所以會返回一個 Promise
  handtrack.load(modelParams).then(lmodel => {
    model = lmodel;
    console.log("Handtrack Model Loaded!");
  });

  // 初始化數字到英文單字的映射
  numberToWordMap = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten"
  };

  generateNewQuestion(); // 生成第一道題目
}

function draw() {
  // 在 draw 迴圈中重新設定背景顏色，確保每次繪製時都能覆蓋之前的內容
  background('#5844cb');

  // 顯示分數
  fill(255); // 白色文字
  textSize(32);
  textAlign(RIGHT, TOP); // 文字右對齊，頂部對齊
  text(`Score: ${score}`, width - 20, 20); // 顯示在右上角

  // 將畫布的原點移動到視窗中央，以便後續定位影像
  push(); // 儲存當前繪圖狀態
  translate(width / 2, height / 2);

  // 將 x 軸縮放因子設定為 -1，實現左右顛倒效果
  scale(-1, 1);

  // 在中央繪製攝影機影像
  // 影像的 (x, y) 座標為其左上角，由於我們已將原點移到中心，
  // 所以需要將影像的左上角往左上偏移影像寬高的一半，使其中心對齊畫布中心。
  image(video, -video.width / 2, -video.height / 2);
  pop(); // 恢復之前儲存的繪圖狀態，避免影響後續的文字繪製

  // 執行手部偵測
  if (model) { // 確保模型已載入
    // predict() 也是異步操作，但我們在 draw 中直接呼叫，它會非同步地更新 predictions
    model.detect(video.elt).then(preds => {
      predictions = preds; // 更新偵測結果
      // console.log(predictions); // 用於除錯，可以看到偵測到的手部資訊
    });
  }

  // 繪製偵測到的手部框框 (可選，用於視覺化)
  for (let i = 0; i < predictions.length; i++) {
    let p = predictions[i];
    if (p.score > handClickThreshold) { // 只顯示置信度高的手
      // 注意：這裡的座標需要轉換，因為攝影機影像在 draw 中被翻轉和移動了
      // 由於 handtrack 的預測是基於原始影像的，所以我們需要逆向轉換
      let x = width / 2 - (p[0] + p[2]) / 2; // X 座標需要翻轉並重新計算
      let y = height / 2 - video.height / 2 + p[1]; // Y 座標不需要翻轉
      let w = p[2];
      let h = p[3];

      // 由於手影像左右顛倒，所以這裡繪製矩形時 x 軸也需要對稱處理
      // (p[0] + p[2]) / 2 是手部偵測框的中心點在原始影像中的x座標
      // width / 2 是畫布中心點
      // -video.width / 2 是影像在畫布中的左上角x座標 (經過 translate 後)

      // 由於我們在 image 繪製時用了 scale(-1, 1) 和 translate(width/2, height/2)
      // handtrack 的預測結果是基於原始 video.elt 的，所以要將其轉換到畫布座標
      // video.elt 的尺寸是 video.width, video.height
      // 影像在畫布中的起始點是 (width/2 - video.width/2, height/2 - video.height/2)
      // 且影像被左右翻轉
      let mappedX = map(p[0] + p[2], 0, video.width, width / 2 - video.width / 2, width / 2 + video.width / 2); // 翻轉 X 軸
      let mappedY = map(p[1], 0, video.height, height / 2 - video.height / 2, height / 2 + video.height / 2);

      noFill();
      stroke(0, 255, 0); // 綠色框
      strokeWeight(4);
      // 繪製手部框框。這裡的座標轉換需要特別小心，因為影像被翻轉了。
      // 最簡單的方式是將 handtrack 的預測框直接繪製在原始影像位置，然後讓 p5 的 scale 處理。
      // 但由於 draw() 函數中的 push/pop, 我們需要將 handtrack 偵測到的原始座標轉換到螢幕顯示座標。
      // 更直接的方式是直接使用手部偵測的座標，並根據螢幕上的攝影機位置進行調整。
      // 我們知道影像的中心在 (width/2, height/2)
      // 影像的左上角在 (width/2 - video.width/2, height/2 - video.height/2)
      // 而影像被 scale(-1, 1) 了
      // 所以手部 x 座標需要從影像的右邊算起
      
      // 計算手部在螢幕上的實際中心點
      let handCenterX = width / 2 + video.width / 2 - (p[0] + p[2] / 2) * (video.width / video.elt.videoWidth);
      let handCenterY = height / 2 - video.height / 2 + (p[1] + p[3] / 2) * (video.height / video.elt.videoHeight);
      
      let handWidth = p[2] * (video.width / video.elt.videoWidth);
      let handHeight = p[3] * (video.height / video.elt.videoHeight);

      // 繪製手部偵測框
      rect(handCenterX - handWidth / 2, handCenterY - handHeight / 2, handWidth, handHeight);


      // 偵測手勢點擊（基於手部位置）
      // 假設手部中心點位於某個選項的範圍內，且偵測分數夠高
      let currentTime = millis();
      if (currentTime - lastHandDetectedTime > debounceTime) { // 去抖動
        let handX = handCenterX; // 手部中心點的 X 座標
        let handY = handCenterY; // 手部中心點的 Y 座標

        let optionY = height / 2 - (options.length / 2) * 40;
        for (let j = 0; j < options.length; j++) {
          let optX = width * 0.25;
          let optY = optionY + j * 50;

          let textW = textWidth(options[j]);
          let rectX = optX + textW / 2 + 10;
          let rectY = optY;
          let rectW = textW + 40;
          let rectH = 40;

          // 判斷手部是否在選項的點擊區域內
          if (handX > rectX - rectW / 2 && handX < rectX + rectW / 2 &&
              handY > rectY - rectH / 2 && handY < rectY + rectH / 2) {
            // 如果手部在選項區域內，觸發點擊
            handleOptionClick(j); // 呼叫處理選項點擊的函數
            lastHandDetectedTime = currentTime; // 更新上次手部偵測時間
            break; // 處理完一個選項就退出
          }
        }
      }
    }
  }

  // 顯示數字題目（攝影機左邊）
  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER); // 文字置中
  text(currentNumber, width * 0.1, height / 2); // 顯示在攝影機影像左側大概 10% 寬度處

  // 顯示英文選項（數字題目旁邊）
  textSize(32);
  let optionY = height / 2 - (options.length / 2) * 40; // 計算第一個選項的起始 Y 座標
  for (let i = 0; i < options.length; i++) {
    let x = width * 0.25; // 選項的 X 座標
    let y = optionY + i * 50; // 每個選項間隔 50 像素

    // 繪製選項框（可選，幫助視覺化點擊區域）
    noFill(); // 無填充
    stroke(255); // 白色邊框
    strokeWeight(1);
    rectMode(CENTER); // 以中心點繪製矩形
    rect(x + textWidth(options[i]) / 2 + 10, y, textWidth(options[i]) + 40, 40); // 繪製一個圍繞文字的矩形

    fill(255); // 白色文字
    textAlign(LEFT, CENTER); // 文字左對齊，置中
    text(options[i], x, y); // 繪製選項文字
  }
}

// 當視窗大小改變時，重新調整畫布大小和攝影機影像大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(width * 0.8, height * 0.8);
  background('#5844cb'); // 確保背景顏色在視窗改變時也正確
}

// 處理滑鼠點擊事件 (保留滑鼠點擊功能作為備用)
function mousePressed() {
  let optionY = height / 2 - (options.length / 2) * 40;

  for (let i = 0; i < options.length; i++) {
    let x = width * 0.25;
    let y = optionY + i * 50;

    let textW = textWidth(options[i]);
    let rectX = x + textW / 2 + 10;
    let rectY = y;
    let rectW = textW + 40;
    let rectH = 40;

    if (mouseX > rectX - rectW / 2 && mouseX < rectX + rectW / 2 &&
        mouseY > rectY - rectH / 2 && mouseY < rectY + rectH / 2) {
      handleOptionClick(i);
      break;
    }
  }
}

// 統一處理選項點擊的邏輯 (無論是滑鼠還是手勢)
function handleOptionClick(clickedIndex) {
  if (clickedIndex === correctOptionIndex) {
    score++; // 答對了，加分
    console.log("Correct! Score: " + score);
  } else {
    console.log("Incorrect. Score: " + score);
  }
  generateNewQuestion(); // 無論對錯，都換下一題
}


// 生成新的數字題目和選項
function generateNewQuestion() {
  currentNumber = floor(random(0, 11)); // 生成一個 0 到 10 的隨機整數

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
