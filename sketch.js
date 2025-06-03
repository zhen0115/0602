let capture; // 宣告一個變數來儲存攝影機影像

function setup() {
  // 創建一個全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 設定畫布背景顏色為 #5844cb
  background('#5844cb'); 

  // 獲取攝影機影像
  capture = createCapture(VIDEO);
  // 隱藏攝影機元素，因為我們會在畫布上繪製它
  capture.hide(); 
}

function draw() {
  // 再次設定背景顏色，以清除上一幀的內容
  background('#5844cb'); 

  // 計算攝影機影像顯示在畫布中央的 x, y 座標
  // 影像的寬度和高度使用 capture.width 和 capture.height
  // 為了左右顛倒，我們將影像的寬度設為負值，並調整 x 座標
  let imgWidth = capture.width;
  let imgHeight = capture.height;
  let displayWidth = imgWidth;
  let displayHeight = imgHeight;

  // 保持影像比例，如果視窗尺寸與影像比例不同，則縮放影像以適應視窗
  if (imgWidth > 0 && imgHeight > 0) { // 確保影像載入完成
    let aspectRatio = imgWidth / imgHeight;
    let windowAspectRatio = width / height;

    if (aspectRatio > windowAspectRatio) {
      // 影像比視窗寬，以寬度為基準縮放
      displayHeight = width / aspectRatio;
      displayWidth = width;
    } else {
      // 影像比視窗高，以高度為基準縮放
      displayWidth = height * aspectRatio;
      displayHeight = height;
    }
  }

  // 計算置中顯示的 x, y 座標
  let x = (width - displayWidth) / 2;
  let y = (height - displayHeight) / 2;
  
  // 將畫布的 x 軸翻轉，實現左右顛倒效果
  // push() 和 pop() 用於隔離變換，不影響其他繪圖
  push();
  translate(width, 0); // 將原點移動到畫布右側
  scale(-1, 1); // 左右翻轉
  
  // 在計算好的位置繪製攝影機影像
  // 注意這裡繪製的 x 座標需要重新計算，因為我們已經翻轉了畫布
  // 新的 x 座標應該是 (width - x - displayWidth) 或者更簡單地直接使用 width - x - displayWidth
  // 由於我們已經將原點移動到右側，然後翻轉，所以繪製的 x 座標將會是負值
  // 為了讓它正確顯示，我們需要將 x 座標調整為相對於翻轉後的新原點
  image(capture, width - x - displayWidth, y, displayWidth, displayHeight); 
  pop();
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小為全螢幕
  resizeCanvas(windowWidth, windowHeight);
  background('#5844cb'); // 重新設定背景顏色
}
