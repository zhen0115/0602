let capture; // 宣告一個變數來儲存攝影機影像
let handpose; // 宣告一個變數來儲存 Handpose 模型
let predictions = []; // 宣告一個陣列來儲存手部偵測的結果

function setup() {
  // 創建一個與瀏覽器視窗同寬同高的畫布，實現全螢幕效果
  createCanvas(windowWidth, windowHeight);
  
  // 設定畫布背景顏色為 #5844cb
  background('#5844cb'); 

  // 獲取攝影機影像
  capture = createCapture(VIDEO);
  // 隱藏攝影機元素，因為我們會在畫布上繪製它
  capture.hide();

  // 載入 Handpose 模型
  // 當模型載入完成後，會調用 modelReady 函數
  handpose = ml5.handpose(capture, modelReady);

  // 設定事件監聽器：當偵測到手部時，會觸發 'hand' 事件
  // predictions 陣列會包含所有偵測到的手部資訊
  handpose.on('hand', results => {
    predictions = results;
  });
}

function modelReady() {
  // 在控制台輸出訊息，表示 Handpose 模型已成功載入
  console.log('Handpose 模型載入完成！');
}

function draw() {
  // 再次設定背景顏色，以清除上一幀的內容，避免殘影
  background('#5844cb'); 

  // 獲取攝影機影像的原始寬度和高度
  let imgWidth = capture.width;
  let imgHeight = capture.height;
  let displayWidth = imgWidth;
  let displayHeight = imgHeight;

  // 確保攝影機影像已經載入並有尺寸資訊
  if (imgWidth > 0 && imgHeight > 0) {
    // 計算影像的長寬比和視窗的長寬比
    let aspectRatio = imgWidth / imgHeight;
    let windowAspectRatio = width / height;

    // 根據長寬比，縮放影像以適應視窗並保持比例
    if (aspectRatio > windowAspectRatio) {
      // 如果影像比視窗寬，以視窗寬度為基準縮放
      displayHeight = width / aspectRatio;
      displayWidth = width;
    } else {
      // 如果影像比視窗高，以視窗高度為基準縮放
      displayWidth = height * aspectRatio;
      displayHeight = height;
    }
  }

  // 計算攝影機影像在畫布上置中顯示的 x, y 座標
  let x = (width - displayWidth) / 2;
  let y = (height - displayHeight) / 2;
  
  // 保存當前的繪圖狀態，以便後續的變換不會影響到其他繪圖
  push();
  // 將畫布的原點從左上角移動到右上角
  translate(width, 0); 
  // 沿著 Y 軸翻轉畫布，實現左右顛倒效果
  scale(-1, 1); 
  
  // 在計算好的位置繪製左右顛倒的攝影機影像
  // 由於畫布已經翻轉，繪製的 x 座標需要重新計算
  image(capture, width - x - displayWidth, y, displayWidth, displayHeight); 
  // 恢復之前保存的繪圖狀態
  pop();

  // 如果 Handpose 模型偵測到手部 (predictions 陣列有內容)
  if (predictions.length > 0) {
    // 遍歷所有偵測到的手部 (可能同時偵測到多隻手)
    for (let i = 0; i < predictions.length; i++) {
      let hand = predictions[i];
      let keypoints = hand.landmarks; // 手部的 21 個關鍵點陣列

      // 設定線條樣式：粗細為 4 像素，顏色為紅色，不填充任何形狀
      strokeWeight(4);
      stroke(255, 0, 0); 
      noFill();

      // 由於攝影機影像已經左右顛倒並置中顯示，Handpose 返回的關鍵點座標是基於原始影像的
      // 我們需要將這些關鍵點座標轉換到畫布上正確的位置
      let adjustedKeypoints = keypoints.map(kp => {
        // 將關鍵點的 x 座標從原始影像比例映射到顯示影像的比例
        // 並考慮左右翻轉和置中偏移
        let adjustedX = width - (kp[0] / imgWidth) * displayWidth - (width - x - displayWidth);
        // 將關鍵點的 y 座標從原始影像比例映射到顯示影像的比例
        // 並考慮置中偏移
        let adjustedY = (kp[1] / imgHeight) * displayHeight + y;
        return [adjustedX, adjustedY];
      });

      // 繪製各個手指的連線

      // 拇指 (關鍵點 0 到 4)
      for (let j = 0; j < 4; j++) {
        line(adjustedKeypoints[j][0], adjustedKeypoints[j][1], adjustedKeypoints[j+1][0], adjustedKeypoints[j+1][1]);
      }
      // 食指 (關鍵點 5 到 8)
      for (let j = 5; j < 8; j++) {
        line(adjustedKeypoints[j][0], adjustedKeypoints[j][1], adjustedKeypoints[j+1][0], adjustedKeypoints[j+1][1]);
      }
      // 中指 (關鍵點 9 到 12)
      for (let j = 9; j < 12; j++) {
        line(adjustedKeypoints[j][0], adjustedKeypoints[j][1], adjustedKeypoints[j+1][0], adjustedKeypoints[j+1][1]);
      }
      // 無名指 (關鍵點 13 到 16)
      for (let j = 13; j < 16; j++) {
        line(adjustedKeypoints[j][0], adjustedKeypoints[j][1], adjustedKeypoints[j+1][0], adjustedKeypoints[j+1][1]);
      }
      // 小指 (關鍵點 17 到 20)
      for (let j = 17; j < 20; j++) {
        line(adjustedKeypoints[j][0], adjustedKeypoints[j][1], adjustedKeypoints[j+1][0], adjustedKeypoints[j+1][1]);
      }
      
      // 繪製手掌部分的連線，形成手掌輪廓
      line(adjustedKeypoints[0][0], adjustedKeypoints[0][1], adjustedKeypoints[5][0], adjustedKeypoints[5][1]);     // 手腕到食指根部
      line(adjustedKeypoints[5][0], adjustedKeypoints[5][1], adjustedKeypoints[9][0], adjustedKeypoints[9][1]);     // 食指根部到中指根部
      line(adjustedKeypoints[9][0], adjustedKeypoints[9][1], adjustedKeypoints[13][0], adjustedKeypoints[13][1]);   // 中指根部到無名指根部
      line(adjustedKeypoints[13][0], adjustedKeypoints[13][1], adjustedKeypoints[17][0], adjustedKeypoints[17][1]); // 無名指根部到小指根部
      line(adjustedKeypoints[17][0], adjustedKeypoints[17][1], adjustedKeypoints[0][0], adjustedKeypoints[0][1]);   // 小指根部到手腕 (完成閉合)
    }
  }
}

// 當瀏覽器視窗大小改變時，此函數會自動被調用
function windowResized() {
  // 重新調整畫布大小為當前視窗的寬度和高度，保持全螢幕
  resizeCanvas(windowWidth, windowHeight);
  // 重新設定背景顏色
  background('#5844cb'); 
}
