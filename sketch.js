let video;
let handtrackModel;
let hands = [];

// 遊戲相關變數
let currentNumber;
let options = [];
let correctOptionIndex;
let score = 0;
let feedbackMessage = ""; // 用於顯示 "正確" 或 "錯誤"
let feedbackTimer = 0; // 用於控制訊息顯示時間
const FEEDBACK_DURATION = 120; // 訊息顯示幀數 (約 2 秒，因為 60 幀/秒)

const numberWords = {
  0: "ZERO", 1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR",
  5: "FIVE", 6: "SIX", 7: "SEVEN", 8: "EIGHT", 9: "NINE",
  10: "TEN", 11: "ELEVEN", 12: "TWELVE", 13: "THIRTEEN", 14: "FOURTEEN",
  15: "FIFTEEN", 16: "SIXTEEN", 17: "SEVENTEEN", 18: "EIGHTEEN", 19: "TWENTY"
};

const NUM_OPTIONS = 4; // 每次顯示的選項數量
const OPTION_HEIGHT = 60; // 每個選項的高度
const OPTION_MARGIN = 20; // 選項之間的間距

// 非同步函數 setup，因為載入模型是非同步操作
async function setup() {
  console.log("Setup function started."); // 除錯訊息

  // 創建全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  background('#5844cb'); // 設定背景色

  // 建立攝影機捕捉物件
  // 回調函數確保在攝影機準備好後才設定尺寸和隱藏
  video = createCapture(VIDEO, () => {
    console.log("Video capture ready."); // 除錯訊息
    video.size(width * 0.8, height * 0.8); // 設定攝影機影像的內部尺寸
    video.hide(); // 隱藏原始的 <video> 元素
  });
  // 監聽原生的 <video> 元素載入元數據事件，以確認攝影機已準備好
  video.elt.onloadedmetadata = () => {
    console.log("Video loaded metadata. Dimensions:", video.width, video.height); // 除錯訊息
  };
  // 監聽攝影機錯誤
  video.elt.onerror = (e) => {
    console.error("Video error:", e); // 除錯訊息
    alert("攝影機載入失敗，請檢查權限或設備。");
  };


  // 定義 Handtrack.js 模型參數
  const modelParams = {
    flipHorizontal: true,   // 因為我們在 draw() 中翻轉了影像，所以模型也需要翻轉其預測
    maxNumHands: 1,         // 遊戲只需要偵測一隻手
    scoreThreshold: 0.7      // 偵測信賴度閾值，可以降低以提高偵測靈敏度
  };

  // 載入手部偵測模型
  try {
    handtrackModel = await handtrack.load(modelParams);
    console.log("Handtrack Model Loaded successfully:", handtrackModel); // 除錯訊息
    // 模型載入成功後才生成第一道題目，確保遊戲可以開始
    generateNewQuestion();
  } catch (error) {
    console.error("Error loading Handtrack.js model:", error); // 除錯訊息
    alert("手部偵測模型載入失敗，請檢查網路連線或重新整理頁面。");
  }
}

// draw 函數，每幀執行
function draw() {
  background('#5844cb'); // 清除畫布並重新繪製背景

  // 計算攝影機影像在畫布上的顯示寬高和位置
  let videoWidth = width * 0.8;
  let videoHeight = height * 0.8;
  let videoX = (width - videoWidth) / 2;
  let videoY = (height - videoHeight) / 2;

  // 繪製攝影機影像
  // 只有當攝影機元數據載入後才繪製影像
  if (video.loadedmetadata) {
    push(); // 保存當前繪圖狀態
    translate(videoWidth, 0); // 水平位移，準備翻轉
    scale(-1, 1); // 水平翻轉影像 (左右顛倒)
    image(video, 0, videoY, videoWidth, videoHeight); // 繪製影像
    pop(); // 恢復之前的繪圖狀態
  } else {
    // 如果攝影機未準備好，顯示提示訊息
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("正在等待攝影機畫面...", width / 2, height / 2);
  }

  // 非同步偵測手部 (不會阻塞 draw 函數)
  predictHands();

  // 顯示當前分數
  fill(255); // 白色文字
  textSize(32);
  textAlign(LEFT, TOP); // 文字左上對齊
  text(`分數: ${score}`, 20, 20); // 顯示在畫布左上角


  // 顯示數字題目
  // 只有在題目生成後才顯示數字
  if (currentNumber !== undefined) {
    fill(255); // 白色文字
    textSize(80);
    textAlign(CENTER, CENTER); // 文字置中對齊
    text(currentNumber, width / 4, height / 2); // 顯示在畫布左側中間
  } else {
    // 如果題目未生成，顯示提示訊息
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("正在生成題目...", width / 4, height / 2 + 100);
  }


  // 顯示選項
  let optionsStartX = width * 3 / 4; // 選項顯示在畫布右側中間
  let optionsStartY = (height - (NUM_OPTIONS * (OPTION_HEIGHT + OPTION_MARGIN))) / 2;

  // 只有當選項生成後才繪製
  if (options.length > 0) {
    for (let i = 0; i < options.length; i++) {
      let opt = options[i];
      let optY = optionsStartY + i * (OPTION_HEIGHT + OPTION_MARGIN);

      // 繪製選項方框
      stroke(255); // 白色邊框
      strokeWeight(2); // 邊框粗細
      fill(50, 50, 50, 150); // 半透明深灰色背景
      rectMode(CENTER); // 矩形模式設為中心點
      rect(optionsStartX, optY + OPTION_HEIGHT / 2, videoWidth / 2, OPTION_HEIGHT); // 繪製方框

      // 繪製選項文字
      fill(255); // 白色文字
      textSize(36);
      textAlign(CENTER, CENTER); // 文字置中對齊
      text(opt, optionsStartX, optY + OPTION_HEIGHT / 2);

      // 檢查食指是否點選
      if (hands.length > 0) { // 確保有偵測到手
        const indexFingerTip = hands[0].keypoints[8]; // 取得第一隻手的食指指尖 (關鍵點 8)

        if (indexFingerTip) { // 確保食指指尖存在
          // 將食指座標從攝影機影像空間轉換到畫布空間
          // 注意：video.width/height 是原始攝影機串流的解析度
          // videoX/videoY 是影像在畫布上的繪製起始點
          let fingerX = map(indexFingerTip.x, 0, video.width, videoX + videoWidth, videoX);
          let fingerY = map(indexFingerTip.y, 0, video.height, videoY, videoY + videoHeight);

          // 繪製食指指尖圓點 (用於除錯，可註解掉)
          // fill(0, 255, 255); // 青色
          // ellipse(fingerX, fingerY, 15, 15);

          // 計算食指與選項中心點的距離
          let distToOption = dist(fingerX, fingerY, optionsStartX, optY + OPTION_HEIGHT / 2);

          // 如果距離小於某個閾值，判定為點選
          if (distToOption < OPTION_HEIGHT / 2 - 10) { // 讓點擊範圍比選項方框稍微小一點
            handleOptionSelection(i); // 處理選項選擇
            break; // 處理完一個點擊後就退出迴圈，避免重複觸發或多次得分
          }
        }
      }
    }
  }


  // 顯示反饋訊息 ("正確！" / "錯誤！")
  if (feedbackMessage !== "") {
    fill(255); // 白色文字
    textSize(50);
    textAlign(CENTER, CENTER); // 文字置中對齊
    text(feedbackMessage, width / 2, height / 2 + 100); // 顯示在畫布中間偏下
    feedbackTimer--; // 計時器遞減
    if (feedbackTimer <= 0) {
      feedbackMessage = ""; // 計時器歸零後清除訊息
    }
  }

  // 除錯信息：顯示偵測到的手部數量 (可註解掉)
  // fill(255);
  // textSize(20);
  // textAlign(RIGHT, TOP);
  // text(`偵測到手: ${hands.length}`, width - 20, 20);
}

// 預測手部位置的非同步函數
async function predictHands() {
  // 只有當攝影機和模型都載入好時才進行預測
  if (video.loadedmetadata && handtrackModel) {
    try {
      const predictions = await handtrackModel.detect(video.elt); // 對攝影機影像進行偵測
      hands = predictions; // 更新 hands 陣列
    } catch (error) {
      console.error("Error predicting hands:", error); // 除錯訊息
      // 可以考慮在這裡顯示錯誤訊息或暫停遊戲
    }
  }
}

// 生成新問題的函數
function generateNewQuestion() {
  console.log("Generating new question..."); // 除錯訊息
  // 隨機生成一個 0 到 19 的數字作為題目
  currentNumber = floor(random(0, 20));

  options = [];
  let correctWord = numberWords[currentNumber]; // 取得正確答案的英文單詞

  // 加入正確答案到選項陣列
  options.push(correctWord);

  // 加入隨機的錯誤答案，直到選項數量達到 NUM_OPTIONS
  while (options.length < NUM_OPTIONS) {
    let randomNum = floor(random(0, 20));
    let randomWord = numberWords[randomNum];
    // 確保沒有重複的選項
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
  }

  // 將選項陣列隨機排序
  shuffleArray(options);

  // 找到正確答案在打亂後選項陣列中的索引
  correctOptionIndex = options.indexOf(correctWord);
  console.log(`題目: ${currentNumber}, 正確答案: ${correctWord}, 選項: `, options); // 除錯訊息
}

// 處理選項選擇的函數
function handleOptionSelection(selectedIndex) {
  // 如果正在顯示反饋訊息，則忽略新的點擊，防止重複觸發
  if (feedbackMessage !== "") return;

  console.log(`選擇了選項: ${options[selectedIndex]}`); // 除錯訊息

  if (selectedIndex === correctOptionIndex) {
    score += 10; // 答對加分
    feedbackMessage = "正確！"; // 設定正確反饋訊息
    console.log("答案正確！"); // 除錯訊息
  } else {
    feedbackMessage = "錯誤！"; // 設定錯誤反饋訊息
    console.log("答案錯誤！"); // 除錯訊息
  }
  feedbackTimer = FEEDBACK_DURATION; // 設定反饋訊息顯示時間

  // 使用 setTimeout 在反饋訊息顯示結束後生成下一題
  // 這裡加了額外一點延遲，確保用戶能看到反饋
  setTimeout(() => {
    generateNewQuestion();
  }, FEEDBACK_DURATION / 60 * 1000 + 100); // 將幀數轉換為毫秒 (+100ms 緩衝)
}

// 隨機打亂陣列元素的函數 (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 視窗大小改變時調整畫布尺寸
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 同步調整攝影機影像的內部尺寸以匹配新的畫布尺寸
  if (video) {
    video.size(width * 0.8, height * 0.8);
  }
}
