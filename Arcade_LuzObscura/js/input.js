const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    isDown: false
};

const joysticks = {
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0, active: false }
};

let moveJoystickMgr = null;
let aimJoystickMgr = null;

function setupInputEventListeners(canvas) {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'z' || key === 'arrowup') keys.w = true;
        if (key === 'a' || key === 'q' || key === 'arrowleft') keys.a = true;
        if (key === 's' || key === 'arrowdown') keys.s = true;
        if (key === 'd' || key === 'arrowright') keys.d = true;
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'z' || key === 'arrowup') keys.w = false;
        if (key === 'a' || key === 'q' || key === 'arrowleft') keys.a = false;
        if (key === 's' || key === 'arrowdown') keys.s = false;
        if (key === 'd' || key === 'arrowright') keys.d = false;
    });

    // Mouse Controls
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', () => { mouse.isDown = true; });
    window.addEventListener('mouseup', () => { mouse.isDown = false; });
    
    // Prevent default context menu
    window.addEventListener('contextmenu', e => e.preventDefault());
}

function initMobileControls() {
    // Check if device supports touch
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouch && window.nipplejs) {
        const zone = document.getElementById('joystick-zone');
        zone.style.pointerEvents = 'auto'; // allow input for joysticks
        
        // Split screen: left for move, right for aim
        const halfWidth = window.innerWidth / 2;
        
        moveJoystickMgr = nipplejs.create({
            zone: zone,
            mode: 'static',
            position: { left: '15%', bottom: '20%' },
            color: 'white',
            size: 100
        });

        aimJoystickMgr = nipplejs.create({
            zone: zone,
            mode: 'static',
            position: { right: '15%', bottom: '20%' },
            color: 'red',
            size: 100
        });

        // Movement handlers
        moveJoystickMgr.on('move', (evt, data) => {
            // normalise vector to keep max speed constant
            joysticks.move.x = Math.cos(data.angle.radian) * Math.min(data.distance / 50, 1);
            joysticks.move.y = -Math.sin(data.angle.radian) * Math.min(data.distance / 50, 1);
        });

        moveJoystickMgr.on('end', () => {
            joysticks.move.x = 0;
            joysticks.move.y = 0;
        });

        // Aiming and shooting handlers
        aimJoystickMgr.on('move', (evt, data) => {
            joysticks.aim.x = Math.cos(data.angle.radian);
            joysticks.aim.y = -Math.sin(data.angle.radian);
            joysticks.aim.active = true;
        });

        aimJoystickMgr.on('end', () => {
            joysticks.aim.active = false;
        });
    }
}

function getPlayerMovement() {
    let dx = 0;
    let dy = 0;

    // Keyboard prioritizing
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
    }

    // Add mobile joystick if active
    if (Math.abs(joysticks.move.x) > 0 || Math.abs(joysticks.move.y) > 0) {
        dx = joysticks.move.x;
        dy = joysticks.move.y;
    }

    return { x: dx, y: dy };
}

function getPlayerAimDirection(playerX, playerY) {
    // If mobile aim joystick is used
    if (joysticks.aim.active) {
        return Math.atan2(joysticks.aim.y, joysticks.aim.x);
    }
    
    // Default to Mouse
    return Math.atan2(mouse.y - playerY, mouse.x - playerX);
}

function isShooting() {
    return mouse.isDown || joysticks.aim.active;
}
