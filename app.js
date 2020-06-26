//game window attr
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

//key attributes
const KEY_code_left = 37;
const KEY_code_UP = 38;
const KEY_code_RIGHT = 39;
const KEY_code_DOWN = 40;
const KEY_CODE_SPACE = 32;

//player attributer
const PLAYER_WIDTH = 20;
var PLAYER_MAX_SPEED = 600.0;
var MAX_LASER_SPEED_PLAYER = 300.0;
var MAX_LASER_SPEED_ENEMY = 200.0;
var LASER_COOLDOWN = 0.5;
var ENEMT_LASER_COOLDOWN = 1.0;

//enemy attributes
const ENEMIES_PER_ROW = 10;
const ENEMIES_PER_COL = 3;
const VERTICAL_PADDING = 70;
const HORIZONTAL_PADDING = 80;
const VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 5.0;

const GAME_STATE = {
    lastTime: Date.now(),
    leftKeyPressed: false,
    righKeyPressed: false,
    spaceKeyPressed: false,
    playerX: 0,
    playerY: 0,
    playerCooldown: 0,
    lasers: [],
    enemies: [],
    enemyLasers:[],
    gameOver : false,
};

function rectsIntersect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

function setPosition(el, x, y) {
    el.style.transform = `translate(${x}px, ${y}px)`;

}

function rand(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return min + Math.random() * (max - min);
  }

function clamp(v, min, max) {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max;
    } else {
        return v;
    }
}

function createPlayer($container) {
    GAME_STATE.playerX = GAME_WIDTH / 2;
    GAME_STATE.playerY = GAME_HEIGHT - 50;
    const player = document.createElement('img');
    player.src = 'img/player-blue-1.png';
    player.className = 'player';
    $container.appendChild(player);
    setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);

}

function destroyPlayer(container, player) {
    container.removeChild(player);
    //settinf the flag that laser has struck the player
    GAME_STATE.gameOver = true;
    const audio = new Audio("sound/sfx-lose.ogg");
    audio.play();
    
}

function updatePlayer(dt, container) {
    if (GAME_STATE.leftKeyPressed) {
        GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
    } if (GAME_STATE.righKeyPressed) {
        GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
    }
    GAME_STATE.playerX = clamp(
        GAME_STATE.playerX,
        PLAYER_WIDTH,
        GAME_WIDTH - PLAYER_WIDTH
    );

    if (GAME_STATE.spaceKeyPressed && GAME_STATE.playerCooldown <= 0) {
        createLaser(container, GAME_STATE.playerX, GAME_STATE.playerY);

        GAME_STATE.playerCooldown = LASER_COOLDOWN;
    }
    if (GAME_STATE.playerCooldown > 0) {
        GAME_STATE.playerCooldown -= dt;
    }

    const player = document.querySelector('.player');
    setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

//when the space key is pressed, player laser is created
function createLaser(container, x, y) {
    const element = document.createElement('img');
    element.src = "img/laser-blue-1.png";
    element.className = 'laser';
    container.appendChild(element);
    //x and y are the position coordinates of the player when the space key was pressed
    const laser = {
        x,
        y,
        element
    };
    //storing each laserelement in the lasers object
    GAME_STATE.lasers.push(laser);
    //when space key is clicked laser will come with sound
    const audio = new Audio('sound/sfx-laser1.ogg');
    audio.play();
    //setting the position of the laser at the position of user when space key was clicked
    setPosition(element, x, y);



}

//moving the laser and making it strike the enemy
function updateLasers(dt, container) {
    GAME_STATE.lasers.forEach(laser => {
        laser.y -= dt * MAX_LASER_SPEED_PLAYER;
        //checking if laser has crossed our dom
        if (laser.y <= 0) {
            //passing the container and that laser which has crossed the dom
            destroyLaser(container, laser);
        }
        setPosition(laser.element, laser.x, laser.y);
        //laser rectangle 
        const r1 = laser.element.getBoundingClientRect();
        const enemies = GAME_STATE.enemies;
        //looping through all the enemeis and bounding them as a rectangle
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.isDead) continue;
            //enemy rectangle 
            const r2 = enemy.enemyElement.getBoundingClientRect();
            if (rectsIntersect(r1, r2)) {
                // Enemy was hit
                destroyEnemy(container, enemy);
                //after enemy is killed we don't need that laser
                destroyLaser(container, laser);
                break;
            }
        }
    
    })
GAME_STATE.lasers = GAME_STATE.lasers.filter((laser) => !laser.isDead);
}

//when the laser has passed our container it has to be deleted or it has done its task of killing the other
function destroyLaser(container, laser) {
    container.removeChild(laser.element);
    //settinf the flag that laser is deleted
    laser.isDead = true;
}

//creating the enemies
function createEnemy(container, x, y) {
    //new enemy element is created
    const enemyElement = document.createElement('img')
    enemyElement.src = 'img/enemy-blue-1.png';
    enemyElement.className = 'enemy';
    container.appendChild(enemyElement);
    //abstract object of enemy
    const enemy = {
        x,
        y,
        cooldown : rand(0.5, ENEMY_COOLDOWN),
        enemyElement
    }
    //pushing every enemy to the enemies object
    GAME_STATE.enemies.push(enemy);
    setPosition(enemyElement, x, y);
}

function updateEnemies(dt, container) {
    //rotation effect , which help the enemies to move constantly
    const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50;
    const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 10;
    const enemies = GAME_STATE.enemies;
    enemies.forEach((enemy)=> {
        // enemy = enemies[i];
        const x = enemy.x + dx;
        const y = enemy.y + dy;
        setPosition(enemy.enemyElement, x, y);
        enemy.cooldown -= dt;
        if(enemy.cooldown<=0){
            //when enemy has cooldown create the laser
            createEnemyLaser(container, x , y);
            //change the cooldown value after creating the laser
            enemy.cooldown = ENEMY_COOLDOWN;
        } 
    })
    //filtering the enemies object and storing only the enemies that are not killed by the laser
    GAME_STATE.enemies = GAME_STATE.enemies.filter(e=> !e.isDead);
}


function destroyEnemy(container, enemy) {
    container.removeChild(enemy.enemyElement);
    //settinf the flag that laser has struck the enemy
    enemy.isDead = true;
}

//creating enemy laser
function createEnemyLaser(container, x , y){
    //element for enemy laser
    const element = document.createElement('img');
    element.src = 'img/laser-red-5.png'
    element.className = 'enemy-laser';
    container.appendChild(element);
    const laser = {x, y, element}
    //pushing every laser to this object so that it can be used later to change its position and to kill the player
    GAME_STATE.enemyLasers.push(laser);
    setPosition(element, x, y);
}

//movement of enemy laser , this functtion is invoked in the update function
function updateEnemyLasers(dt, container){
    //getting the lasers from the enemyLasers object
    const lasers = GAME_STATE.enemyLasers;
    //looping through all the enemy lasers
    for(let i=0; i<lasers.length; i++){
        const laser = lasers[i]; 
        //making it move towards the player
        laser.y += dt * MAX_LASER_SPEED_ENEMY;
        if (laser.y > GAME_HEIGHT) {
          destroyLaser(container, laser);
        }
        setPosition(laser.element, laser.x, laser.y);
        const r1 = laser.element.getBoundingClientRect();
        const player = document.querySelector(".player");
        const r2 = player.getBoundingClientRect();
        if (rectsIntersect(r1, r2)) {
          // Player was hit
          destroyPlayer(container, player);
          break;
        }
      }
    GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e=> !e.isDead);
}


function init() {
    const container = document.querySelector('.game');
    createPlayer(container);


    //creating the enemy ships
    const enemySpacing = (GAME_WIDTH - HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
    const enemyVerticalSpacing = (GAME_HEIGHT - VERTICAL_PADDING * 2) / (ENEMIES_PER_COL - 1);
    //for 3 rows , space between those 3 rows
    for (let j = 0; j < 3; j++) {
        const y = VERTICAL_PADDING + j * VERTICAL_SPACING;
        //for the colomns and the space between them
        for (let i = 0; i < ENEMIES_PER_ROW; i++) {
            const x = i * enemySpacing + HORIZONTAL_PADDING;

            createEnemy(container, x, y);
        }
    }


}

function playerHasWon() {
    return GAME_STATE.enemies.length === 0;
  }

function update(e) {
    const currentTime = Date.now();
    const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;

    if (GAME_STATE.gameOver) {
        document.querySelector(".game-over").style.display = "block";
        return;
      }
    
      if (playerHasWon()) {
        document.querySelector(".congratulation").style.display = "block";
        return;
      }

    const container = document.querySelector('.game');
    updatePlayer(dt, container);
    updateLasers(dt, container);
    updateEnemies(dt, container);
    updateEnemyLasers(dt, container);

    GAME_STATE.lastTime = currentTime;
    window.requestAnimationFrame(update);
}

//funtion to handle when arrow/space key is pressed
function onkeyDown(e) {
    if (e.keyCode === KEY_code_left) {
        //left key is pressed
        GAME_STATE.leftKeyPressed = true;
    }
    else if (e.keyCode === KEY_code_RIGHT) {
        //right key is pressed
        GAME_STATE.righKeyPressed = true;
    } else if (e.keyCode === KEY_CODE_SPACE) {
        GAME_STATE.spaceKeyPressed = true;
    }
}

//funtion to handle when arrow/space key is released
function onkeyUp(e) {
    if (e.keyCode === KEY_code_left) {

        //left key is pressed
        GAME_STATE.leftKeyPressed = false;
    }
    else if (e.keyCode === KEY_code_RIGHT) {
        //right key is pressed
        GAME_STATE.righKeyPressed = false;
    }
    else if (e.keyCode === KEY_CODE_SPACE) {
        //right key is pressed
        GAME_STATE.spaceKeyPressed = false;
    }
}

init()
window.addEventListener('keydown', onkeyDown);
window.addEventListener('keyup', onkeyUp);
window.requestAnimationFrame(update);

