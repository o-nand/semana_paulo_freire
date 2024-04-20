let scenary, player, rope, opponent;

const EVENTS = {
    PULL: Symbol("pull"),
    NONE: Symbol("none")
};
let current_event = EVENTS.NONE;
let event_target;

let lastPlayerPosition,
    lastOpponentPosition;

let lastEventFrame = 0;
let force = 5;
let angle = 0;

class Scenary {
    constructor() {
        this.terrainWidth = displayWidth;
        this.terrainX = 0;

        this.groundHeight = displayHeight / 10;
        this.groundY = displayHeight - this.groundHeight;

        this.surfaceHeight = displayHeight / 4;
        this.surfaceY = this.groundY - this.surfaceHeight + 1;

        this.holeX = displayWidth / 2;
    
        this.outerHoleWidth = displayWidth / 3;
        this.outerHoleHeight = this.surfaceHeight / 1.2;
        this.outerHoleY = this.surfaceY + (this.outerHoleHeight / 2) + 10;

        this.innerHoleWidth = displayWidth / 3.5;
        this.innerHoleHeight = this.surfaceHeight / 1.5;
        this.innerHoleY = this.surfaceY + (this.innerHoleHeight / 2) + 20;
    }

    draw() {
        noStroke();
        fill(104, 50, 20);
        rect(this.terrainX, this.groundY, this.terrainWidth, this.groundHeight);
    
        noStroke();
        fill(155, 74, 31);
        rect(this.terrainX, this.surfaceY, this.terrainWidth, this.surfaceHeight);

        noStroke();
        fill(76, 36, 15);
        ellipse(this.holeX, this.outerHoleY, this.outerHoleWidth, this.outerHoleHeight);

        noStroke();
        fill(25, 12, 5);
        ellipse(this.holeX, this.innerHoleY, this.innerHoleWidth, this.innerHoleHeight);
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
    createCanvas(displayWidth, displayHeight);
    noSmooth();

    scenary = new Scenary();

    const characterWidth = 50;
    const characterHeight = 200;
    const characterY = (scenary.surfaceY * 1.2) - characterHeight; // no centro da superfície

    player = new Character(
        displayWidth - (displayWidth / 8), // canto direito
        characterY,
        characterWidth,
        characterHeight,
        color(20, 25, 104)
    );

    opponent = new Character(
        (displayWidth / 8) - characterWidth, // canto esquerdo
        characterY, // no centro da superfície
        characterWidth,
        characterHeight,
        color(122, 18, 59)
    );

    rope = new Rope(characterY + (characterHeight / 2.5), 10);
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

    switch(current_event) {
        case EVENTS.NONE:
            player.x += (horizontal_oscillation * 2.5);
            rope.y -= vertical_oscillation;
            opponent.x += (horizontal_oscillation * 2.5);

            // // oponente possui uma chance de 0.1% de puxar a corda a cada frame
            // if(Math.random() < 1/100) {
            //     current_event = EVENTS.PULL;
            //     event_target = {puller: opponent, pulled: player};

            //     lastOpponentPosition = opponent.x;
            //     lastEventFrame = frameCount;
            // }

            angle += 0.05;
        break;
        case EVENTS.PULL:
            const lastPosition = (event_target.puller == player) ? lastPlayerPosition : lastOpponentPosition;
            const eventDuration = frameCount - lastEventFrame;

            if(eventDuration <= 5) {
                if(event_target.puller == player) event_target.puller.x += (force * 1.5);
                else event_target.puller.x -= (force * 1.5);
            } else {
                event_target.puller.x = lerp(event_target.puller.x, lastPosition, 0.1);
            }

            if(eventDuration <= 30) {
                if(event_target.puller == player) event_target.pulled.x += force;
                else event_target.pulled.x -= force;
                force -= 0.1;
            }

            if(eventDuration > 30) {
                force = 5;
                current_event = EVENTS.NONE;
            }
        break;
        default: /* unreachable */ break;
    }
}

function keyPressed() {
    if(keyCode === 32 && current_event == EVENTS.NONE) { // ao pressionar a tecla «espaço»
        current_event = EVENTS.PULL;
        event_target = {puller: player, pulled: opponent};

        lastEventFrame = frameCount;
        lastPlayerPosition = player.x;  
    }
}
