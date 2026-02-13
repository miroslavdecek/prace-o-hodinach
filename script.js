const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Settings
canvas.width = 800;
canvas.height = 600;

// Physics constants
const GRAVITY = 0.5;
const FRICTION = 0.8; 

// Input handling
const keys = {
    w: false, a: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Classes
class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.w = 30; // width
        this.h = 30; // height
        this.color = color;
        this.velX = 0;
        this.velY = 0;
        this.speed = 5;
        this.jumpStrength = 12;
        this.grounded = false;
        this.controls = controls; // Object {up, left, right}
        this.score = 0;
    }

    update() {
        // Movement Logic
        if (keys[this.controls.left]) {
            if (this.velX > -this.speed) this.velX--;
        }
        if (keys[this.controls.right]) {
            if (this.velX < this.speed) this.velX++;
        }
        if (keys[this.controls.up] && this.grounded) {
            this.velY = -this.jumpStrength;
            this.grounded = false;
        }

        // Apply Physics
        this.velX *= FRICTION;
        this.velY += GRAVITY;

        this.x += this.velX;
        this.y += this.velY;

        // Ground Collision (Map boundaries)
        this.grounded = false;

        // Platform Collision detection
        platforms.forEach(platform => {
            const dir = colCheck(this, platform);
            if (dir === "b") { // Bottom of player touches top of platform
                this.grounded = true;
            }
        });

        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
        if (this.y + this.h > canvas.height) { // Floor failsafe
            this.y = canvas.height - this.h;
            this.grounded = true;
            this.velY = 0;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Draw Outline
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
}

class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw() {
        ctx.fillStyle = "#654321"; // Brown
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Grass top
        ctx.fillStyle = "#32CD32"; // Lime Green
        ctx.fillRect(this.x, this.y, this.w, 10);
    }
}

class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 40;
    }
    
    draw() {
        ctx.fillStyle = "#FFD700"; // Gold
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText("GOAL", this.x + 5, this.y + 25);
    }
}

// Utility: Collision Detection (AABB)
function colCheck(shapeA, shapeB) {
    // Get the vectors to check against
    const vX = (shapeA.x + (shapeA.w / 2)) - (shapeB.x + (shapeB.w / 2));
    const vY = (shapeA.y + (shapeA.h / 2)) - (shapeB.y + (shapeB.h / 2));
    
    // Half widths and half heights
    const hWidths = (shapeA.w / 2) + (shapeB.w / 2);
    const hHeights = (shapeA.h / 2) + (shapeB.h / 2);
    
    let colDir = null;

    // Check if the x and y vector are less than the half width or half height
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
        // Figures out on which side we are colliding (top, bottom, left, or right)
        const oX = hWidths - Math.abs(vX);
        const oY = hHeights - Math.abs(vY);

        if (oX >= oY) {
            if (vY > 0) {
                colDir = "t"; // Player is below (hitting head)
                shapeA.y += oY;
                shapeA.velY = 0;
            } else {
                colDir = "b"; // Player is above (standing on)
                shapeA.y -= oY;
                shapeA.velY = 0;
            }
        } else {
            if (vX > 0) {
                colDir = "l"; // Player is on right
                shapeA.x += oX;
                shapeA.velX = 0;
            } else {
                colDir = "r"; // Player is on left
                shapeA.x -= oX;
                shapeA.velX = 0;
            }
        }
    }
    return colDir;
}

// --- Initialization ---

// Create Platforms (Map Design)
const platforms = [];
platforms.push(new Platform(0, 550, 800, 50)); // Ground
platforms.push(new Platform(200, 450, 100, 20));
platforms.push(new Platform(400, 350, 100, 20));
platforms.push(new Platform(100, 250, 100, 20));
platforms.push(new Platform(600, 250, 100, 20));
platforms.push(new Platform(350, 150, 100, 20)); // High platform

// Create Goal
const goal = new Goal(380, 110);

// Create Players
const player1 = new Player(50, 500, "#ff4d4d", {up: "w", left: "a", right: "d"});
const player2 = new Player(720, 500, "#4d4dff", {up: "ArrowUp", left: "ArrowLeft", right: "ArrowRight"});

function resetGame(winnerName) {
    alert(winnerName + " vyhrál!");
    player1.x = 50; player1.y = 500; player1.velX = 0; player1.velY = 0;
    player2.x = 720; player2.y = 500; player2.velX = 0; player2.velY = 0;
}

// Game Loop
function update() {
    // 1. Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw & Update Platforms
    platforms.forEach(p => p.draw());

    // 3. Draw & Check Goal
    goal.draw();
    
    // Check Goal Collision
    if (colCheck(player1, goal)) resetGame("Hráč 1");
    if (colCheck(player2, goal)) resetGame("Hráč 2");

    // 4. Update & Draw Players
    player1.update();
    player1.draw();
    
    player2.update();
    player2.draw();

    requestAnimationFrame(update);
}

// Start the game
update();
