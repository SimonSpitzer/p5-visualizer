let mic, fft;
let circles = [];
let nextCircleTime = 0;
let maxCircles = 12; 

let palette = [
  [0, 178, 238],
  [209, 238, 238],
  [210, 105, 30],
  [255, 193, 37],
  [139, 26, 26]
];

let sketchStartTime;

function setup() {
  createCanvas(600, 400);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8, 512);
  fft.setInput(mic);
  strokeWeight(2);
  background(15, 10, 10);
  frameRate(60);
  sketchStartTime = millis();
}

function draw() {
  background(15, 10, 10, 5);

  let energy = fft.getEnergy("lowMid") + fft.getEnergy("mid") + fft.getEnergy("highMid");

  // neuen Kreis spawnen
  if (millis() > nextCircleTime && circles.length < maxCircles) {
    let c1 =  random(palette);
    let c2 = random(palette);
    circles.push({
      r: 0,
      c1: c1.slice(),
      c2: c2.slice(),
      displayC1: c1.slice(),
      displayC2: c2.slice(),
      offset: random(1000),
      startX: width/2 + random(-20, 20),
      startY: height/2 + random(-20, 20),
      grainTimer: 0,
      wobblePhase: random(1000),
      negOffset: random(0, 5000) // Verzögerung für diesen Kreis
    });
    nextCircleTime = millis() + 1000;
  }

  let elapsed = millis() - sketchStartTime;

  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];

    // Wachstum
    let minSpeed = 0.5;
    let maxSpeed = 6 + map(energy, 0, 255, 0, 2);
    let growthSpeed = minSpeed + pow(c.r / width, 2) * (maxSpeed - minSpeed);
    c.r += growthSpeed;
    let radius = c.r;

    // Farbphase für diesen Kreis
    let t = 0;
    let localElapsed = elapsed - c.negOffset;
    if (localElapsed > 20000 && localElapsed <= 22000) t = map(localElapsed, 20000, 22000, 0, 1); // ins Negativ in 2s
    else if (localElapsed > 22000 && localElapsed <= 32000) t = 1; // Negativ halten 10s
    else if (localElapsed > 32000 && localElapsed <= 34000) t = map(localElapsed, 32000, 34000, 1, 0); // zurück in 2s
    else t = 0;

    for (let j = 0; j < 3; j++) {
      c.displayC1[j] = lerp(c.c1[j], 255 - c.c1[j], t);
      c.displayC2[j] = lerp(c.c2[j], 255 - c.c2[j], t);
    }

    // Wobble sanft
    let impulse = energy > 10;
    let wobbleAmount = impulse ? map(energy, 0, 255, 5, 20) : 0;
    let wobbleSpeed = 0.01;
    let wobble = sin(frameCount * wobbleSpeed + c.wobblePhase) * wobbleAmount;
    let displayRadius = radius + wobble;

    // Farbverlauf
    let ctx = drawingContext;
    let grad = ctx.createLinearGradient(c.startX - displayRadius/2, 0, c.startX + displayRadius/2, 0);
    grad.addColorStop(0, `rgb(${c.displayC1[0]},${c.displayC1[1]},${c.displayC1[2]})`);
    grad.addColorStop(1, `rgb(${c.displayC2[0]},${c.displayC2[1]},${c.displayC2[2]})`);
    ctx.fillStyle = grad;
    noStroke();
    ellipse(c.startX, c.startY, displayRadius, displayRadius);

    // Audio-Impulse: Grain kurz verstärken
    if (impulse) c.grainTimer = 10;
    let grainMultiplier = c.grainTimer > 0 ? 3 : 1;
    if (c.grainTimer > 0) c.grainTimer--;

    // Grain & bröseliger Rand
    push();
    translate(c.startX, c.startY);
    noFill();
    strokeWeight(1);

    let baseIntensity = map(energy, 0, 255, 30, 120) * grainMultiplier;
    let alpha = map(energy, 0, 255, 40, 180);

    let numPoints = int(min(radius * radius * 0.08, 8000));
    for (let j = 0; j < numPoints; j++) {
      let a = random(TWO_PI);
      let r = radius/2 * sqrt(random());
      let n = noise(c.offset + j*0.01, frameCount*0.005) * baseIntensity;
      let x = cos(a) * r + random(-n, n);
      let y = sin(a) * r + random(-n, n);
      stroke(255, alpha);
      point(x, y);
    }

    let edgePoints = int(radius * 2);
    let edgeAmp = map(energy, 0, 255, 1, 25) * grainMultiplier;
    for (let j = 0; j < edgePoints; j++) {
      let a = random(TWO_PI);
      let r = radius/2 + random(-edgeAmp, edgeAmp);
      let x = cos(a) * r;
      let y = sin(a) * r;
      stroke(255, alpha);
      point(x, y);
    }
    pop();

    // Entfernen
    if (c.r > width * 1.5) circles.splice(i, 1);
  }
}

function mousePressed() {
  userStartAudio();
}
