class EventEmitter {//for publishing and subscribing to messages it lets different parts of the game talk to each other
    constructor() {
        this.listeners = {};
    }

    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
            this.listeners[message].push(listener);
    }
    emit(message, payload = null){
        if (this.listeners[message]){
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }
    clear() {
        this.listeners = {};//wipes all listeners so the game can restart new
    }
}


function loadTexture(path) {//loads image files and waits until its fully loaded before we can use it
    return new Promise((resolve) => {
        const img = new Image()
        img.src = path
        img.onload = () => {
            resolve(img)
        }
    })
}

class GameObject {//initializing the game objects positions and size
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.type = "";
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }

    draw(ctx) {//drawing it on to canvas
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width
        }
    }
}

class Hero extends GameObject {//inherits from gamobject class and sets its own width and height
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = "Hero";
        this.speed = { x: 0, y: 0 };
        this.cooldown = 0;
        this.life = 5;//the hero starts with 5 lives
        this.points = 0;//points increase as we kill more enemies
    }

    fire() {//cooldown counts down to 0 before hero can fire again
        gameObjects.push(new Laser(this.x + 45, this.y - 10));
        this.cooldown = 500;

        let id = setInterval(() => {
            if (this.cooldown > 0) {
                this.cooldown -= 100;
            } else {
                clearInterval(id);
            }
        }, 200);
    }

    canFire() {
        return this.cooldown === 0;
    }
    decrementLife(){//subtracting life
        this.life--;
        if (this.life === 0){
            this.dead = true;
        }
    }
    incrementPoints(){//increasing points based on kill
        this.points += 100;
    }
}

class Enemy extends GameObject {//inherits from gameobject also however we are automaticallly moving the enemy dowward every 300ms
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";
        const id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;
            } else {
                console.log('Stopped at', this.y);
                clearInterval(id);//stops when it hits the bottom
            }
        }, 300);//300ms
    }
}

class Laser extends GameObject {//laser moves up 15px every 100ms and is removed when it leaves the screen
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'Laser';
        this.img = laserImg;

        let id = setInterval(() => {
            if (this.y > 0) {
            this.y -= 15;
            } else {
            this.dead = true;
            clearInterval(id);
            }
        }, 100);
    }
}


function intersectRect(r1, r2) {//returns true if two rectangles overlap, used to detect if objects touch each other
    return !(r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top);
}


const Messages = {//messages tht show we hit the bottons
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_WIN: "GAME_END_WIN",
    GAME_END_LOSS: "GAME_END_LOSS",
};

let heroImg, //global variables we use throughout the game
    enemyImg, 
    enemyImg2,
    laserImg,
    lifeImg,
    backgroundImg,
    canvas, ctx, 
    gameObjects = [], 
    hero, 
    eventEmitter = new EventEmitter();

const onKeyDown = function (e) {//this prevents from scrolling when buttons are pressed
    console.log(e.keyCode);
    switch (e.keyCode) {
        case 37:
        case 39:
        case 38:
        case 40://Arrow keys
        case 32:
            e.preventDefault();
            break;//Space
        default:
            break;//do not block other keys
    }
};

window.addEventListener("keydown", onKeyDown);

window.addEventListener("keyup", (evt) => {//when the key is pressed show the message matched
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    } else if (evt.keyCode === 32){//comeback to it
        eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    } else if (evt.key === "Enter") {
		eventEmitter.emit(Messages.KEY_EVENT_ENTER);
	}
});

function createEnemies(ctx, canvas, enemyImg, enemyImg2) {//calculates the starting x position to center the enemy formation on the canvas
    const ENEMY_TOTAL = 5;
    const ENEMY_SPACING = 98;
    const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
    const START_X = (canvas.width - FORMATION_WIDTH) / 2;
    const STOP_X = START_X + FORMATION_WIDTH;

    let count = 0;//for tracking the position of enemies
    for (let x = START_X; x < STOP_X; x += 98) {//5 rows and 5 columns
        for (let y = 0; y < 50 * 5; y += 50) {
            const enemy = new Enemy(x, y);
            //enemy.img = enemyImg;
            //insttead of everyenemy being the same every other one is different
            //enemy.img = count % 2 === 0 ? enemyImg : enemyImg2;
            //this is for the UFOs to be in random spots in the enemies
            enemy.img = Math.random() > 0.5 ? enemyImg : enemyImg2;
            count++;
            gameObjects.push(enemy);
        }
    }
}

function createHero() {//createing the hero and adding it the game object
    hero = new Hero(
        canvas.width / 2 - 45,
        canvas.height - canvas.height / 4
    );
    hero.img = heroImg;
    gameObjects.push(hero);
}

function updateGameObjects() {//called every frame to check collisions and remove dead objects
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter(go => go.type === "Laser");

    // check if any enemy touches the hero
    enemies.forEach((enemy) => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    // Test laser-enemy collisions
    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: laser,
                    second: enemy,
                });
            }
        });
    });

    // Remove destroyed objects
    gameObjects = gameObjects.filter(go => !go.dead);
}

function drawGameObjects(ctx) {//drawing all the objects in game objects on canvas
    gameObjects.forEach(go => go.draw(ctx));
}


function initGame() {//connects key events to hero movement and creates the objects
    gameObjects = [];
    createEnemies(ctx, canvas, enemyImg, enemyImg2);
    createHero();
    //listens for key events and collision events, then responds accordingly
    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        hero.y -= 15;
    });
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        hero.y += 15;
    });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
        hero.x -= 15;
    });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
        hero.x += 15;
    });
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) {
            hero.fire();
        }
    });
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true;
        second.dead = true;
        hero.incrementPoints();

		if (isEnemiesDead()) {
			eventEmitter.emit(Messages.GAME_END_WIN);
		}
	});

	eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
		enemy.dead = true;
		hero.decrementLife();
		if (isHeroDead()) {
			eventEmitter.emit(Messages.GAME_END_LOSS);
			return; // loss before victory
		}
		if (isEnemiesDead()) {
			eventEmitter.emit(Messages.GAME_END_WIN);
		}
	});
    eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
        resetGame();
    });
	eventEmitter.on(Messages.GAME_END_WIN, () => {
		endGame(true);
	});
	eventEmitter.on(Messages.GAME_END_LOSS, () => {
		endGame(false);
	});
}

//All the helper functions

//draws life icons bottom right
function drawLife() {
    const START_POS = canvas.width - 280;//- 180;
    for (let i = 0; i < hero.life; i++) {
        ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), 7);
    }
}

//draws score bottom left
function drawPoints() {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'left';
    drawText('Points: ' + hero.points, 10, 30);
}

function drawText(message, x, y) {
    ctx.fillText(message, x, y);
}

//shows big message in center of screen
function displayMessage(message, color = 'red', y=canvas.height / 2) {
    ctx.font = '30px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, y);
}

function isHeroDead() {
    return hero.life <= 0;
}

function isEnemiesDead() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy' && !go.dead);
    return enemies.length === 0;
}

//stops game and shows win or loss message
function endGame(win) {
    clearInterval(gameLoopId);//
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (win) {
            displayMessage('VICTORY!!! ENEMIES CLEARED!!!', 'green');
            displayMessage('Press [Enter] to start a new game Captain Pew Pew', 'green', canvas.height / 2 + 40);
        } else {
            displayMessage('YOU LIFE HAS COME TO AN END !!!', 'red');
            displayMessage('Press [Enter] to restart Captain Pew Pew', 'red', canvas.height / 2 + 40);
        }
    }, 200);
}

//resets everything and starts new
//clears old listeners so we dont stack duplicate event handlers on restart
function resetGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
        eventEmitter.clear();
        initGame();
        gameLoopId = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
            //ctx.fillStyle = 'black';
            //ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawPoints();
            drawLife();
            updateGameObjects();
            drawGameObjects(ctx);
        }, 100);
    }
}


window.onload = async () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    heroImg = await loadTexture("assets/player.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    enemyImg2 = await loadTexture("assets/enemyUFO.png");
    backgroundImg = await loadTexture("assets/background.jpeg");
    laserImg = await loadTexture("assets/laserRed.png");
    lifeImg = await loadTexture("assets/life.png");

    initGame();
    gameLoopId = setInterval(() => {//clearns and redraws everything eveyr 100ms
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        //ctx.fillStyle = "black";
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateGameObjects();
        drawPoints();
        drawLife();
        drawGameObjects(ctx);
    }, 100);
};