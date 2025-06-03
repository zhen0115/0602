let video; // 攝影機影像
let score = 0; // 分數
let currentNumber; // 當前數字題目
let options = []; // 英文選項
let correctOptionIndex; // 正確答案索引
let numberToWordMap; // 數字到英文單字映射

let model = null; // handtrack 模型變數
const modelParams = {
  // handtrack.js 的 `flipHorizontal` 應該與 createCapture 的預設行為一致
  // createCapture 預設是鏡像的，所以設為 true 讓 handtrack 匹配它。
  // 我們稍後會用 p5 的 scale(-1, 1) 來達到最終「左右顛倒」的顯示效果。
  flipHorizontal: true, // 假設攝影機輸入是鏡像的，或模型需要鏡像輸入進行預測
  maxNumBoxes: 1,       // 最多偵測一隻手
  iouThreshold: 0.5,    // 交集與聯集比值閾值
  scoreThreshold: 0.7,  // 偵測分數閾值，高於此值才算有效偵測
};

let predictions = []; // 儲存手部偵測結果

// 用於偵測手勢點擊的變數
let lastHandActionTime = 0; // 上次手部動作（點擊）的時間
let debounceTime = 800; // 手勢去抖動時間（毫秒），稍微拉長一點以避免誤觸

// 視覺化除錯用：手部偵測點
let debugHandPoint = { x: -1, y: -1 };

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  // 創建攝影機捕捉物件
  video = createCapture(VIDEO);
  video.size(width * 0.8, height * 0.8); // 攝影機畫面寬高為視窗的 80%
  video.hide(); // 隱藏預設的 HTML 影像元素

  // 載入 handtrack 模型
  handtrack.load(modelParams).then(lmodel => {
    model = lmodel;
    console.log("Handtrack Model Loaded!");
    startHandDetection(); // 模型載入後開始持續偵測
  }).catch(err => {
    console.error("Error loading Handtrack Model:", err);
    alert("載入手部追蹤模型失敗，請檢查網路連線或函式庫載入。");
  });

  numberToWordMap = {
    0: "zero", 1: "one", 2: "two", 3: "three", 4: "four",
    5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten"
  };

  generateNewQuestion(); // 生成第一道題目
}

// 持續進行手部偵測的函數
function startHandDetection() {
  if (model && video.elt) {
    model.detect(video.elt).then(preds => {
      predictions = preds; // 更新偵測結果
      requestAnimationFrame(startHandDetection); // 使用 requestAnimationFrame 進行下一次偵測
    }).catch(err => {
      console.error("Error during hand detection:", err);
      // 如果偵測出錯，可以考慮停止偵測或重試
    });
  } else {
    // 如果模型或影片元素尚未準備好，等待並重試
    requestAnimationFrame(startHandDetection);
  }
}

function draw() {
  background('#5844cb'); // 重新設定背景顏色

  // 顯示分數
  fill(255); // 白色文字
  textSize(32);
  textAlign(RIGHT, TOP);
  text(`Score: ${score}`, width - 20, 20);

  // 計算攝影機影像在畫布上的實際位置和大小 (置中)
  let videoDisplayWidth = width * 0.8;
  let videoDisplayHeight = height * 0.8;
  let videoDisplayX = (width - videoDisplayWidth) / 2;
  let videoDisplayY = (height - videoDisplayHeight) / 2;

  push(); // 儲存繪圖狀態
  // 為了達到 "攝影機畫面左右顛倒" 的效果，我們在繪製時進行翻轉
  translate(width, 0); // 將畫布原點移到右邊
  scale(-1, 1); // 左右翻轉整個畫布

  // 繪製攝影機影像
  // 由於 translate(width, 0) 和 scale(-1, 1) 的影響，影像的 X 座標需要這樣計算
  image(video, width - videoDisplayX - videoDisplayWidth, videoDisplayY, videoDisplayWidth, videoDisplayHeight);
  pop(); // 恢復繪圖狀態

  // 處理手部偵測結果
  if (predictions.length > 0 && predictions[0].score > modelParams.scoreThreshold) {
    let p = predictions[0]; // 取得第一個（最高置信度）的手部偵測結果

    // 將 handtrack 偵測到的原始座標轉換到 p5 畫布上顯示的攝影機影像位置
    // handtrack 的座標 [x, y, width, height] 是基於原始 video.elt 的解析度
    // 原始 video.elt 的寬高是 video.elt.videoWidth, video.elt.videoHeight
    // 顯示在 p5 畫布上的攝影機影像大小是 videoDisplayWidth, videoDisplayHeight

    // 計算手部偵測框的中心點在原始影像中的像素座標
    let handRawCenterX = p[0] + p[2] / 2;
    let handRawCenterY = p[1] + p[3] / 2;

    // 將原始影像的手部中心點轉換到 p5 畫布上的顯示座標
    // 由於我們在 p5 中對影像進行了 `scale(-1, 1)` 翻轉，
    // 因此手部在畫布上的 X 座標需要從顯示區域的右側開始計算。
    // videoDisplayX 是攝影機影像在畫布上的左上角 X 座標
    // videoDisplayWidth 是攝影機影像在畫布上的顯示寬度
    // handRawCenterX * (videoDisplayWidth / video.elt.videoWidth) 將原始 X 縮放到顯示寬度
    let mappedHandX = videoDisplayX + videoDisplayWidth - (handRawCenterX * (videoDisplayWidth / video.elt.videoWidth));
    let mappedHandY = videoDisplayY + (handRawCenterY * (videoDisplayHeight / video.elt.videoHeight));

    // 更新除錯用手部點
    debugHandPoint = { x: mappedHandX, y: mappedHandY };

    // 繪製手部偵測框 (視覺化)
    noFill();
    stroke(0, 255, 0); // 綠色框
    strokeWeight(4);
    rectMode(CORNER); // 以左上角繪製矩形
    // 將偵測框的 x, y, width, height 轉換到畫布顯示座標
    let boxX = videoDisplayX + videoDisplayWidth - (p[0] * (videoDisplayWidth / video.elt.videoWidth) + p[2] * (videoDisplayWidth / video.elt.videoWidth));
    let boxY = videoDisplayY + (p[1] * (videoDisplayHeight / video.elt.videoHeight));
    let boxWidth = p[2] * (videoDisplayWidth / video.elt.videoWidth);
    let boxHeight = p[3] * (videoDisplayHeight / video.elt.videoHeight);
    rect(boxX, boxY, boxWidth, boxHeight);


    // 處理手勢點擊
    let currentTime = millis();
    if (currentTime - lastHandActionTime > debounceTime) {
      // 判斷手部中心點是否在任何選項的點擊區域內
      let optionY = height / 2 - (options.length / 2) * 40; // 選項文字的起始 Y 座標

      for (let j = 0; j < options.length; j++) {
        let optX = (width - videoDisplayWidth) / 2 + (width - videoDisplayWidth) / 4; // 選項的 X 座標
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
          break; // 處理完一個選項就退出
        }
      }
    }
  }

  // 繪製除錯用手部點 (可選，除錯時開啟)
  // if (debugHandPoint.x != -1) {
  //   fill(255, 0, 0); // 紅色
  //   noStroke();
  //   ellipse(debugHandPoint.x, debugHandPoint.y, 15, 15); // 繪製一個大紅點
  // }


  // 顯示數字題目 (攝影機左邊，位於藍色背景上)
  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER);
  // 將數字題目放在攝影機畫面左側的藍色背景中間
  text(currentNumber, (width - videoDisplayWidth) / 4, height / 2);

  // 顯示英文選項 (數字題目旁邊，位於藍色背景上)
  textSize(32);
  let optionY = height / 2 - (options.length / 2) * 40; // 選項文字的起始 Y 座標
  for (let i = 0; i < options.length; i++) {
    // 選項的 X 座標，放在數字題目右邊、攝影機影像左邊的藍色區域
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
  // 重新調整攝影機影像大小，並在 resize 後更新偵測
  video.size(width * 0.8, height * 0.8);
  background('#5844cb');
  if (model) {
    // 由於影像尺寸可能改變，模型需要重新進行偵測
    // 這裡不需要重新載入模型，只需要確保下一次偵測能使用新的尺寸
    // startHandDetection() 會在下一個 requestAnimationFrame 周期中執行
  }
}

// 統一處理選項點擊的邏輯 (只被手部偵測呼叫)
function handleOptionClick(clickedIndex) {
  if (clickedIndex === correctOptionIndex) {
    score++;
    console.log("Correct! Score: " + score);
  } else {
    console.log("Incorrect. Score: " + score);
  }
  generateNewQuestion(); // 無論對錯，都換下一題
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
