let video;
let handpose; // ml5 Handpose 模型
let predictions = []; // 儲存手部追蹤結果
let pg; // p5.Graphics 物件
let currentNumber;
let options = [];
let correctAnswer;
let score = 0;
let gameStarted = false;
let instructionDiv;
let optionPositions = [];
let optionRadius = 50;
let numberX, numberY;
let numberSize = 64;
let canAnswer = true;
let answerDelay = 500;
// let handPosition = null; // 不再直接使用手部中心估計
let touchThreshold = 60;

let numberPairs = [
    { number: 1, word: "one" },
    { number: 2, word: "two" },
    { number: 3, word: "three" },
    { number: 4, word: "four" },
    { number: 5, word: "five" }
    // 可以添加更多數字和單字
];

function preload() {
    handpose = ml5.handpose({ flipHorizontal: true }); // 初始化 Handpose 模型並水平翻轉
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background('#ffe6a7');

    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    handpose.on('predict', (results) => {
        predictions = results;
    });

    pg = createGraphics(video.width, video.height);

    instructionDiv = createDiv('將你的食指移動到對應的英文單字上');
    instructionDiv.id('instruction');

    startGame();
}

function startGame() {
    score = 0;
    generateQuestion();
    gameStarted = true;
    instructionDiv.html('將你的食指移動到對應的英文單字上');
    canAnswer = true;
    // handPosition = null; // 不再需要
}

function generateQuestion() {
    let randomIndex = floor(random(numberPairs.length));
    let pair = numberPairs[randomIndex];
    currentNumber = pair.number;
    correctAnswer = pair.word;

    options = [correctAnswer];
    while (options.length < 3) {
        let wrongPair = random(numberPairs);
        if (wrongPair.word !== correctAnswer && !options.includes(wrongPair.word)) {
            options.push(wrongPair.word);
        }
    }
    shuffle(options);

    numberX = width / 4;
    numberY = height / 2;

    optionPositions = [
        { x: width * 0.6, y: height / 3 },
        { x: width * 0.8, y: height / 2 },
        { x: width * 0.6, y: height * 2 / 3 }
    ];
}

function draw() {
    background('#ffe6a7');
    drawVideo();
    drawQuestion();
    drawOptions();
    drawHandPoints(); // 繪製追蹤到的手部關鍵點和進行觸碰檢測
    drawScore();
}

function drawVideo() {
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
    translate(x + scaledWidth / 2, y + scaledHeight / 2);
    scale(-1, 1);
    image(video, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    pop();
}

function drawQuestion() {
    fill(0);
    textSize(numberSize);
    textAlign(CENTER, CENTER);
    text(currentNumber, numberX, numberY);
}

function drawOptions() {
    textSize(24);
    for (let i = 0; i < options.length; i++) {
        fill(0, 100, 200);
        ellipse(optionPositions[i].x, optionPositions[i].y, optionRadius * 2);
        fill(255);
        textAlign(CENTER, CENTER);
        text(options[i], optionPositions[i].x, optionPositions[i].y);
    }
}

function drawHandPoints() {
    if (predictions.length > 0) {
        predictions.forEach(prediction => {
            const hand = prediction.handLandmarks;
            for (let i = 0; i < hand.length; i++) {
                const x = map(hand[i][0], 0, video.width, 0, width);
                const y = map(hand[i][1], 0, video.height, 0, height);
                fill(255, 0, 0);
                ellipse(x, y, 10); // 繪製手部關鍵點

                // 檢查食指尖端 (index 8) 是否觸碰到選項
                if (i === 8 && canAnswer) {
                    const fingerX = x;
                    const fingerY = y;
                    for (let j = 0; j < options.length; j++) {
                        let distance = dist(fingerX, fingerY, optionPositions[j].x, optionPositions[j].y);
                        if (distance < touchThreshold) {
                            console.log(`食指觸碰到選項 ${j} ('${options[j]}')`);
                            handleAnswer(options[j]);
                            break; // 避免同時觸發多個選項
                        }
                    }
                }
            }
        });
    }
}

function handleAnswer(selectedAnswer) {
    if (selectedAnswer === correctAnswer) {
        score++;
        instructionDiv.html('答對了！分數：' + score);
    } else {
        instructionDiv.html('再試一次！分數：' + score);
    }
    canAnswer = false;
    setTimeout(() => {
        generateQuestion();
        canAnswer = true;
    }, answerDelay);
}

function drawScore() {
    fill(0);
    textSize(20);
    textAlign(LEFT, TOP);
    text('分數: ' + score, 20, 20);
}

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

function keyPressed() {
    if (key === 'r' || key === 'R') {
        startGame();
    }
    if (key === 's' || key === 'S') {
        saveCanvas('math_pairing_game', 'png');
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
