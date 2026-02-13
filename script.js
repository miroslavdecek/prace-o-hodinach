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
// --- Initialization ---

// 1. Vytvoření plošin (Symetrická Věž)
const platforms = [];

// --- PŘÍZEMÍ ---
// Základní podlaha (tenčí, aby bylo více místa pro výšku)
platforms.push(new Platform(0, 580, 800, 20)); 

// --- 1. PATRO (Rozjezd po stranách) ---
// Široké plošiny vlevo a vpravo, hráči na ně musí vyskočit z rohu
platforms.push(new Platform(0, 480, 250, 20));   // Levá
platforms.push(new Platform(550, 480, 250, 20)); // Pravá

// --- 2. PATRO (Cesta do středu) ---
// Jedna centrální plošina, kde se hráči poprvé mohou potkat/srazit
platforms.push(new Platform(300, 380, 200, 20));

// --- 3. PATRO (Rozdělení do stran) ---
// Hráči musí z centrální plošiny skočit zpět do krajů na menší ostrůvky
platforms.push(new Platform(100, 280, 150, 20)); // Levý ostrůvek
platforms.push(new Platform(550, 280, 150, 20)); // Pravý ostrůvek

// --- 4. PATRO (Finální výstup) ---
// Vysoko umístěná plošina uprostřed
platforms.push(new Platform(320, 170, 160, 20));

// --- 5. PATRO (Stříška pro cíl) ---
// Úplně nahoře, malá plošinka přímo pro vlajku
platforms.push(new Platform(370, 90, 60, 10)); 


// 2. Vytvoření Cíle
// Cíl je umístěn na úplném vrcholu (5. patro)
const goal = new Goal(380, 50);


// 3. Vytvoření Hráčů (Startují v protilehlých rozích dole)
// Hráč 1 (Červený) - Levý dolní roh
const player1 = new Player(20, 540, "#ff4d4d", {up: "w", left: "a", right: "d"});

// Hráč 2 (Modrý) - Pravý dolní roh
const player2 = new Player(750, 540, "#4d4dff", {up: "ArrowUp", left: "ArrowLeft", right: "ArrowRight"});


// Funkce pro reset hry
function resetGame(winnerName) {
    // Malá pauza, aby si hráč uvědomil výhru, než se to resetuje
    setTimeout(() => {
        alert(winnerName + " vyhrál!");
        
        // Reset pozic do startovních rohů
        player1.x = 20; 
        player1.y = 540; 
        player1.velX = 0; 
        player1.velY = 0;
        
        player2.x = 750; 
        player2.y = 540; 
        player2.velX = 0; 
        player2.velY = 0;
    }, 100);
}
// Start the game
update();
