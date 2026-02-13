const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- HERNÍ NASTAVENÍ ---
canvas.width = 800;
canvas.height = 600;

// Fyzikální konstanty
const GRAVITY = 0.5;
const FRICTION = 0.8; 

// Ovládání (Input)
const keys = {
    w: false, a: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// --- TŘÍDY (Classes) ---

class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.w = 30; // šířka
        this.h = 30; // výška
        this.color = color;
        this.velX = 0;
        this.velY = 0;
        this.speed = 5;
        this.jumpStrength = 12;
        this.grounded = false;
        this.controls = controls; // {up, left, right}
    }

    update() {
        // Pohyb
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

        // Fyzika
        this.velX *= FRICTION;
        this.velY += GRAVITY;

        this.x += this.velX;
        this.y += this.velY;

        this.grounded = false;

        // Kolize s plošinami
        platforms.forEach(platform => {
            const dir = colCheck(this, platform);
            if (dir === "b") { // Stojí na plošině
                this.grounded = true;
            }
        });

        // Hranice obrazovky
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
        
        // Záchranná podlaha (kdyby propadli úplně dolů)
        if (this.y + this.h > canvas.height) { 
            this.y = canvas.height - this.h;
            this.grounded = true;
            this.velY = 0;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
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
        // Hnědý základ
        ctx.fillStyle = "#654321"; 
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Zelený vršek (tráva)
        ctx.fillStyle = "#32CD32"; 
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
        ctx.fillStyle = "#FFD700"; // Zlatá
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "black";
        ctx.font = "bold 12px Arial";
        ctx.fillText("GOAL", this.x + 4, this.y + 25);
    }
}

// --- FUNKCE PRO KOLIZE (AABB) ---
function colCheck(shapeA, shapeB) {
    const vX = (shapeA.x + (shapeA.w / 2)) - (shapeB.x + (shapeB.w / 2));
    const vY = (shapeA.y + (shapeA.h / 2)) - (shapeB.y + (shapeB.h / 2));
    const hWidths = (shapeA.w / 2) + (shapeB.w / 2);
    const hHeights = (shapeA.h / 2) + (shapeB.h / 2);
    let colDir = null;

    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
        const oX = hWidths - Math.abs(vX);
        const oY = hHeights - Math.abs(vY);

        if (oX >= oY) {
            if (vY > 0) {
                colDir = "t"; // Hlava (náraz zespodu)
                shapeA.y += oY;
                shapeA.velY = 0;
            } else {
                colDir = "b"; // Nohy (stojí na plošině)
                shapeA.y -= oY;
                shapeA.velY = 0;
            }
        } else {
            if (vX > 0) {
                colDir = "l"; // Levý bok
                shapeA.x += oX;
                shapeA.velX = 0;
            } else {
                colDir = "r"; // Pravý bok
                shapeA.x -= oX;
                shapeA.velX = 0;
            }
        }
    }
    return colDir;
}

// --- PŘÍPRAVA MAPY A HRÁČŮ ---

const platforms = [];

// 0. Přízemí (Podlaha)
platforms.push(new Platform(0, 580, 800, 20)); 

// 1. Patro - Nástupní plošiny po stranách
platforms.push(new Platform(0, 480, 250, 20));   // Vlevo
platforms.push(new Platform(550, 480, 250, 20)); // Vpravo

// 2. Patro - Společný střed (tady se hráči mohou srazit)
platforms.push(new Platform(300, 380, 200, 20));

// 3. Patro - Zpět do stran (ostrůvky)
platforms.push(new Platform(100, 280, 150, 20)); // Vlevo
platforms.push(new Platform(550, 280, 150, 20)); // Vpravo

// 4. Patro - Předfinální skok (Střed)
platforms.push(new Platform(320, 170, 160, 20));

// 5. Patro - Vršek pro cíl
platforms.push(new Platform(370, 90, 60, 10)); 

// Cíl (Úplně nahoře)
const goal = new Goal(380, 50);

// Hráči (Startují dole v rozích)
// Hráč 1: Červený (WASD), Levý roh
const player1 = new Player(20, 540, "#ff4d4d", {up: "w", left: "a", right: "d"});

// Hráč 2: Modrý (Šipky), Pravý roh
const player2 = new Player(750, 540, "#4d4dff", {up: "ArrowUp", left: "ArrowLeft", right: "ArrowRight"});

function resetGame(winnerName) {
    // Krátká pauza před resetem
    setTimeout(() => {
        alert(winnerName + " vyhrál!");
        
        // Reset pozic
        player1.x = 20; 
        player1.y = 540; 
        player1.velX = 0; player1.velY = 0;
        
        player2.x = 750; 
        player2.y = 540; 
        player2.velX = 0; player2.velY = 0;
    }, 50);
}

// --- HLAVNÍ HERNÍ SMYČKA (Game Loop) ---
function update() {
    // 1. Vymazat plátno
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Vykreslit plošiny
    platforms.forEach(p => p.draw());

    // 3. Vykreslit cíl a kontrola výhry
    goal.draw();
    if (colCheck(player1, goal)) resetGame("Hráč 1");
    if (colCheck(player2, goal)) resetGame("Hráč 2");

    // 4. Aktualizace a vykreslení hráčů
    player1.update();
    player1.draw();
    
    player2.update();
    player2.draw();

    requestAnimationFrame(update);
}

// Spuštění hry
update();
