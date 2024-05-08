/*
 * - Variáveis Globais -
 * o prefixo «g» é usado para denotar que a variável possui contexto global
 */

let gPullingSystem,
    gScoringSystem,
    gScenary,
    gPlayer,
    gRope,
    gOpponent;
let gDefaultOpponentPosition;
let gDefaultRopePosition;
let gOpponentSpritesheets;

const EVENTS = {
    MENU: Symbol("menu"),
    COUNTDOWN: Symbol("countdown"),
    PULL: Symbol("pull"),
    FELL: Symbol("fell"),
    REAPEARANCE: Symbol("reapearance"),
    DEATH: Symbol("death"),
    NONE: Symbol("none")
};

let gCurrentEvent = EVENTS.MENU,
    gEventTarget,
    gLastEventFrame = 0;

let gLastCharacterPosition,
    gLastFallenY,
    gLastFallenWidth,
    gLastFallenHeight,
    gLastFallenForce;

let gAngle = 0,
    gForce = 5,
    gFall = 0;

let gRound = 0;

let gTextX;

let count = 3,
    countY,
    countTransparency = 0;

let menuFontSize = 64,
    menuTitleGrowthDirection = 1;

let deathScreenX,
    deathScreenY,
    deathScreenWidth = 20,
    deathScreenHeight = 20,
    deathScreenTitleSize = 12,
    deathScreenTitleY,
    deathScreenRestartSize = 12,
    deathScreenRestartY,
    deathScreenRestartDirection = 1;

// - Estruturas -

class PullingSystem {
    constructor() {
        this.containerBorderSize = 5;
        this.containerWidth = 50;
        this.containerHeight = displayHeight / 2.5;
        this.containerX = (displayWidth - this.containerWidth) - this.containerBorderSize;
        this.containerY = (displayHeight / 1.8) - this.containerHeight;

        this.targetSprite = loadImage("assets/alvo.png");
        this.targetY;
        this.targetHeight = 20;
        this.targetTop;
        this.targetBottom;

        this.pointerY;
        this.pointerHeight = 5;
        this.pointerVelocity = 1;
        this.pointerDirection = 1; // 1 = baixo, -1 = cima

        this.containerSprite = loadImage("assets/container.png");
        this.containedWidth = 45 - (this.containerBorderSize * 2); // multiplicado por 2 pra descontar as bordas de ambos os lados
        this.containedX = this.containerX + this.containerBorderSize + this.containedWidth / 11;
        this.containerBottom = (this.containerY + this.containerHeight) - this.containerBorderSize;
        this.containerTop = this.containerY + this.containerBorderSize;

        this.containedAnimatedX = this.containedX;
        this.containedAnimateWidth = this.containedWidth;
        this.containedTransparency = 500;

        this.targetAnimatedHeight = this.targetHeight;
        this.pointerAnimatedHeight = this.pointerHeight;

        this.lastWasHit = false;
        this.lastWasFail = false;
        this.failSprite = loadImage("assets/falha.png");

    }

    randomizeContained() {
        const minTargetTop = this.containerTop + this.containerHeight / 5;
        const maxTargetBottom = (this.containerBottom - this.targetHeight) - this.containerHeight / 5;
        this.targetY = randomRange(minTargetTop, maxTargetBottom);

        this.targetTop = this.targetY - this.pointerHeight;
        this.targetBottom = this.targetY + this.targetHeight;

        this.pointerDirection = -this.pointerDirection;
        this.pointerY = (this.pointerDirection === 1) ? this.containerTop : this.containerBottom;
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

    drawContainedRemains() {
        this.containedTransparency = Math.floor(lerp(this.containedTransparency, 0, 0.1));

        this.containedAnimatedX -= 0.5;
        this.containedAnimateWidth++;

        this.targetY -= 0.5;
        this.targetAnimatedHeight++;

        if(this.lastWasFail) {
            // desenha uma imagem exprimindo falha
            const failHeight = this.containedAnimateWidth; // a imagem é um quadrado, logo a altura é a mesma que a largura
            tint(255, this.containedTransparency);
            image(this.failSprite, this.containedAnimatedX, this.targetY, this.containedAnimateWidth, failHeight);
            noTint();

            // desenha o ponteiro
            this.pointerAnimatedHeight++;
            fill(255, 255, 255, this.containedTransparency);
            rect(this.containedAnimatedX, this.pointerY, this.containedAnimateWidth, this.pointerHeight);
        } else {
            fill(34, 131, 0, this.containedTransparency); // verde escuro
            rect(this.containedAnimatedX, this.targetY, this.containedAnimateWidth, this.targetAnimatedHeight);
        }

        if(this.containedTransparency === 0) {
            this.resetAnimation();
        }
    }

    drawContainer() {
        image(this.containerSprite, this.containerX, this.containerY, this.containerWidth, this.containerHeight);
        if(this.lastWasHit || this.lastWasFail) {
            this.drawContainedRemains();
        }
    }

    drawContained() {
        // desenha o alvo
        image(this.targetSprite, this.containedX, this.targetY, this.containedWidth, this.targetHeight);

        // desenha o pointeiro
        strokeWeight(2);
        stroke(127); // praticamente um cinza claro
        fill(255, 255, 255);
        rect(this.containedX, this.pointerY, this.containedWidth, this.pointerHeight);
        noStroke();
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
        this.record = localStorage.getItem("record") || 0;

        this.newPointSize = 0;
        this.newPointY = displayHeight / 2;

        this.scored = false;
        this.lastScoreFrame = 0;
    }

    drawScore() {
        fill(255, 255, 255);
        textAlign(CENTER);

        textSize(16);
        text("Recorde: " + this.record, gTextX, 85);

        textSize(64);
        text(this.score, gTextX, 60);
    }

    drawNewPoint() {
        const scoreDuration = frameCount - this.lastScoreFrame;

        fill(255, 255, 255);
        textAlign(CENTER);
        textSize(this.newPointSize);
        text("+1", gTextX, this.newPointY);

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
            this.scored = false;
        }
    }
}

class Scenary {
    constructor() {
        this.skySprite = loadImage("assets/ceu.png");
        this.skyX = 0;
        this.skyY = 0;
        this.skyWidth = displayWidth;

        this.backgroundSprite = loadImage("assets/background.png");
        this.backgroundX = 0;
        this.backgroundWidth = displayWidth;
        this.backgroundHeight = displayHeight / 1.4;

        this.skyHeight = this.backgroundHeight / 5.8;

        this.terrainSprite = loadImage("assets/chao.png");
        this.terrainHeight = displayHeight / 2.5;
        this.terrainX = 0;
        this.terrainY = displayHeight - this.terrainHeight;
        this.terrainWidth = displayWidth;

        this.backgroundY = -(this.terrainHeight / 6);

        this.holeSprite = loadImage("assets/buraco.png");
        this.holeX = displayWidth / 4;
        this.holeY = this.terrainY + (this.terrainHeight / 3);
        this.holeWidth = displayWidth / 2.1;
        this.holeHeight = displayHeight / 5.8;
    }

    draw() {
        image(this.backgroundSprite, 0, this.backgroundY, this.backgroundWidth, this.backgroundHeight);
        image(this.skySprite, this.skyX, this.skyY, this.skyWidth, this.skyHeight);
        image(this.terrainSprite, this.terrainX, this.terrainY, this.terrainWidth, this.terrainHeight);
        image(this.holeSprite, this.holeX, this.holeY, this.holeWidth, this.holeHeight);
    }
}

class Character {
    constructor(x, y, width, height, color, idleSprite, pullingSprite, pulledSprite) {
        this.x = x - (width / 3);
        this.y = y - (height / 6);
        this.width = width;
        this.height = height;
        this.color = color;

        this.idleSprite = idleSprite;
        this.pullingSprite = pullingSprite;
        this.pulledSprite = pulledSprite;
        this.sprite = idleSprite;
    }

    draw() {
        // criará uma sombra embaixo do personagem
        fill(0, 0, 0, 20);
        ellipse(this.x + (this.width / 2.2), this.y + this.height - 5, this.width, 40);
        image(this.sprite, this.x, this.y, this.width, this.height);
    }
}

class Rope {
    constructor(y) {
        const offset = displayWidth / 2 // pra suas extremidades não vazarem
        this.ropeSprite = loadImage("assets/corda.png");
        this.x = -offset / 2;
        this.y = y - 85;
        this.width = displayWidth + offset
        this.height = 150;
    }

    draw() {
        image(this.ropeSprite, this.x, this.y, this.width, this.height);
    }
}

// - Funções Auxiliares -

function randomizeSprite(character) {
    const selectedSpritesheet = gOpponentSpritesheets[
                                    Math.floor(Math.random() * gOpponentSpritesheets.length) // escolhe um grupo de sprites aleatório
                                ];

    character.idleSprite = selectedSpritesheet.idle;
    character.pullingSprite = selectedSpritesheet.pulling;
    character.pulledSprite = selectedSpritesheet.pulled;

    character.sprite = character.pulledSprite;
}

function returnToDefaultEvent() {
    gCurrentEvent = EVENTS.NONE;
    gPullingSystem.randomizeContained();
    gFall = 0;
    gForce = 5;
}

function randomRange(mininum, maximum) {
    return Math.random() * (maximum - mininum) + mininum;
}

// - Principais Funções -

// executará apenas uma vez, no início do jogo
function setup() {
    createCanvas(displayWidth, displayHeight);
    noSmooth();

    gScoringSystem = new ScoringSystem();
    gPullingSystem = new PullingSystem();

    gScenary = new Scenary();

    const characterWidth = 160;
    const characterHeight = 240;
    const characterY = (gScenary.terrainY * 1.35) - characterHeight;

    gPlayer = new Character(
        displayWidth - (displayWidth / 8), // canto direito
        characterY,
        characterWidth,
        characterHeight,
        color(20, 25, 104),
        loadImage("assets/unicornioIdle.png"),
        loadImage("assets/unicornioPulling.png"),
        loadImage("assets/unicornioPulled.png")
    );

    gOpponent = new Character(
        displayWidth / 8, // canto esquerdo
        characterY,
        characterWidth,
        characterHeight,
        color(122, 18, 59),
        loadImage("assets/cobraIdle.png"),
        loadImage("assets/cobraPulling.png"),
        loadImage("assets/cobraPulled.png")
    );
    gOpponentSpritesheets = [
        { // zebra
            idle: loadImage("assets/zebraIdle.png"),
            pulling: loadImage("assets/zebraPulling.png"),
            pulled: loadImage("assets/zebraPulled.png")
        },
        { // ovni
            idle: loadImage("assets/ovniIdle.png"),
            pulling: loadImage("assets/ovniPulling.png"),
            pulled: loadImage("assets/ovniPulled.png")
        }
    ];
    gDefaultOpponentPosition = gOpponent.x;

    gRope = new Rope(
        characterY + (characterHeight / 2.5) // ficará um pouco acima do centro dos personagens
    );
    gDefaultRopePosition = gRope.x;

    gTextX = displayWidth / 2;

    //                             v offset pra deixar o texto inicialmente um pouco abaixo
    countY = (displayHeight / 3) - 40;

    deathScreenX = gScenary.holeX + (gScenary.holeWidth / 2);
    deathScreenY = gScenary.holeY;
    deathScreenTitleY = deathScreenY;
    deathScreenRestartY = deathScreenY;
}

// executará todo frame
function draw() {
    const amplitude = 0.5;
    const horizontalOscillation = cos(gAngle) * amplitude;
    const verticalOscillation = sin(gAngle) * (amplitude / 4.4);

    gScenary.draw();
    gPlayer.draw();
    gOpponent.draw();
    gRope.draw();

    if(gCurrentEvent !== EVENTS.COUNTDOWN && gCurrentEvent !== EVENTS.MENU) {
        gPullingSystem.drawContainer();
        gScoringSystem.drawScore();
    }

    if(gScoringSystem.scored) {
        gScoringSystem.drawNewPoint();
    }

    switch(gCurrentEvent) {
        case EVENTS.MENU: {
            // escurece a tela
            fill(0, 0, 0, 200);
            rect(0, 0, displayWidth, displayHeight);

            fill(255, 255, 255);
            textAlign(CENTER);

            textSize(16);
            text("Recorde:\n" + gScoringSystem.record, gTextX, 20);

            textSize(menuFontSize);
            text("Aperte «espaço» para\nPUXAR", gTextX, countY);

            menuFontSize += 0.05 * menuTitleGrowthDirection;
            if(menuFontSize > 64 || menuFontSize < 58) {
                menuTitleGrowthDirection *= -1;
            }
        } break;
        case EVENTS.COUNTDOWN: {
            const eventDuration = frameCount - gLastEventFrame;
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
            fill(255, 255, 255, countTransparency);
            text(message, displayWidth / 2, countY);
        } break;
        case EVENTS.NONE: {
            gPullingSystem.drawContained();
            gPullingSystem.movePointer();

            if(gPullingSystem.isPointerOutOfBounds()) {
                gLastEventFrame = frameCount;
                gEventTarget = {puller: gOpponent, pulled: gPlayer};
                gLastCharacterPosition = gOpponent.x;
                gCurrentEvent = EVENTS.PULL;
                gPullingSystem.lastWasFail = true;
            }

            gPlayer.x += horizontalOscillation;
            gRope.x += horizontalOscillation;
            gRope.y -= verticalOscillation;
            gOpponent.x += horizontalOscillation;

            const oscillationInterval = amplitude - 0.2;
            if(horizontalOscillation < -oscillationInterval) {
                gPlayer.sprite = gPlayer.pulledSprite;
                gOpponent.sprite = gOpponent.pullingSprite
            } else if(horizontalOscillation > oscillationInterval) {
                gPlayer.sprite = gPlayer.pullingSprite;
                gOpponent.sprite = gOpponent.pulledSprite;
            } else {
                gPlayer.sprite = gPlayer.idleSprite;
                gOpponent.sprite = gOpponent.idleSprite;
            }

            gAngle += 0.05;
        } break;
        case EVENTS.PULL: {
            const eventDuration = frameCount - gLastEventFrame;
            const eventEnd = 45;

            const appliedForce = (gEventTarget.puller == gPlayer) ? gForce : -gForce;
            let forceOnOpponent = gForce;

            // no início do evento
            if(eventDuration <= 5) {
                gEventTarget.puller.sprite = gEventTarget.puller.pullingSprite;
                gEventTarget.puller.x += appliedForce;
                gRope.x += appliedForce;
            }

            // durante todo o evento

            if(gRound == 0) { // no primeiro round, o oponente será forçado a cair
                const velocityNeeded = displayWidth / eventEnd; // velocidade necessária pra atingir o buraco na duração do evento
                forceOnOpponent *= velocityNeeded / (gForce * 2);
            } else if(gRound <= 20) { // a força contra o oponente diminuirá meio a cada round, até chegar no round 22
                forceOnOpponent = (gForce * 2) - (gRound / 10);
            }

            gEventTarget.pulled.sprite = gEventTarget.pulled.pulledSprite;
            gEventTarget.pulled.x += (gEventTarget.puller == gPlayer) ?
                                        forceOnOpponent :
                                        appliedForce / 2; // se o puxado for o jogador, ele sofrerá apenas metade da força
            gForce -= 0.1;

            if(eventDuration > 5) {
                if(eventDuration > 15) gEventTarget.puller.sprite = gEventTarget.puller.idleSprite

                gRope.x = lerp(gRope.x, gDefaultRopePosition, 0.15);
                gEventTarget.puller.x = lerp(gEventTarget.puller.x, gLastCharacterPosition, 0.15);

                const holeEdge = (gEventTarget.puller == gPlayer) ?
                                    gScenary.holeWidth - (gEventTarget.pulled.width * 1.5) :
                                    //                                               v pro player não ficar grudado na borda
                                    (gScenary.holeWidth + gEventTarget.pulled.width) - 5;

                if((gEventTarget.puller === gPlayer && gEventTarget.pulled.x >= holeEdge)
                || (gEventTarget.puller === gOpponent && gEventTarget.pulled.x <= holeEdge)) {
                    gEventTarget = gEventTarget.pulled;

                    gLastFallenY = gEventTarget.y;
                    gLastFallenWidth = gEventTarget.width
                    gLastFallenHeight = gEventTarget.height;
                    //                                                                            v adicional pra compensar se a força for muito baixa
                    gLastFallenForce = (gEventTarget == gPlayer) ? appliedForce : forceOnOpponent + 2

                    gForce = 5;
                    gCurrentEvent = EVENTS.FELL;
                }
            }

            // no final do evento
            if(eventDuration >= eventEnd) returnToDefaultEvent();
        } break;
        case EVENTS.FELL: {
            gEventTarget.x += gLastFallenForce;
            gEventTarget.y += gFall * 1.3;
            gEventTarget.width -= 5;
            gEventTarget.height -= gFall;
            gFall += 1.5;

            if(gEventTarget.height <= 0) {
                gLastEventFrame = frameCount;

                if(gEventTarget === gPlayer) {
                    const record = localStorage.getItem("record");
                    if(gScoringSystem.score > record) localStorage.setItem("record", gScoringSystem.score);

                    gPlayer.x = -gEventTarget.width; // fora da tela
                    gCurrentEvent = EVENTS.DEATH;
                } else {
                    gFall = 0;
                    gEventTarget.x = -gEventTarget.width; // fora da tela
                    gEventTarget.y = gLastFallenY;
                    gEventTarget.width = gLastFallenWidth;
                    gEventTarget.height = gLastFallenHeight;

                    randomizeSprite(gOpponent);
                    gCurrentEvent = EVENTS.REAPEARANCE;

                    gScoringSystem.lastScoreFrame = frameCount;
                    gScoringSystem.scored = true;
                }
            }
        } break;
        case EVENTS.REAPEARANCE: {
            const eventDuration = frameCount - gLastEventFrame;

            // no início do evento
            if(eventDuration <= 10) {
                gPlayer.sprite = gPlayer.pullingSprite
                gPlayer.x += gForce;
                gRope.x += gForce;
                gForce -= 0.1;
            }

            // durante todo o evento
            if(eventDuration > 5) {
                gOpponent.x = Math.floor(lerp(gOpponent.x, gDefaultOpponentPosition, 0.1));
            }

            if(eventDuration > 10) {
                gPlayer.sprite = gPlayer.pulledSprite
                gPlayer.x = Math.floor(lerp(gPlayer.x, gLastCharacterPosition, 0.1));
                gRope.x = Math.floor(lerp(gRope.x, gDefaultRopePosition, 0.1));
            }

            // no final do evento
            if(eventDuration >= 40) {
                gRound++;
                gPullingSystem.pointerVelocity += 0.1;
                returnToDefaultEvent();
            }
        } break;
        case EVENTS.DEATH: {
            fill(0, 0, 0, 200);

            if(Math.ceil(deathScreenWidth) != displayWidth) {
                deathScreenWidth = lerp(deathScreenWidth, displayWidth, 0.1);
                deathScreenX = lerp(deathScreenX, 0, 0.1);
            }

            if(Math.ceil(deathScreenHeight) != displayHeight) {
                deathScreenHeight = lerp(deathScreenHeight, displayHeight, 0.1);
                deathScreenY = lerp(deathScreenY, 0, 0.1);
            }

            rect(deathScreenX, deathScreenY, deathScreenWidth, deathScreenHeight);

            if(Math.floor(deathScreenTitleY) != countY) {
                deathScreenTitleSize = lerp(deathScreenTitleSize, 64, 0.1);
                deathScreenTitleY = lerp(deathScreenTitleY, countY, 0.1);
            }

            fill(255, 255, 255);
            textAlign(CENTER);
            textSize(deathScreenTitleSize);
            text("Você foi o PUXADO!", gTextX, deathScreenTitleY);

            if(Math.floor(deathScreenRestartY) != (countY + 80)) {
                deathScreenRestartSize = lerp(deathScreenRestartSize, 32, 0.1);
                deathScreenRestartY = lerp(deathScreenRestartY, deathScreenTitleY + 80, 0.1);
            }

            deathScreenRestartSize += 0.05 * deathScreenRestartDirection;
            if(deathScreenRestartSize > 32 || deathScreenRestartSize < 30) {
                deathScreenRestartDirection *= -1;
            }

            textSize(deathScreenRestartSize)
            text("Aperte «espaço» para\nREENCARNAR", gTextX, deathScreenRestartY);
        } break;
        default: /* unreachable */ break;
    }
}

// executará toda vez que o usuário apertar alguma tecla
function keyPressed() {
    if(keyCode === 32) { // ao pressionar a tecla «espaço»
        switch(gCurrentEvent) {
            case EVENTS.NONE: {
                gLastEventFrame = frameCount;

                if(gPullingSystem.isPointerInBounds()) {
                    gEventTarget = {puller: gPlayer, pulled: gOpponent};
                    gLastCharacterPosition = gPlayer.x;
                    gPullingSystem.lastWasHit = true;
                } else {
                    gEventTarget = {puller: gOpponent, pulled: gPlayer};
                    gLastCharacterPosition = gOpponent.x;
                    gPullingSystem.lastWasFail = true;
                }

                gCurrentEvent = EVENTS.PULL;
            } break;
            case EVENTS.MENU: {
                gLastEventFrame = frameCount;
                gCurrentEvent = EVENTS.COUNTDOWN;
            } break;
            case EVENTS.DEATH: location.reload(); break; // recarega a página
            default: /* pass */ break;
        }
    }
}
