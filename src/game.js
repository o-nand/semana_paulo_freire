const radius = 10;
let x, y;
let x_vel = 5, y_vel = 5;

function setup() {
    createCanvas(displayWidth, displayHeight);
    noSmooth();

    x = (displayWidth / 2) - radius;
    y = (displayHeight / 2) - radius
}

function draw() {
    background(255, 255, 255);
    circle(x, y, radius); 
    
    if(x >= displayWidth - 10 || x <= 0) {
        x_vel = -x_vel;
    }

    if(y >= displayHeight - 10 || y <= 0) {
        y_vel = -y_vel;
    }

    x += x_vel;
    y += y_vel;
}
