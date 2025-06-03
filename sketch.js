let video;
let pg; // p5.Graphics 物件
let gridSpacing = 20;
let boxSize = 18;
let circleDiameter = 5;
let blackColor;

// Handtrack.js 相關變數
let model = null;
const modelParams = {
  flipHorizontal: true, // flip video to make it easier for the model to detect hands
  maxNumBoxes: 2,       // maximum number of hands to detect
  iouThreshold: 0.5,    // ioU threshold for non-max suppression
  scoreThreshold: 0.75, // confidence threshold for predictions.
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#ffe6a7');

  video = createCapture(VIDEO);
  video.size(320, 240); // 設定視訊尺寸 (可依您的攝影機調整，較小尺寸效能較好)
  video.hide(); // 隱藏攝影機的 HTML 元素

  // 創建一個與視訊尺寸相同的 p5.Graphics 物件，背景為黑色
  pg = createGraphics(video.width, video.height);
  pg.background(0);

  blackColor = color(0); // 定義黑色

  // ==== Handtrack.js 初始化 ====
  // 載入模型
  handtrack.load(modelParams).then(lModel => {
    model = lModel;
    console.log("Handtrack model loaded!");
  });
}

function draw() {
  background('#ffe6a7'); // 確保每一幀都重新繪製背景

  let videoWidth = video.width;
  let videoHeight = video.height;
  let displayWidth = windowWidth * 0.8;
  let displayHeight = windowHeight * 0.8;

  // 計算保持原始比例的縮放比例
  let scaleFactor = min(displayWidth / videoWidth, displayHeight / videoHeight);

  // 計算縮放後的影像尺寸
  let scaledWidth = videoWidth * scaleFactor;
  let scaledHeight = videoHeight * scaleFactor;

  // 計算影像在視窗中央的 x 和 y 座標
  let x = (windowWidth - scaledWidth) / 2;
  let y = (windowHeight - scaledHeight) / 2;

  push(); // 保存當前的繪圖狀態
  translate(x + scaledWidth / 2, y + scaledHeight / 2); // 移動到影像的中心
  scale(-1, 1); // 水平翻轉
  image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight); // 繪製翻轉後的影像
  pop(); // 恢復之前的繪圖狀態

  // 在 p5.Graphics 物件上繪製彩色方框和黑色圓點
  pg.background(0); // 每一幀都重新繪製黑色背景
  pg.strokeWeight(1); // 設定方框的邊框粗細
  for (let i = 0; i < videoWidth; i += gridSpacing) {
    for (let j = 0; j < videoHeight; j += gridSpacing) {
      let color = video.get(i, j); // 取得視訊對應位置的顏色
      pg.stroke(color); // 設定方框的邊框顏色
      pg.fill(0, 0, 0, 0); // 方框內部透明
      pg.rect(i + (gridSpacing - boxSize) / 2, j + (gridSpacing - boxSize) / 2, boxSize, boxSize);

      // 繪製黑色圓點在方框中央
      pg.fill(blackColor);
      pg.noStroke();
      pg.ellipse(i + gridSpacing / 2, j + gridSpacing / 2, circleDiameter, circleDiameter);
    }
  }

  // 將 p5.Graphics 物件繪製到畫布上，位置與視訊相同 (也做相同的翻轉)
  push();
  translate(x + scaledWidth / 2, y + scaledHeight / 2);
  scale(-1, 1);
  image(pg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  pop();

  // ==== Handtrack.js 偵測與繪圖 ====
  if (model) {
    model.detect(video.elt).then(predictions => {
      // 在主要畫布上繪製偵測框 (需要考慮翻轉和縮放)
      push();
      translate(x + scaledWidth / 2, y + scaledHeight / 2); // 移動到影像的中心
      scale(-1, 1); // 水平翻轉 (因為偵測結果是基於原始 video 元素的，我們需要將繪製也翻轉)

      // 繪製偵測框
      predictions.forEach(p => {
        let bbox = p.bbox; // [x, y, width, height]

        // 將偵測框的座標從 video 元素的尺寸轉換到 scaled 影像的尺寸
        let bboxX = bbox[0] * (scaledWidth / videoWidth);
        let bboxY = bbox[1] * (scaledHeight / videoHeight);
        let bboxW = bbox[2] * (scaledWidth / videoWidth);
        let bboxH = bbox[3] * (scaledHeight / videoHeight);

        // 由於我們翻轉了畫面，偵測框的 x 座標也需要調整
        // 原始 bboxX 是從左邊開始，翻轉後，x 應該從右邊開始
        // 所以新的 x 座標是 (scaledWidth - bboxX - bboxW)
        stroke(0, 255, 0); // 綠色邊框
        strokeWeight(2);
        noFill();
        rect(scaledWidth - bboxX - bboxW, bboxY, bboxW, bboxH); // 繪製翻轉後的偵測框

        // 顯示標籤和分數 (可選)
        fill(255, 0, 0); // 紅色文字
        noStroke();
        textSize(16);
        text(`${p.class} (${nf(p.score, 0, 2)})`, scaledWidth - bboxX - bboxW, bboxY - 5);
      });
      pop();
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // 當按下 's' 鍵時儲存畫布
  if (key === 's' || key === 'S') {
    saveCanvas('color_box_black_dot_on_flipped_camera_with_handtrack', 'png');
  }
}
