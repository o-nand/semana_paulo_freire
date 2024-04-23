let scenary, player, rope, opponent;
let defaultOpponentPosition;

const EVENTS = {
    PULL: Symbol("pull"),
    FELL: Symbol("fell"),
    REAPEARANCE: Symbol("reapearance"),
    NONE: Symbol("none")
};
let currentEvent = EVENTS.NONE;
let eventTarget;
let lastEventFrame = 0;

let lastPlayerPosition,
    lastOpponentPosition;
let lastFallenY,
    lastFallenHeight;

let angle = 0,
    force = 5,
    fall = 0;

class Scenary {
    constructor() {
        this.terrainWidth = displayWidth;
        this.terrainX = 0;

        this.groundHeight = displayHeight / 10;
        this.groundY = displayHeight - this.groundHeight;

        this.surfaceHeight = displayHeight / 4;
        //                                                  v offset pra remover o gap com o ground
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
    defaultOpponentPosition = opponent.x;

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

    switch(currentEvent) {
        case EVENTS.NONE: {
            /* FIXME:
            ao aplicar a oscilação tanto player quanto no oponente, suas posições levemente variam, o que pessoalmente
            me incomoda, mas é quase imperceptível
            */
            player.x += horizontal_oscillation;
            rope.y -= vertical_oscillation / 2;
            opponent.x += horizontal_oscillation;

            // oponente possui uma chance de 0.1% de puxar a corda a cada frame
            // if(Math.random() < 1/100) {
            //     currentEvent = EVENTS.PULL;
            //     eventTarget = {puller: opponent, pulled: player};

            //     lastOpponentPosition = opponent.x;
            //     lastEventFrame = frameCount;
            // }

            angle += 0.05;
        } break;
        case EVENTS.PULL: {
            const lastPosition = (eventTarget.puller == player) ? lastPlayerPosition : lastOpponentPosition;
            const eventDuration = frameCount - lastEventFrame;

            // no início do evento
            if(eventDuration <= 5) {
                eventTarget.puller.x += (eventTarget.puller == player) ? force : -force;
            }

            // durante todo o evento
            eventTarget.pulled.x += (eventTarget.puller == player) ? force : -force;
            force -= 0.1;

            if(eventDuration > 5) {
                eventTarget.puller.x = lerp(eventTarget.puller.x, lastPosition, 0.15);
                const outerHoleRadius = scenary.innerHoleWidth / 2;
                const offset = outerHoleRadius - eventTarget.pulled.width / 4;
                const holeEdge = (eventTarget.puller == player) ?
                                    (scenary.holeX - offset) :
                                    (scenary.holeX + offset);

                if((eventTarget.puller == player && eventTarget.pulled.x >= holeEdge)
                || (eventTarget.puller == opponent && eventTarget.pulled.x <= holeEdge)) {
                    force = 5;
                    eventTarget = eventTarget.pulled;
                    lastFallenHeight = eventTarget.height;
                    lastFallenY = eventTarget.y;
                    currentEvent = EVENTS.FELL;
                }
            }

            // no final do evento
            if(eventDuration >= 45) {
                force = 5;
                currentEvent = EVENTS.NONE;
            }
        } break;
        case EVENTS.FELL: {
            eventTarget.x += (eventTarget == player) ? -2 : 2;
            eventTarget.y += fall;
            eventTarget.height -= fall;
            fall += 1.5;

            if(eventTarget.height <= 0) {
                if(eventTarget == player) location.reload(); // TODO: tela de morte

                fall = 0;
                eventTarget.x = -eventTarget.width; // fora da tela
                eventTarget.y = lastFallenY;
                eventTarget.height = lastFallenHeight;

                lastEventFrame = frameCount;
                currentEvent = EVENTS.REAPEARANCE;
            }
        } break;
        case EVENTS.REAPEARANCE: {
            const eventDuration = frameCount - lastEventFrame;

            // no início do evento
            if(eventDuration <= 10) {
                player.x += force;
                force -= 0.1;
            }

            // durante todo o evento
            if(eventDuration > 5) {
                opponent.x = Math.floor(lerp(opponent.x, defaultOpponentPosition, 0.1));
            }

            if(eventDuration > 10) {
                player.x = Math.floor(lerp(player.x, lastPlayerPosition, 0.1));
            }

            // no final do evento
            if(eventDuration >= 40) {
                force = 5;
                currentEvent = EVENTS.NONE;
            }
        } break;
        default: /* unreachable */ break;
    }
}

function keyPressed() {
    if(keyCode === 32 && currentEvent == EVENTS.NONE) { // ao pressionar a tecla «espaço»
        currentEvent = EVENTS.PULL;
        eventTarget = {puller: player, pulled: opponent};

        lastEventFrame = frameCount;
        lastPlayerPosition = player.x;
    }
}
