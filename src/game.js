let scenary, player, rope, opponent;
let angle = 0;

class Scenary {
    constructor() {
        this.terrainWidth = displayWidth;
        this.terrainX = 0;

        this.groundHeight = displayHeight / 10;
        this.groundY = displayHeight - this.groundHeight;

        this.surfaceHeight = displayHeight / 4;
        this.surfaceY = this.groundY - this.surfaceHeight;
    }

    draw() {
        noStroke();
        fill(104, 50, 20);
        rect(this.terrainX, this.groundY, this.terrainWidth, this.groundHeight);
    
        noStroke();
        fill(155, 74, 31);
        rect(this.terrainX, this.surfaceY, this.terrainWidth, this.surfaceHeight);
    }
}

class Player {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        fill(0, 0, 0, 20);
        ellipse(this.x + (this.width / 2), this.y + this.height, this.width * 2, 40);

        fill(20, 25, 104);
        rect(this.x, this.y, this.width, this.height);
    }
}

class Rope {
    constructor(y, height) {
        this.x = 0;
        this.y = y;
        this.width = displayWidth;
        this.height = height;
        this.angle = 0;
    }

    draw() {
        fill(43, 29, 0);
        rect(this.x, this.y, this.width, this.height);
    }
}

class Opponent {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        fill(0, 0, 0, 20);
        ellipse(this.x + (this.width / 2), this.y + this.height, this.width * 2, 40);

        fill(122, 18, 59);
        rect(this.x, this.y, this.width, this.height);
    }
}

function setup() {
    const height = 200;

    createCanvas(displayWidth, displayHeight);
    noSmooth();

    scenary = new Scenary();
    player = new Player(
        displayWidth - (displayWidth / 8), // canto direito
        scenary.surfaceY - (height / 2), // no centro da superfície
        50,
        height
    );
    rope = new Rope(scenary.surfaceY - 30, 10);
    opponent = new Opponent(
        displayWidth / 8 - 50, // canto esquerdo
        scenary.surfaceY - (height / 2), // no centro da superfície
        50,
        height
    );
}

function draw() {
    const amplitude = 0.5;
    const horizontal_oscillation = cos(angle) * amplitude;
    const vertical_oscillation = sin(angle) * amplitude;

    background(0, 170, 255);

    scenary.draw();
    player.draw();
    opponent.draw();
    rope.draw();

    player.x += horizontal_oscillation * 2.5;
    rope.y -= vertical_oscillation;
    opponent.x += horizontal_oscillation * 2.5;

    angle += 0.05
}
