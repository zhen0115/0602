let video;
let pg; // p5.Graphics 物件
let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 50; // 選項的觸碰範圍
let numberX, numberY;
let numberSize = 64;
let canAnswer = true; // 控制是否可以回答
let answerDelay = 500; // 0.5 秒的延遲
let handPosition = null; // 追蹤手部中心位置 (簡化)

// --- 調整後的偵測參數 ---
let brightnessThreshold = 120; // 降低亮度閾值，讓較暗的亮點也能被偵測到
let brightPixelThreshold = 5;  // 降低亮點數量閾值，更少的亮點也能被視為手
let touchThreshold = 80;       // 增加觸碰距離閾值，讓手離選項遠一點也能觸發
// -----------------------

let numberPairs = [
  { number: 1, word: "one" },
  { number: 2, word: "two" },
  { number: 3, word: "three" },
  { number: 4, word: "four" },
  { number: 5, word: "five" }
  // 你可以在這裡添加更多數字和單字
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7'); // 設定背景顏色

  video = createCapture(VIDEO); // 擷取網路攝影機影像
  video.size(640, 480); // 設定影像大小
  video.hide(); // 隱藏預設的 video 元素

  pg = createGraphics(video.width, video.height); // 創建一個 p5.Graphics 物件 (目前未使用，但保留)

  instructionDiv = createDiv('將你的食指移動到對應的英文單字上'); // 創建指令文字區塊
  instructionDiv.id('instruction'); // 設定 ID 以便 CSS 樣式化

  startGame(); // 開始遊戲
}

function startGame() {
  score = 0; // 分數歸零
  generateQuestion(); // 生成第一道題目
  gameStarted = true; // 設定遊戲狀態為已開始
  instructionDiv.html('將你的食指移動到對應的英文單字上'); // 更新指令文字
  canAnswer = true; // 允許回答
  handPosition = null; // 重置手部位置
}

function generateQuestion() {
  let randomIndex = floor(random(numberPairs.length)); // 隨機選擇一個數字單字配對
  let pair = numberPairs[randomIndex];
  currentNumber = pair.number; // 設定當前數字
  correctAnswer = pair.word; // 設定正確答案

  options = [correctAnswer]; // 將正確答案加入選項
  while (options.length < 3) { // 隨機生成兩個錯誤選項
    let wrongPair = random(numberPairs);
    if (wrongPair.word !== correctAnswer && !options.includes(wrongPair.word)) {
      options.push(wrongPair.word);
    }
  }
  shuffle(options); // 打亂選項順序

  // 設定數字和選項的顯示位置
  numberX = width / 4;
  numberY = height / 2;

  optionPositions = [
    { x: width * 0.6, y: height / 3 },
    { x: width * 0.8, y: height / 2 },
    { x: width * 0.6, y: height * 2 / 3 }
  ];
}

function draw() {
  background('#ffe6a7'); // 每次繪圖前清除背景

  // 計算並顯示攝影機影像
  let videoWidth = video.width;
  let videoHeight = video.height;
  let displayWidth = windowWidth * 0.8;
  let displayHeight = windowHeight * 0.8;
  let scaleFactor = min(displayWidth / videoWidth, displayHeight / videoHeight);
  let scaledWidth = videoWidth * scaleFactor;
  let scaledHeight = videoHeight * scaleFactor;
  let x = (windowWidth - scaledWidth) / 2;
  let y = (windowHeight - scaledHeight) / 2;

  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2); // 移動原點到影像中心
  scale(-1, 1); // 水平翻轉影像 (讓它看起來像鏡子)
  image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight); // 繪製影像
  pop();

  // 顯示當前數字
  fill(0); // 黑色文字
  textSize(numberSize);
  textAlign(CENTER, CENTER);
  text(currentNumber, numberX, numberY);

  textSize(24); // 選項文字大小

  // 遊戲進行中時進行手部偵測和互動
  if (gameStarted) {
    video.loadPixels(); // 載入影像像素資料
    if (video.pixels.length > 0) {
      let avgX = 0;
      let avgY = 0;
      let brightPixels = 0;
      let searchRadius = 50; // 在畫面中心附近搜尋亮點的範圍

      // 簡化手部中心估計：在畫面中心附近尋找亮點
      for (let i = -searchRadius; i < searchRadius; i += 5) {
        for (let j = -searchRadius; j < searchRadius; j += 5) {
          let checkX = floor(video.width / 2 + i);
          let checkY = floor(video.height / 2 + j);
          if (checkX >= 0 && checkX < video.width && checkY >= 0 && checkY < video.height) {
            let index = (checkY * video.width + checkX) * 4; // 像素陣列索引
            let brightness = (video.pixels[index] + video.pixels[index + 1] + video.pixels[index + 2]) / 3; // 計算亮度
            if (brightness > brightnessThreshold) { // 判斷為亮點 (可能的手指)
              avgX += checkX;
              avgY += checkY;
              brightPixels++;
            }
          }
        }
      }

      if (brightPixels > brightPixelThreshold) { // 如果亮點數量超過閾值，則認為偵測到手
        handPosition = {
          x: map(avgX / brightPixels, 0, video.width, x, x + scaledWidth), // 將視訊座標映射到畫布座標
          y: map(avgY / brightPixels, 0, video.height, y, y + scaledHeight)
        };

        // 繪製一個紅色小圓圈表示偵測到的手部位置
        fill(255, 0, 0, 150);
        ellipse(handPosition.x, handPosition.y, 20);

        // console.log("手部位置:", handPosition); // 可以取消註解來查看手部位置

        // 檢查手部位置是否靠近選項
        if (canAnswer) { // 只有在允許回答時才進行選項檢查
          for (let i = 0; i < options.length; i++) {
            let distance = dist(handPosition.x, handPosition.y, optionPositions[i].x, optionPositions[i].y);

            // 根據手部距離繪製選項外觀，提供視覺回饋
            if (distance < touchThreshold) {
              fill(255, 200, 0); // 手部靠近時的顏色
              ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2 + 10); // 稍微放大
            } else {
              fill(0, 100, 200); // 預設顏色
              ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
            }
            fill(255); // 文字顏色
            textAlign(CENTER, CENTER);
            text(options[i], optionPositions[i].x, optionPositions[i].y);


            // 如果手部觸碰到選項
            if (distance < touchThreshold) {
              // console.log(`觸碰到選項 ${i} ('${options[i]}')`); // 可以取消註解來查看觸碰狀態
              if (options[i] === correctAnswer) { // 答對了
                score++;
                instructionDiv.html('答對了！分數：' + score);
                canAnswer = false; // 暫時禁止回答，防止重複觸發
                setTimeout(() => { // 延遲後生成新題目
                  generateQuestion();
                  canAnswer = true; // 重新允許回答
                  handPosition = null; // 重置手部位置
                }, answerDelay);
              } else { // 答錯了
                instructionDiv.html('再試一次！分數：' + score);
                // 這裡可以考慮增加一個短暫的延遲或懲罰
              }
              break; // 避免同時觸發多個選項
            }
          }
        } else { // 如果不能回答，則正常繪製選項，不檢查觸碰
          for (let i = 0; i < options.length; i++) {
            fill(0, 100, 200);
            ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
            fill(255);
            textAlign(CENTER, CENTER);
            text(options[i], optionPositions[i].x, optionPositions[i].y);
          }
        }
      } else {
        handPosition = null; // 沒有偵測到足夠的亮點，認為沒有手部
        // 如果沒有偵測到手部，也要繪製選項
        for (let i = 0; i < options.length; i++) {
          fill(0, 100, 200);
          ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
          fill(255);
          textAlign(CENTER, CENTER);
          text(options[i], optionPositions[i].x, optionPositions[i].y);
        }
      }
    }
  } else { // 遊戲未開始時，也顯示選項 (例如在遊戲開始畫面)
      for (let i = 0; i < options.length; i++) {
        fill(0, 100, 200);
        ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
        fill(255);
        textAlign(CENTER, CENTER);
        text(options[i], optionPositions[i].x, optionPositions[i].y);
      }
  }


  // 顯示分數
  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);
  text('分數: ' + score, 20, 20);
}

// 當視窗大小改變時調整畫布和元素位置
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  optionPositions = [
    { x: width * 0.6, y: height / 3 },
    { x: width * 0.8, y: height / 2 },
    { x: width * 0.6, y: height * 2 / 3 }
  ];
  numberX = width / 4;
  numberY = height / 2;
}

// 鍵盤事件處理
function keyPressed() {
  if (key === 'r' || key === 'R') { // 按 'R' 重新開始遊戲
    startGame();
  }
  if (key === 's' || key === 'S') { // 按 'S' 儲存畫布影像
    saveCanvas('math_pairing_game', 'png');
  }
}

// 陣列洗牌函數
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
