let scenary, player, rope, opponent;
let lastEventFrame = 0;
let didPlayerPulled = false;
let defaultRopePosition, defaultPlayerPosition;
let force = 5;
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

class Character {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        // criará uma sombra embaixo do personagem
        fill(0, 0, 0, 20);
        ellipse(this.x + (this.width / 2), this.y + this.height, this.width * 2, 40); 

        fill(this.color);
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

function setup() {
    const height = 200;

    createCanvas(displayWidth, displayHeight);
    noSmooth();

    scenary = new Scenary();

    player = new Character(
        displayWidth - (displayWidth / 8), // canto direito
        scenary.surfaceY - (height / 2), // no centro da superfície
        50,
        height,
        color(20, 25, 104)
    );

    rope = new Rope(scenary.surfaceY - 30, 10);

    opponent = new Character(
        (displayWidth / 8) - 50, // canto esquerdo
        scenary.surfaceY - (height / 2), // no centro da superfície
        50,
        height,
        color(122, 18, 59)
    );

    defaultRopePosition = rope.y;
    defaultPlayerPosition = player.x;
}

function draw() {
    const amplitude = 0.5;
    const horizontal_oscillation = cos(angle) * amplitude;
    const vertical_oscillation = sin(angle) * amplitude;
    const currentFrame = frameCount;

    background(0, 170, 255);

    scenary.draw();
    player.draw();
    opponent.draw();
    rope.draw(); 

    if(didPlayerPulled) {
        const eventDuration = currentFrame - lastEventFrame;
        rope.y = defaultRopePosition;

        if(eventDuration <= 15) {
            player.x += force;
        } else {
            player.x = lerp(player.x, defaultPlayerPosition, 0.24);
        }

        if(eventDuration <= 30) {
            opponent.x += force;
            force -= 0.1;
        }

        if(eventDuration > 30) {
            didPlayerPulled = false;
            force = 5;
        }
    } else {
        player.x += horizontal_oscillation * 2.5;
        rope.y -= vertical_oscillation;
        opponent.x += horizontal_oscillation * 2.5;
    }

    angle += 0.05;
}

function keyPressed() {
    if(keyCode === 32 && !didPlayerPulled) { // tecla espaço
        didPlayerPulled = true;
        lastEventFrame = frameCount;
    }
}
