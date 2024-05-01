// - Variáveis Globais -

let pullingSystem,
    scoringSystem,
    scenary,
    player,
    rope,
    opponent;
let defaultOpponentPosition;

const EVENTS = {
    PULL: Symbol("pull"),
    FELL: Symbol("fell"),
    REAPEARANCE: Symbol("reapearance"),
    COUNTDOWN: Symbol("countdown"),
    NONE: Symbol("none")
};
let currentEvent = EVENTS.COUNTDOWN;
let eventTarget;
let lastEventFrame = 0;

let lastCharacterPosition;
let lastFallenY,
    lastFallenHeight,
    lastFallenForce;

let angle = 0,
    force = 5,
    fall = 0;

let scored = false;
let lastScoreFrame = 0;

let round = 0;

let count = 3;
let countY;
let countTransparency = 0;

// - Estruturas -

class PullingSystem {
    constructor() {
        this.containerBorderSize = 5;
        this.containerWidth = 50;
        this.containerHeight = displayHeight / 2.5;
        this.containerX = (displayWidth - this.containerWidth) - this.containerBorderSize;
        this.containerY = (displayHeight / 1.8) - this.containerHeight;

        this.targetY;
        this.targetHeight = 20;
        this.targetTop;
        this.targetBottom;

        this.pointerY;
        this.pointerHeight = 5;
        this.pointerVelocity = 1;
        this.pointerDirection = 1; // 1 = baixo, -1 = cima

        this.containedX = this.containerX + this.containerBorderSize;
        this.containedWidth = 50 - (this.containerBorderSize * 2); // multiplicado por 2 pra descontar as bordas de ambos os lados
        this.containerBottom = (this.containerY + this.containerHeight) - this.containerBorderSize;
        this.containerTop = this.containerY + this.containerBorderSize;

        this.containedAnimatedX = this.containedX;
        this.containedAnimateWidth = this.containedWidth;
        this.containedTransparency = 500;

        this.targetAnimatedHeight = this.targetHeight;
        this.pointerAnimatedHeight = this.pointerHeight;

        this.lastWasHit = false;
        this.lastWasFail = false;
    }

    randomizeContained() {
        const minTargetTop = this.containerTop + this.containerHeight / 5;
        const maxTargetBottom = (this.containerBottom - this.targetHeight) - this.containerHeight / 5;
        this.targetY = Math.random() * (maxTargetBottom - minTargetTop) + minTargetTop;

        this.targetTop = this.targetY - this.pointerHeight;
        this.targetBottom = this.targetY + this.targetHeight;

        this.pointerDirection = -this.pointerDirection;
        this.pointerY = (this.pointerDirection === 1) ? this.containerTop : this.containerBottom;
    }

    drawContainer() {
        strokeWeight(this.containerBorderSize);
        stroke(40);
        fill(70, 70, 70);
        rect(this.containerX, this.containerY, this.containerWidth, this.containerHeight);
        noStroke();

        if(this.lastWasHit || this.lastWasFail) {
            this.drawContainedRemains();
        }
    }

    drawContained() {
        // desenha o alvo
        fill(80, 215, 70);
        rect(this.containedX, this.targetY, this.containedWidth, this.targetHeight);

        // desenha o pointeiro
        fill(255, 255, 255);
        rect(this.containedX, this.pointerY, this.containedWidth, this.pointerHeight);
    }

    drawContainedRemains() {
        const targetColor = (this.lastWasHit) ?
                                color(80, 215, 70, this.containedTransparency) : // verde padrão se tiver acertado
                                color(247, 30, 30, this.containedTransparency);  // vermelho se tiver rerrado
        this.containedTransparency = Math.floor(lerp(this.containedTransparency, 0, 0.1));

        this.containedAnimatedX -= 0.5;
        this.containedAnimateWidth++;

        this.targetY -= 0.5;
        this.targetAnimatedHeight++;

        fill(targetColor);
        rect(this.containedAnimatedX, this.targetY, this.containedAnimateWidth, this.targetAnimatedHeight);

        if(this.lastWasFail) { // desenha o ponteiro se a última interação tiver sido uma falha
            this.pointerAnimatedHeight++;
            fill(255, 255, 255, this.containedTransparency);
            rect(this.containedAnimatedX, this.pointerY, this.containedAnimateWidth, this.pointerHeight);
        }

        if(this.containedTransparency === 0) {
            this.resetAnimation();
        }
    }

    resetAnimation() {
        this.containedAnimatedX = this.containedX;
        this.containedAnimateWidth = this.containedWidth;
        this.containedTransparency = 500;
        this.targetAnimatedHeight = this.targetHeight;
        this.pointerAnimatedHeight = this.pointerHeight;
        this.lastWasHit = false;
        this.lastWasFail = false;
    }

    movePointer() {
        this.pointerY += this.pointerVelocity * this.pointerDirection;
    }

    isPointerOutOfBounds() {
        return this.pointerDirection === -1 && this.pointerY < this.targetTop
            || this.pointerDirection === 1 && this.pointerY > this.targetBottom;
    }

    isPointerInBounds() {
        return this.pointerY > this.targetTop
            && this.pointerY < this.targetBottom;
    }
}

class ScoringSystem {
    constructor() {
        this.score = 0;
        this.newPointSize = 0;
        this.newPointY = displayHeight / 2;
        this.textX = displayWidth / 2;
    }

    drawScore() {
        fill(255, 255, 255);
        textSize(64);
        textAlign(CENTER);
        text(this.score, this.textX, 90);
    }

    drawNewPoint() {
        const scoreDuration = frameCount - lastScoreFrame;

        fill(255, 255, 255);
        textAlign(CENTER);
        textSize(this.newPointSize);
        text("+1", this.textX, this.newPointY);

        // no início do evento
        if(scoreDuration <= 30) {
            this.newPointSize = lerp(this.newPointSize, 42, 0.1);
            this.newPointY = lerp(this.newPointY, displayHeight / 4, 0.1);
        }

        // durante todo o evento
        if(scoreDuration > 40 && scoreDuration <= 60) {
            this.newPointSize = lerp(this.newPointSize, 0, 0.1);
            this.newPointY = lerp(this.newPointY, 90, 0.1);
        }

        // no final do evento
        if(scoreDuration > 60) {
            this.score++;
            this.newPointSize = 0
            this.newPointY = displayHeight / 2;
            scored = false;
        }
    }
}

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
        this.outerHoleY = this.surfaceY + (this.outerHoleHeight / 1.8);

        this.innerHoleWidth = displayWidth / 3.5;
        this.innerHoleHeight = this.surfaceHeight / 1.5;
        this.innerHoleY = this.surfaceY + (this.innerHoleHeight / 1.5);
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
    constructor(y) {
        this.x = 0;
        this.y = y;
        this.width = displayWidth;
        this.height = 10;
    }

    draw() {
        fill(43, 29, 0);
        rect(this.x, this.y, this.width, this.height);
    }
}

// - Principais Funções -

function returnToDefaultEvent() {
    currentEvent = EVENTS.NONE;
    pullingSystem.randomizeContained();
    fall = 0;
    force = 5;
}

// executará apenas uma vez, no início do jogo
function setup() {
    createCanvas(displayWidth, displayHeight);
    noSmooth();

    scoringSystem = new ScoringSystem();
    pullingSystem = new PullingSystem();

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
        characterY,
        characterWidth,
        characterHeight,
        color(122, 18, 59)
    );
    defaultOpponentPosition = opponent.x;

    rope = new Rope(
        characterY + (characterHeight / 2.5) // ficará um pouco acima do centro dos personagens
    );

    //                             v offset pra deixar o texto inicialmente um pouco abaixo
    countY = (displayHeight / 3) - 40;
}

// executará todo frame
function draw() {
    const amplitude = 0.5;
    const horizontal_oscillation = cos(angle) * amplitude;
    const vertical_oscillation = sin(angle) * amplitude;

    background(0, 170, 255);

    scenary.draw();
    player.draw();
    opponent.draw();
    rope.draw();

    if(currentEvent !== EVENTS.COUNTDOWN) {
        pullingSystem.drawContainer();
        scoringSystem.drawScore();
    }

    if(scored) {
        scoringSystem.drawNewPoint();
    }

    switch(currentEvent) {
        case EVENTS.COUNTDOWN: {
            const eventDuration = frameCount - lastEventFrame;
            let message = count;

            if(eventDuration % 60 === 0) { // a cada segundo (60 frames correspondem à 1 segundo)
                count--;
                countTransparency = 0;
                //                             v offset pra deixar o texto inicialmente um pouco abaixo
                countY = (displayHeight / 3) - 40;
            }

            if(count < 0) returnToDefaultEvent();
            if(count === 0) message = "PUXE!";

            // escurece a tela
            fill(0, 0, 0, 100);
            rect(0, 0, displayWidth, displayHeight);

            // desenha a contagem regressiva
            countY = lerp(countY, displayHeight / 3, 0.05);
            countTransparency = lerp(countTransparency, 500, 0.05);

            textSize(128);
            textAlign(CENTER);
            fill(255, 255, 255, countTransparency); // branco
            text(message, displayWidth / 2, countY);
        } break;
        case EVENTS.NONE: {
            pullingSystem.drawContained();
            pullingSystem.movePointer();

            if(pullingSystem.isPointerOutOfBounds()) {
                lastEventFrame = frameCount;
                eventTarget = {puller: opponent, pulled: player};
                lastCharacterPosition = opponent.x;
                currentEvent = EVENTS.PULL;
                pullingSystem.lastWasFail = true;
            }

            player.x += horizontal_oscillation;
            rope.y -= vertical_oscillation / 2;
            opponent.x += horizontal_oscillation;

            angle += 0.05;
        } break;
        case EVENTS.PULL: {
            const eventDuration = frameCount - lastEventFrame;
            const eventEnd = 45;

            // no início do evento
            if(eventDuration <= 5) {
                eventTarget.puller.x += (eventTarget.puller == player) ? force : -force;
            }

            // durante todo o evento

            let forceOnOpponent = force;

            if(round == 0) { // no primeiro round, o oponente será forçado a cair
                const velocityNeeded = displayWidth / eventEnd; // velocidade necessária pra atingir o buraco na duração do evento
                forceOnOpponent *= velocityNeeded / (force * 2);
            } else if(round <= 20) { // a força contra o oponente diminuirá meio a cada round, até chegar no round 22
                forceOnOpponent = (force * 2) - (round / 10);
            }

            eventTarget.pulled.x += (eventTarget.puller == player) ?
                                        forceOnOpponent :
                                        -(force / 2); // se o puxado for o jogador, ele sofrerá apenas metade da força
            force -= 0.1;

            if(eventDuration > 5) {
                eventTarget.puller.x = lerp(eventTarget.puller.x, lastCharacterPosition, 0.15);
                const outerHoleRadius = scenary.innerHoleWidth / 2;
                const holeEdge = (eventTarget.puller == player) ?
                                    (scenary.holeX - (outerHoleRadius + eventTarget.pulled.width / 2)) :
                                    (scenary.holeX + (outerHoleRadius - eventTarget.pulled.width / 2));

                if((eventTarget.puller === player && eventTarget.pulled.x >= holeEdge)
                || (eventTarget.puller === opponent && eventTarget.pulled.x <= holeEdge)) {
                    force = 5;
                    eventTarget = eventTarget.pulled;
                    lastFallenY = eventTarget.y;
                    lastFallenHeight = eventTarget.height;
                    lastFallenForce = (eventTarget == player) ? -force : forceOnOpponent;
                    currentEvent = EVENTS.FELL;
                }
            }

            // no final do evento
            if(eventDuration >= eventEnd) returnToDefaultEvent();
        } break;
        case EVENTS.FELL: {
            eventTarget.x += lastFallenForce;
            eventTarget.y += fall;
            eventTarget.height -= fall;
            fall += 1.5;

            if(eventTarget.height <= 0) {
                if(eventTarget === player) location.reload(); // TODO: tela de morte

                fall = 0;
                eventTarget.x = -eventTarget.width; // fora da tela
                eventTarget.y = lastFallenY;
                eventTarget.height = lastFallenHeight;

                lastEventFrame = frameCount;
                currentEvent = EVENTS.REAPEARANCE;

                lastScoreFrame = frameCount;
                scored = true;
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
                player.x = Math.floor(lerp(player.x, lastCharacterPosition, 0.1));
            }

            // no final do evento
            if(eventDuration >= 40) {
                round++;
                pullingSystem.pointerVelocity += 0.1;
                returnToDefaultEvent();
            }
        } break;
        default: /* unreachable */ break;
    }
}

// executará toda vez que o usuário apertar alguma tecla
function keyPressed() {
    if(keyCode === 32 && currentEvent === EVENTS.NONE) { // ao pressionar a tecla «espaço»
        lastEventFrame = frameCount;

        if(pullingSystem.isPointerInBounds()) {
            eventTarget = {puller: player, pulled: opponent};
            lastCharacterPosition = player.x;
            pullingSystem.lastWasHit = true;
        } else {
            eventTarget = {puller: opponent, pulled: player};
            lastCharacterPosition = opponent.x;
            pullingSystem.lastWasFail = true;
        }

        currentEvent = EVENTS.PULL;
    }
}
