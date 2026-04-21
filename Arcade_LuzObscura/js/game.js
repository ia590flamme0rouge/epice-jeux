const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let bullets = [];
let zombies = [];
let particles = [];

// Game state
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let wave = 1;
let frames = 0;
let lastFireTime = 0;
const fireRate = 100; // ms

// UI Elements
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const waveDisplay = document.getElementById('wave-display');
const healthBarFill = document.getElementById('health-bar-fill');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
setupInputEventListeners(canvas);

// Initialize a new game
function initGame() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    bullets = [];
    zombies = [];
    particles = [];
    score = 0;
    wave = 1;
    frames = 0;
    
    updateHUD();
    
    gameState = 'PLAYING';
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    hud.classList.remove('hidden');
    
    // Attempt init mobile
    initMobileControls();

    // Spawn first zombie
    spawnZombie();
}

// Logic to spawn zombies on boundaries
function MathRandomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnZombie() {
    let x, y;
    // Spawn outside of screen randomly
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -30 : canvas.width + 30;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -30 : canvas.height + 30;
    }

    // Health and speed scale slightly with wave
    const speedMult = 1 + (wave * 0.1);
    const healthBase = 50 + (wave * 20);
    zombies.push(new Zombie(x, y, speedMult, healthBase));
}

function createExplosion(x, y, color, amount) {
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateHUD() {
    scoreDisplay.innerText = `Score: ${score}`;
    waveDisplay.innerText = `Vague: ${wave}`;
    const healthPercent = Math.max(0, player.health / player.maxHealth * 100);
    healthBarFill.style.width = `${healthPercent}%`;
}

// Collision helper
function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function update() {
    if (gameState !== 'PLAYING') return;
    frames++;

    // Player logical update
    const move = getPlayerMovement();
    player.update(move, canvas.width, canvas.height);
    player.angle = getPlayerAimDirection(player.x, player.y);

    // Shooting
    const now = Date.now();
    if (isShooting() && now - lastFireTime > fireRate) {
        const vel = {
            x: Math.cos(player.angle) * 12, // Bullet speed
            y: Math.sin(player.angle) * 12
        };
        // Shoot from gun tip
        const startX = player.x + Math.cos(player.angle) * (player.radius + 15);
        const startY = player.y + Math.sin(player.angle) * (player.radius + 15);
        bullets.push(new Bullet(startX, startY, vel));
        
        // Muzzle flash particle
        createExplosion(startX, startY, '#f39c12', 3);
        
        lastFireTime = now;
    }

    // Spawn logic (waves get harder)
    let spawnRate = Math.max(20, 100 - (wave * 5));
    if (frames % spawnRate === 0) {
        spawnZombie();
    }
    
    // Optional Wave evolution
    if (frames % 600 === 0) { // Every ~10 seconds
        wave++;
        updateHUD();
    }

    // Update Particles
    particles.forEach((p, index) => {
        p.update();
        if (p.alpha <= 0 || p.radius <= 0) particles.splice(index, 1);
    });

    // Update Bullets & Screen bounds check
    bullets.forEach((bullet, index) => {
        bullet.update();
        if (
            bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height
        ) {
            bullets.splice(index, 1);
        }
    });

    // Update Zombies and check collisions
    zombies.forEach((zombie, zIndex) => {
        zombie.update(player.x, player.y);

        // Collision: Zombie hits Player
        const distToPlayer = dist(player.x, player.y, zombie.x, zombie.y);
        if (distToPlayer - zombie.radius - player.radius < 1) {
            player.health -= 0.5; // Drain health continuously while touching
            createExplosion(player.x, player.y, '#e74c3c', 1); // blood
            updateHUD();

            if (player.health <= 0) {
                gameOver();
            }
        }

        // Collision: Bullet hits Zombie
        bullets.forEach((bullet, bIndex) => {
            const distBulletToZombie = dist(bullet.x, bullet.y, zombie.x, zombie.y);
            if (distBulletToZombie - zombie.radius - bullet.radius < 1) {
                // Remove bullet
                bullets.splice(bIndex, 1);
                
                // Damage zombie
                zombie.health -= 25;
                createExplosion(bullet.x, bullet.y, zombie.color, 5);

                if (zombie.health <= 0) {
                    // Kill zombie
                    score += 10;
                    updateHUD();
                    zombies.splice(zIndex, 1);
                    createExplosion(zombie.x, zombie.y, zombie.color, 15);
                }
            }
        });
    });
}

function draw() {
    // Clear screen
    ctx.fillStyle = 'rgba(5, 5, 5, 0.4)'; // Creating trails effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        particles.forEach(p => p.draw(ctx));
        bullets.forEach(b => b.draw(ctx));
        zombies.forEach(z => z.draw(ctx));
        player.draw(ctx);
        
        // Render optional cursor natively
        if (!joysticks.aim.active) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fill();
            ctx.closePath();
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
    gameOverMenu.classList.remove('hidden');
    finalScore.innerText = score;
    
    // Cleanup mobile controls if playing to avoid duplicated instances
    if (moveJoystickMgr) moveJoystickMgr.destroy();
    if (aimJoystickMgr) aimJoystickMgr.destroy();
}

// Bind Buttons
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Start drawing background before game starts
gameLoop();
