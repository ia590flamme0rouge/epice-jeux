class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.color = '#3498db'; /* Default blue for player */
        this.speed = 4;
        this.health = 100;
        this.maxHealth = 100;
        this.angle = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#2980b9'; // darker border
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();

        // Gun / Direction Indicator
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(this.radius + 15, -6);
        ctx.lineTo(this.radius + 15, 6);
        ctx.lineTo(0, 6);
        ctx.fillStyle = '#7f8c8d';
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }

    update(movement, canvasWidth, canvasHeight) {
        this.x += movement.x * this.speed;
        this.y += movement.y * this.speed;

        // Keep inside canvas constraints
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
    }
}

class Bullet {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.radius = 5;
        this.color = '#f1c40f'; // Yellow bullet
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Give it a glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        ctx.closePath();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Zombie {
    constructor(x, y, speedMult = 1, healthBase = 100) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.speed = (Math.random() * 1.5 + 0.5) * speedMult;
        this.health = healthBase;
        this.maxHealth = healthBase;
        this.color = '#2ecc71'; // Green zombie
        this.angle = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arms reaching out
        ctx.fillStyle = '#229954';
        ctx.fillRect(this.radius - 5, -15, 15, 8);
        ctx.fillRect(this.radius - 5, 7, 15, 8);

        ctx.restore();
    }

    update(playerX, playerY) {
        this.angle = Math.atan2(playerY - this.y, playerX - this.x);
        const velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };
        this.x += velocity.x;
        this.y += velocity.y;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3;
        this.color = color;
        const speed = Math.random() * 4 + 1;
        const angle = Math.random() * Math.PI * 2;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.alpha = 1;
        this.friction = 0.96;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02; // Fade out
    }
}
