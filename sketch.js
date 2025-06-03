let video;
let canvas;
let ctx;
let handposeModel;
let predictions = [];

async function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    ctx = canvas.drawingContext;
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // 加載 Handpose 模型
    handposeModel = await handpose.load();
}

function draw() {
    background('#ffe6a7');
    ctx.clearRect(0, 0, width, height);

    // 調整視訊顯示位置和大小
    let videoWidth = video.width;
    let videoHeight = video.height;
    let displayWidth = windowWidth * 0.8;
    let displayHeight = windowHeight * 0.8;
    let scaleFactor = Math.min(displayWidth / videoWidth, displayHeight / videoHeight);
    let scaledWidth = videoWidth * scaleFactor;
    let scaledHeight = videoHeight * scaleFactor;
    let xOffset = (windowWidth - scaledWidth) / 2;
    let yOffset = (windowHeight - scaledHeight) / 2;

    push();
    translate(xOffset + scaledWidth / 2, yOffset + scaledHeight / 2);
    scale(-1, 1); // 鏡像視訊
    image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    pop();

    // 預測手部
    predictHands();

    // 繪製手部關鍵點和連接線
    drawHands();
}

async function predictHands() {
    if (video.loadedMetadata) {
        predictions = await handposeModel.estimateHands(video.elt);
    }
}

function drawHands() {
    stroke(0, 255, 0);
    strokeWeight(5);
    noFill();

    for (let i = 0; i < predictions.length; i++) {
        const hand = predictions[i];
        const landmarks = hand.landmarks;

        // 判斷左右手 (簡化判斷，可能不完全準確)
        const isLeft = hand.handInViewConfidence > 0.8 && landmarks[9][0] < landmarks[0][0]; // 手腕 x 小於中指根部 x

        // 定義要連接的關鍵點索引
        const groups = [
            [0, 1, 2, 3, 4],   // 手指 1
            [5, 6, 7, 8],    // 手指 2
            [9, 10, 11, 12],  // 手指 3
            [13, 14, 15, 16], // 手指 4
            [17, 18, 19, 20]  // 手指 5
        ];

        for (const group of groups) {
            beginShape();
            for (const index of group) {
                const x = map(landmarks[index][0], 0, video.width, (windowWidth - scaledWidth) / 2, (windowWidth - scaledWidth) / 2 + scaledWidth);
                const y = map(landmarks[index][1], 0, video.height, (windowHeight - scaledHeight) / 2, (windowHeight - scaledHeight) / 2 + scaledHeight);
                vertex(x, y);
            }
            endShape();
        }

        // 繪製關鍵點 (可選)
        fill(255, 0, 0);
        noStroke();
        for (let j = 0; j < landmarks.length; j++) {
            const x = map(landmarks[j][0], 0, video.width, (windowWidth - scaledWidth) / 2, (windowWidth - scaledWidth) / 2 + scaledWidth);
            const y = map(landmarks[j][1], 0, video.height, (windowHeight - scaledHeight) / 2, (windowHeight - scaledHeight) / 2 + scaledHeight);
            ellipse(x, y, 10, 10);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
