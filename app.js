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
}

class Hero extends GameObject {//inherits from gamobject class and sets its own width and height
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 75;
        this.type = "Hero";
        this.speed = 5;
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


const Messages = {//messages tht show we hit the bottons
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
};

let heroImg, //global variables we use throughout the game
    enemyImg, 
    laserImg,
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
    }
});

function createEnemies(ctx, canvas, enemyImg) {//createing the enemies
    const ENEMY_TOTAL = 5;
    const ENEMY_SPACING = 98;
    const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
    const START_X = (canvas.width - FORMATION_WIDTH) / 2;
    const STOP_X = START_X + FORMATION_WIDTH;

    for (let x = START_X; x < STOP_X; x += 98) {//5 rows and 5 columns
        for (let y = 0; y < 50 * 5; y += 50) {
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
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

function drawGameObjects(ctx) {//drawing all the objects in game objects on canvas
    gameObjects.forEach(go => go.draw(ctx));
}



function initGame() {//connects key events to hero movement and creates the objects
  gameObjects = [];
  createEnemies(ctx, canvas, enemyImg);
  createHero();

  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -= 5;
  });

  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += 5;
  });

  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= 5;
  });

  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += 5;
  });

}

window.onload = async () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    heroImg = await loadTexture("assets/player.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    laserImg = await loadTexture("assets/laserRed.png");

    initGame();
    const gameLoopId = setInterval(() => {//clearns and redraws everything eveyr 100ms
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGameObjects(ctx);
    }, 100);
};