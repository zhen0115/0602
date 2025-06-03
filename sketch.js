let video;
let canvas;
let ctx;
let handposeModel;
let predictions = [];
let circleX;
let circleY;
let circleRadius = 50;
let dragging = false;
let touchPointId = null; // 追蹤哪個手指正在拖曳

async function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    ctx = canvas.drawingContext;
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // 加載 Handpose 模型
    handposeModel = await handpose.load();

    // 初始化圓形位置
    circleX = width / 2;
    circleY = height / 2;
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

    // 檢查是否正在拖曳
    if (dragging && predictions.length > 0) {
        let draggingPoint = null;
        for (const hand of predictions) {
            const indexFingerTip = hand.landmarks[8];
            const handId = hand.id || 0; // 如果沒有 id，預設為 0

            const fingerX = map(indexFingerTip[0], 0, video.width, (windowWidth - scaledWidth) / 2, (windowWidth - scaledWidth) / 2 + scaledWidth);
            const fingerY = map(indexFingerTip[1], 0, video.height, (windowHeight - scaledHeight) / 2, (windowHeight - scaledHeight) / 2 + scaledHeight);

            if (handId === touchPointId) {
                draggingPoint = { x: fingerX, y: fingerY };
                break;
            }
        }
        if (draggingPoint) {
            circleX = draggingPoint.x;
            circleY = draggingPoint.y;
        } else {
            dragging = false;
            touchPointId = null;
        }
    } else {
        // 檢查是否觸碰到圓形
        if (predictions.length > 0 && !dragging) {
            for (const hand of predictions) {
                const indexFingerTip = hand.landmarks[8];
                const handId = hand.id || 0; // 如果沒有 id，預設為 0

                const fingerX = map(indexFingerTip[0], 0, video.width, (windowWidth - scaledWidth) / 2, (windowWidth - scaledWidth) / 2 + scaledWidth);
                const fingerY = map(indexFingerTip[1], 0, video.height, (windowHeight - scaledHeight) / 2, (windowHeight - scaledHeight) / 2 + scaledHeight);

                const distance = dist(fingerX, fingerY, circleX, circleY);
                if (distance < circleRadius) {
                    dragging = true;
                    touchPointId = handId;
                    break; // 只允許一個手指拖曳
                }
            }
        }
    }

    // 繪製圓形
    fill(255, 105, 180); // 熱情的粉紅色
    noStroke();
    ellipse(circleX, circleY, circleRadius * 2);

    // 繪製手部關鍵點 (可選)
    if (!dragging) {
        drawHands();
    }
}

async function predictHands() {
    if (video.loadedMetadata) {
        const estimationConfig = { flipHorizontal: true }; // 根據您的需求調整
        predictions = await handposeModel.estimateHands(video.elt, estimationConfig);

        // 為每個偵測到的手分配一個簡單的 ID (如果模型沒有提供)
        predictions.forEach((prediction, index) => {
            prediction.id = prediction.id || index;
        });
    }
}

function drawHands() {
    stroke(0, 255, 0);
    strokeWeight(5);
    noFill();

    for (const hand of predictions) {
        const landmarks = hand.landmarks;

        for (let j = 0; j < landmarks.length; j++) {
            const x = map(landmarks[j][0], 0, video.width, (windowWidth - scaledWidth) / 2, (windowWidth - scaledWidth) / 2 + scaledWidth);
            const y = map(landmarks[j][1], 0, video.height, (windowHeight - scaledHeight) / 2, (windowHeight - scaledHeight) / 2 + scaledHeight);
            ellipse(x, y, 10, 10); // 繪製關鍵點
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    circleX = width / 2;
    circleY = height / 2;
}
