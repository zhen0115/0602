let video;
let detector;
let hands;
let currentNumber, correctAnswer, options = [];
let optionPositions = [];
let score = 0;
let instructionDiv;
let numberX, numberY;
let numberSize = 64;
let redDot = { x: 200, y: 300, r: 20, dragging: false };
let pinchThreshold = 40;

let numberPairs = [
  { number: 1, word: "one" },
  { number: 2, word: "two" },
  { number: 3, word: "three" },
  { number: 4, word: "four" },
  { number: 5, word: "five" }
];

async function setup() {
  createCanvas(windowWidth, windowHeight);
  instructionDiv = select('#instruction');
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Load hand detector
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    modelType: 'lite',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
  };
  detector = await handPoseDetection.createDetector(model, detectorConfig);

  generateQuestion();
}

function generateQuestion() {
  let index = floor(random(numberPairs.length));
  currentNumber = numberPairs[index].number;
  correctAnswer = numberPairs[index].word;

  options = [correctAnswer];
  while (options.length < 3) {
    let candidate = random(numberPairs);
    if (!options.includes(candidate.word)) options.push(candidate.word);
  }
  shuffle(options);

  optionPositions = [
    { x: width * 0.6, y: height / 3 },
    { x: width * 0.8, y: height / 2 },
    { x: width * 0.6, y: height * 2 / 3 }
  ];
  numberX = width / 4;
  numberY = height / 2;
  redDot.x = width / 4;
  redDot.y = height / 2 + 100;
}

