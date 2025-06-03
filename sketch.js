let video; // 宣告一個變數來存放攝影機影像
let score = 0; // 儲存分數
let currentNumber; // 當前顯示的數字題目
let options = []; // 儲存英文選項
let correctOptionIndex; // 正確答案在 options 陣列中的索引
let numberToWordMap; // 數字到英文單字的映射

function setup() {
  // 創建一個全螢幕畫布，背景顏色設定為 #5844cb
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  // 創建攝影機捕捉物件
  video = createCapture(VIDEO);
  video.size(width * 0.8, height * 0.8); // 設定影像寬高為視窗的 80%
  video.hide(); // 隱藏預設的 HTML 影像元素

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

// 處理滑鼠點擊事件
function mousePressed() {
  let optionY = height / 2 - (options.length / 2) * 40; // 計算第一個選項的起始 Y 座標

  for (let i = 0; i < options.length; i++) {
    let x = width * 0.25; // 選項的 X 座標
    let y = optionY + i * 50; // 每個選項間隔 50 像素

    // 計算選項的點擊區域
    let textW = textWidth(options[i]);
    let rectX = x + textW / 2 + 10;
    let rectY = y;
    let rectW = textW + 40;
    let rectH = 40;

    // 檢查滑鼠是否在當前選項的點擊區域內
    if (mouseX > rectX - rectW / 2 && mouseX < rectX + rectW / 2 &&
        mouseY > rectY - rectH / 2 && mouseY < rectY + rectH / 2) {
      if (i === correctOptionIndex) {
        score++; // 答對了，加分
        console.log("Correct! Score: " + score);
      } else {
        console.log("Incorrect. Score: " + score);
      }
      generateNewQuestion(); // 無論對錯，都換下一題
      break; // 處理完一個選項後就退出迴圈
    }
  }
}

// 生成新的數字題目和選項
function generateNewQuestion() {
  // 生成一個 0 到 10 的隨機整數作為題目
  currentNumber = floor(random(0, 11));

  // 獲取正確答案的英文單字
  let correctAnswer = numberToWordMap[currentNumber];

  options = []; // 清空之前的選項

  // 將正確答案加入選項中
  options.push(correctAnswer);

  // 生成其他兩個隨機的錯誤選項
  while (options.length < 3) { // 確保有三個選項
    let randomNum = floor(random(0, 11));
    let randomWord = numberToWordMap[randomNum];
    // 確保錯誤選項不重複，且不與正確答案相同
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
  }

  // 將選項隨機排序
  shuffleArray(options);

  // 找到正確答案在隨機排序後陣列中的索引
  correctOptionIndex = options.indexOf(correctAnswer);

  console.log("New question:", currentNumber, "Options:", options, "Correct:", correctAnswer);
}

// 隨機打亂陣列的函數 (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // 交換元素
  }
}
