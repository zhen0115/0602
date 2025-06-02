// sketch.js

let video; // 將 capture 更名為 video 以符合用戶提供的程式碼
let facemesh;
let predictions = [];

// 臉部主要輪廓點的索引
const faceOutlineIndices = [
  409, 270, 269, 67, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291
];

// 第二組要連接的點的索引 (用戶提供的 indices2)
const secondLineIndices = [
  76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184
];

// 左眼外框點的索引
const leftEyeOuterIndices = [
  243, 190, 56, 28, 27, 29, 30, 247, 130, 25, 110, 24, 23, 22, 26, 112
];

// 左眼內框點的索引
const leftEyeInnerIndices = [
  133, 173, 157, 158, 159, 160, 161, 246, 33, 7, 163, 144, 145, 153, 154, 155
];

// 右眼外框點的索引
const rightEyeOuterIndices = [
  359, 467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255
];

// 右眼內框點的索引
const rightEyeInnerIndices = [
  263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249
];


function setup() {
  // 創建畫布並置中
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );

  video = createCapture(VIDEO); // 獲取攝影機影像
  video.size(width, height); // 設定影像尺寸與畫布相同
  video.hide(); // 隱藏原始影像元素

  // 初始化 facemesh 模型
  facemesh = ml5.facemesh(video, modelReady);
  // 當模型預測結果時，更新 predictions 陣列
  facemesh.on('predict', results => {
    predictions = results;
  });
}

function modelReady() {
  // 模型載入完成時在控制台顯示訊息
  console.log('Facemesh 模型載入完成！');
}

function draw() {
  // 在畫布上顯示攝影機影像
  image(video, 0, 0, width, height);

  // 只有當有預測結果時才繪製
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh; // 獲取臉部網格點

    // 繪製第一組紅色線條
    drawFacemeshLines(keypoints);

    // 繪製第二組黃色線條並填充
    drawSecondGroupLines(keypoints);

    // 在第一組與第二組之間填充綠色
    drawGreenBetweenGroups(keypoints);

    // 繪製左眼
    drawLeftEye(keypoints);

    // 繪製右眼
    drawRightEye(keypoints);
  }
}

// 繪製第一組紅色線條
function drawFacemeshLines(keypoints) {
  stroke(255, 0, 0); // 設定線條顏色為紅色
  strokeWeight(2); // 設定線條粗細
  noFill(); // 不填充顏色
  beginShape(); // 開始繪製形狀
  for (let i = 0; i < faceOutlineIndices.length; i++) {
    const idx = faceOutlineIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y); // 添加頂點
  }
  endShape(); // 結束繪製形狀
}

// 繪製第二組黃色線條並填充
function drawSecondGroupLines(keypoints) {
  stroke(255, 50, 10); // 設定線條顏色為橙紅色 (用戶提供的顏色)
  strokeWeight(6); // 設定線條粗細
  fill(255, 255, 0, 50); // 設定填充顏色為半透明黃色
  beginShape(); // 開始繪製形狀
  for (let i = 0; i < secondLineIndices.length; i++) {
    const idx = secondLineIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y); // 添加頂點
  }
  endShape(CLOSE); // 結束繪製形狀並閉合以填充
}

// 在第一組與第二組之間填充綠色 (此為近似填充)
function drawGreenBetweenGroups(keypoints) {
  fill(0, 255, 0, 50); // 設定填充顏色為半透明綠色
  noStroke(); // 不繪製線條
  beginShape(); // 開始繪製形狀
  // 添加第一組的點
  for (let i = 0; i < faceOutlineIndices.length; i++) {
    const idx = faceOutlineIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y);
  }
  // 添加第二組的點 (反向遍歷以避免交錯，嘗試連接兩個多邊形)
  for (let i = secondLineIndices.length - 1; i >= 0; i--) {
    const idx = secondLineIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y);
  }
  endShape(CLOSE); // 結束繪製形狀並閉合以填充
}

// 繪製左眼
function drawLeftEye(keypoints) {
  // 繪製左眼外框
  stroke(0, 100, 255); // 深藍色線條
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < leftEyeOuterIndices.length; i++) {
    const idx = leftEyeOuterIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y);
  }
  endShape(CLOSE); // 閉合形狀

  // 繪製左眼內框並填充
  stroke(0, 150, 255); // 較淺的藍色線條
  strokeWeight(1);
  fill(0, 150, 255, 70); // 半透明淺藍色填充
  beginShape();
  for (let i = 0; i < leftEyeInnerIndices.length; i++) {
    const idx = leftEyeInnerIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y);
  }
  endShape(CLOSE); // 閉合形狀並填充
}

// 繪製右眼
function drawRightEye(keypoints) {
  // 繪製右眼外框
  stroke(150, 0, 255); // 深紫色線條
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < rightEyeOuterIndices.length; i++) {
    const idx = rightEyeOuterIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y);
  }
  endShape(CLOSE); // 閉合形狀

  // 繪製右眼內框並填充
  stroke(200, 0, 255); // 較淺的紫色線條
  strokeWeight(1);
  fill(200, 0, 255, 70); // 半透明淺紫色填充
  beginShape();
  for (let i = 0; i < rightEyeInnerIndices.length; i++) {
    const idx = rightEyeInnerIndices[i];
    const [x, y] = keypoints[idx];
    vertex(x, y);
  }
  endShape(CLOSE); // 閉合形狀並填充
}

// 當視窗大小改變時，重新調整畫布位置
function windowResized() {
  select('canvas').position(
    (windowWidth - width) / 2,
    (windowHeight - height) / 2
  );
}
