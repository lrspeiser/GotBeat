// sketch.js

let balls = [];
let boxes = [];
let missedBalls = [];
let score = 0;
let misses = 0;
let goodHits = 0;
let perfectHits = 0;
let song;
let songConfig;
let gameStarted = false;
let startButtonVisible = false;
let gameStartTime;

const BALL_DIAMETER = 20;
const BOX_SIZE = BALL_DIAMETER * 4;
const BALL_TRAVEL_TIME = 3; // Desired travel time for balls in seconds
const TARGET_CIRCLE_DIAMETER = BALL_DIAMETER * 1.25; // 25% larger

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_DIRECTIONS = {};
let NOTE_COLORS; // Declare NOTE_COLORS here

// Added difficulty setting
let difficulty = "easy"; // Can be 'easy', 'medium', or 'hard'

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60); // Set frame rate to 60 FPS for consistent movement

  // Initialize NOTE_COLORS in setup
  NOTE_COLORS = [
    color(255, 0, 0), // C - Red
    color(255, 127, 0), // C# - Orange
    color(255, 255, 0), // D - Yellow
    color(127, 255, 0), // D# - Light Green
    color(0, 255, 0), // E - Green
    color(0, 255, 127), // F - Cyan
    color(0, 255, 255), // F# - Light Blue
    color(0, 127, 255), // G - Blue
    color(0, 0, 255), // G# - Dark Blue
    color(127, 0, 255), // A - Violet
    color(255, 0, 255), // A# - Magenta
    color(255, 0, 127), // B - Pink
  ];

  createBoxes();
}

class Ball {
  constructor(note, startTime, endTime, targetPos, noteIndex) {
    this.note = note;
    this.startTime = startTime;
    this.endTime = endTime;
    this.missed = false;
    this.pos = createVector(width / 2, height / 2);
    this.targetPos = targetPos; // Target position is set when creating the ball
    this.distance = p5.Vector.dist(this.pos, this.targetPos);
    this.speed = p5.Vector.sub(this.targetPos, this.pos).div(BALL_TRAVEL_TIME); // Speed is distance divided by travel time
    this.launched = false;
    this.hit = false;
    this.color = NOTE_COLORS[noteIndex]; // Color based on note
  }

  update(currentTime) {
    if (currentTime >= this.startTime - BALL_TRAVEL_TIME && !this.launched) {
      this.launched = true;
      this.speed = p5.Vector.sub(this.targetPos, this.pos).div(
        BALL_TRAVEL_TIME,
      ); // Recalculate speed in case of any changes
    }
    if (this.launched && !this.hit) {
      this.pos.add(p5.Vector.mult(this.speed, deltaTime / 1000));
    }
  }

  show() {
    if (this.launched && !this.hit) {
      fill(this.color);
      ellipse(this.pos.x, this.pos.y, BALL_DIAMETER, BALL_DIAMETER);
    }
  }

  isOffScreen() {
    return (
      this.pos.x < -BALL_DIAMETER ||
      this.pos.x > width + BALL_DIAMETER ||
      this.pos.y < -BALL_DIAMETER ||
      this.pos.y > height + BALL_DIAMETER
    );
  }
}

class Box {
  constructor(x, y, note, noteIndex) {
    this.pos = createVector(x, y);
    this.size = BOX_SIZE;
    this.center = createVector(x + BOX_SIZE / 2, y + BOX_SIZE / 2);
    this.note = note;
    this.originalColor = NOTE_COLORS[noteIndex];
    this.hitColor = color(0, 255, 0);
    this.centerHitColor = color(255, 215, 0);
    this.noballColor = color(255, 0, 0);
    this.currentColor = this.originalColor;
  }

  show() {
    fill(this.currentColor);
    rect(this.pos.x, this.pos.y, this.size, this.size);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.note, this.center.x, this.center.y);

    // Draw target circle in center
    noFill();
    stroke(0);
    ellipse(
      this.center.x,
      this.center.y,
      TARGET_CIRCLE_DIAMETER,
      TARGET_CIRCLE_DIAMETER,
    );
  }

  contains(x, y) {
    return (
      x >= this.pos.x &&
      x < this.pos.x + this.size &&
      y >= this.pos.y &&
      y < this.pos.y + this.size
    );
  }

  containsPoint(x, y) {
    return (
      x >= this.pos.x &&
      x < this.pos.x + this.size &&
      y >= this.pos.y &&
      y < this.pos.y + this.size
    );
  }

  isGoldHit(x, y) {
    let d = dist(x, y, this.center.x, this.center.y);
    return d <= TARGET_CIRCLE_DIAMETER / 2;
  }

  changeColor(color) {
    this.currentColor = color;
    setTimeout(() => {
      this.currentColor = this.originalColor;
    }, 200);
  }
}

function preload() {
  loadSongData();
}

function loadSongData() {
  let songName = "go"; // Change this to your song name
  song = loadSound(`mp3/${songName}.mp3`);
  loadJSON(`songdata/${songName}.json`, gotSongConfig);
}

function gotSongConfig(config) {
  songConfig = config;
  console.log("[main/gotSongConfig] Song config loaded:", songConfig);
  setDifficulty(difficulty);
  startButtonVisible = true;
}

function draw() {
  background(220);

  if (gameStarted) {
    updateGame();
  } else if (startButtonVisible) {
    drawStartButton();
  }

  for (let box of boxes) {
    box.show();
  }

  for (let ball of balls) {
    ball.show();
  }

  fill(0);
  textSize(16);
  textAlign(RIGHT, TOP);
  text(
    `Misses: ${misses}, Good: ${goodHits}, Perfect: ${perfectHits}, Total Points: ${score}`,
    width - 10,
    10,
  );
}

function updateGame() {
  let currentTime = (millis() - gameStartTime) / 1000;

  // Launch new balls
  while (songConfig.notes.length > 0 && currentTime >= songConfig.notes[0].startTime - BALL_TRAVEL_TIME) {
    let noteData = songConfig.notes.shift();
    console.log('[main/updateGame] Launching new ball:', noteData);

    // Find the corresponding box and set the target position
    let targetBox = boxes.find(box => box.note === noteData.note);
    if (targetBox) {
      let noteIndex = NOTES.indexOf(noteData.note);
      let newBall = new Ball(noteData.note, noteData.startTime, noteData.endTime, createVector(targetBox.center.x, targetBox.center.y), noteIndex);
      balls.push(newBall);
    }
  }

  // Update balls
  for (let ball of balls) {
    ball.update(currentTime);

    // Check for missed balls
    if (ball.isOffScreen() && !ball.hit && !ball.missed) {
      ball.missed = true;
      missedBalls.push(ball);
      score -= 1;
      misses++;
      console.log(`[main/updateGame] Ball missed: note=${ball.note}, startTime=${ball.startTime.toFixed(2)}`);
      console.log(`[main/updateGame] Score decreased due to miss. New score: ${score}`);
    }
  }

  // Remove balls that are off screen
  balls = balls.filter(ball => !ball.isOffScreen());

  // Process missed balls
  for (let missedBall of missedBalls) {
    console.log(`[main/updateGame] Processing missed ball: note=${missedBall.note}, startTime=${missedBall.startTime.toFixed(2)}`);
    // You can add any additional logic for missed balls here
  }
  missedBalls = []; // Clear the missed balls array after processing
}

function drawStartButton() {
  fill(0, 255, 0);
  rect(width / 2 - 50, height / 2 - 25, 100, 50);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("Start", width / 2, height / 2);
}

function startGame() {
  gameStarted = true;
  startButtonVisible = false;
  gameStartTime = millis();
  console.log("[main/startGame] Game started at:", gameStartTime);

  setTimeout(() => {
    song.play();
    console.log("[main/startGame] Song started playing.");
  }, 2000); // Delay the song start by 2 seconds to align with the first ball launch
}

function mousePressed() {
  if (startButtonVisible) {
    if (
      mouseX > width / 2 - 50 &&
      mouseX < width / 2 + 50 &&
      mouseY > height / 2 - 25 &&
      mouseY < height / 2 + 25
    ) {
      console.log("[main/mousePressed] Start button pressed.");
      startGame();
    }
  } else if (gameStarted) {
    checkBoxInteraction(mouseX, mouseY);
  }
}

function touchStarted() {
  mousePressed();
  return false; // Prevent default
}

function checkBoxInteraction(x, y) {
  console.log(`[main/checkBoxInteraction] Box pressed at: (${x.toFixed(2)}, ${y.toFixed(2)})`);

  let clickedBox = null;
  for (let box of boxes) {
    if (box.contains(x, y)) {
      clickedBox = box;
      break;
    }
  }

  if (clickedBox) {
    console.log('[main/checkBoxInteraction] Box pressed:', clickedBox.note);
    console.log(`[main/checkBoxInteraction] Box position: (${clickedBox.pos.x.toFixed(2)}, ${clickedBox.pos.y.toFixed(2)}), size: ${clickedBox.size}`);
    let currentTime = (millis() - gameStartTime) / 1000;
    console.log(`[main/checkBoxInteraction] Current time: ${currentTime.toFixed(2)}`);
    let hitBall = null;

    for (let ball of balls) {
      console.log(`[main/checkBoxInteraction] Checking ball: note=${ball.note}, pos=(${ball.pos.x.toFixed(2)}, ${ball.pos.y.toFixed(2)}), startTime=${ball.startTime.toFixed(2)}, endTime=${ball.endTime.toFixed(2)}, hit=${ball.hit}, missed=${ball.missed}`);
      if (ball.note === clickedBox.note && !ball.hit && !ball.missed && 
          clickedBox.containsPoint(ball.pos.x, ball.pos.y)) {
        hitBall = ball;
        break;
      }
    }

    if (hitBall) {
      console.log(`[main/checkBoxInteraction] Ball hit at: (${hitBall.pos.x.toFixed(2)}, ${hitBall.pos.y.toFixed(2)})`);

      const isGold = clickedBox.isGoldHit(hitBall.pos.x, hitBall.pos.y);

      console.log(`[main/checkBoxInteraction] Gold hit: ${isGold}`);

      if (isGold) {
        score += 5;
        perfectHits++;
        clickedBox.changeColor(clickedBox.centerHitColor);
        hitBall.color = clickedBox.centerHitColor;
        console.log('[main/checkBoxInteraction] Ball hit gold zone. Score:', score);
      } else {
        score += 1;
        goodHits++;
        clickedBox.changeColor(clickedBox.hitColor);
        hitBall.color = clickedBox.hitColor;
        console.log('[main/checkBoxInteraction] Ball hit silver zone. Score:', score);
      }
      hitBall.hit = true;
    } else {
      console.log('[main/checkBoxInteraction] No ball hit.');
      score -= 1;
      misses++;
      clickedBox.changeColor(clickedBox.noballColor);
      console.log(`[main/checkBoxInteraction] Score decreased due to miss. New score: ${score}`);
    }
  } else {
    console.log('[main/checkBoxInteraction] No box clicked.');
  }
}


function createBoxes() {
  let boxCount = NOTES.length;
  let centerX = width / 2;
  let centerY = height / 2;
  let radius = min(width, height) * 0.4;

  for (let i = 0; i < boxCount; i++) {
    let angle = map(i, 0, boxCount, -PI / 2, (3 * PI) / 2);
    let x = centerX + radius * cos(angle) - BOX_SIZE / 2;
    let y = centerY + radius * sin(angle) - BOX_SIZE / 2;
    let box = new Box(x, y, NOTES[i], i);
    boxes.push(box);
    NOTE_DIRECTIONS[NOTES[i]] = angle;
  }
}

function setDifficulty(diff) {
  difficulty = diff;
  let filteredNotes = [];
  let lastNoteTime = -1; // Start at -1 to allow a note at 0 seconds

  for (let note of songConfig.notes) {
    if (Math.floor(note.startTime) > lastNoteTime) {
      filteredNotes.push(note);
      lastNoteTime = Math.floor(note.startTime);
    }
  }

  songConfig.notes = filteredNotes;
  console.log(`[setDifficulty] Filtered notes: ${filteredNotes.length}`);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createBoxes();
}
