let video;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#5844cb');

  // 取得攝影機影像
  video = createCapture(VIDEO);
  video.hide(); // 隱藏原始的攝影機串流
}

function draw() {
  background('#5844cb');

  // 計算影像顯示的寬高和位置
  let videoWidth = width * 0.8;
  let videoHeight = height * 0.8;
  let x = (width - videoWidth) / 2;
  let y = (height - videoHeight) / 2;

  // 左右翻轉影像
  push();
  translate(videoWidth, 0);
  scale(-1, 1);
  image(video, 0, y, videoWidth, videoHeight);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
