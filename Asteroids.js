const FPS = 60; // frames per second (Try reverting back to 30, if 60 does not work)
const FRICTION = 0.7; // makes the ship slow down, when player stops accelerating it (0 = no friction, 1 = lots of friction)
const GAME_LIVES = 3; // Starting lives the player has at the beginning of the game. (Feel free to adjust at your own leisure)
const LASER_DIST = 0.6;  // sets up the vector of the lasers
const LASER_EXPLODE_DUR = .1; // (Feel free to adjust at your leisure) duration of the laser's explosion in seconds when colliding with asteroid
const LASER_MAX = 10;  // amount of lasers allowed to be shown on the screen at once (just like having two fire balls in Super Mario Bros.)
const LASER_SPD = 500; // how fast the laser travels pixel per second (feel free to adjust it at your own leisure)
const ROIDS_JAG = 0.4;  // adds more polygons on asteroids to make it more like the asteroids from the original game (0 = none, 1 = lots)
const ROIDS_PTS_LGE = 20;  // displays the points in the game (the number represents the points the large asteroids are worth)
const ROIDS_PTS_MED = 50; // the number represents the points the medium asteroids are worth
const ROIDS_PTS_SML = 100; // the number represents the points the small asteroids are worth
const ROIDS_NUM = 4;  // starting number of asteroids at the beginning of the game
const ROIDS_SIZE = 100;  // starting size of the asteroids in pixels
const ROIDS_SPD = 50;  // starting speed of asteroids in pixels per second
const ROIDS_VERT = 10; // average number of vertices on each asteroid



/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas"); 
var ctx = canv.getContext("2d"); 






// set up sound effects 
var fxExplode = new Sound("sounds/explode.m4a"); // sounds for ship exploding when it crashes with an asteroid
var fxHit = new Sound("sounds/hit.m4a", 5, 0.5); // sounds will register when player hits asteroid with laser
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.1); // sounds for the laser (Changed Audio to Sound). 5 times you'll hear the sound, and 0.5 is the volume
var fxThrust = new Sound("sounds/thrust.m4a"); // sound will register when player initiates thrusters on ship

const SHIP_EXPLODE_DUR = .3; // (Feel free to adjust at your leisure) duration of the ship's explosion
const SAVE_KEY_SCORE = "highscore"; // The save key for local storage of high score
const SHIP_BLINK_DUR = .1; // (Feel free to adjust at your leisure) duration of the ship blinking while invisible in seconds
const SHIP_INV_DUR = 3; // (Feel free to adjust at your leisure) duration of the ship being invisible
const SHIP_SIZE = 30; // ship height in pixels (Feel free to adjust at your leisure)
const SHIP_THRUST = 5; // accelerates the ship in pixels per second (feel free to adjust the speed of the ship at your own leisure)
const TURN_SPEED = 360; // turn speed in degrees per second (can turn 360 degrees)
const SHOW_BOUNDING = false; // show or hide collision bounding
const SHOW_CENTRE_DOT = false; // show or hide ship's centre dot
const SOUND_ON = true; // currently set to false to eliminate sound effects temporarily
const TEXT_FADE_TIME = 2.5; // the amount of seconds it takes for the text to fade out
const TEXT_SIZE = 40; // the font size of the text appearing on the screen in pixels


// Optimization for mobile devices (ORIGINATED FROM SPACE INVADERS)
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    fps = 29;
  }

//############## 




// set up the game parameters
var level, lives, roids, score, ship, scoreHigh, text, textAlpha; // textAlpha is the transparency component of the text when the text fades out
newGame(); // this will be called when the game is over

// set up event handlers (detects user's input)
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);


// set up the game loop
setInterval(update, 1000 / FPS);





function createAsteroidBelt() {
    roids = [];
    var x, y; 
    for (var i = 0; i < ROIDS_NUM + level; i++) { // + level will transition game to next level

        // This do while loop will prevent the asteroids from touching the ship at the first nanosecond of the game
        do {
            x = Math.floor(Math.random() * canv.width); 
            y = Math.floor(Math.random() * canv.height); 
        }
        while (distanceBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2))); 
    }
}

function destroyAsteroid(index) {
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    // split the asteroid in two when collides with laser
    if (r == Math.ceil(ROIDS_SIZE / 2)) {
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
        score += ROIDS_PTS_LGE; // points scored for shooting large asteroids
    }
    // split the asteroid in two when collides with laser
    else if (r == Math.ceil(ROIDS_SIZE / 4)) {
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
        score += ROIDS_PTS_MED; // points scored for shooting medium asteroids
    }
    else {
        score += ROIDS_PTS_SML; // points scored for shooting small asteroids
    }

    // check high score (if player's score is higher than high score, then update the high score to the player's score)
    if (score > scoreHigh) { 
        scoreHigh = score; 
        localStorage.setItem(SAVE_KEY_SCORE, scoreHigh); // this will save the data for the high score so when the game ends, it won't be set back to 0.
    }

    // destroy the asteroid
    roids.splice(index, 1);
    fxHit.play();

    // new level when no more asteroids are present
    if (roids.length == 0) { 
        level++; 
        newLevel(); 
    }
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); // y2 - y1, 2 means y2 - y1 squared
}

function drawShip(x,y,a, color = "green") {
    // draw triangular ship
    ctx.strokeStyle = color; // Feel free to change it to "green" or "white" or "lime" inside function drawShip (This outputs the color of the ship)
    ctx.lineWidth = SHIP_SIZE / 20; // denominator is 20 
    ctx.beginPath();
    
    // represents the nose of the ship
    ctx.moveTo( 
        x + 4 / 3 * ship.r * Math.cos(a), 
        y - 4 / 3 * ship.r * Math.sin(a)
    );

    // represents the rear left of the ship
    ctx.lineTo(
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)), // try 4/3 or 2/3
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a)) // try 4/3 or 2/3
    );
    
    // represents the rear right of the ship
    ctx.lineTo(
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)), // try 4/3 or 2/3
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a)) // try 4/3 or 2/3
    );
    // helps complete the triangular ship for you
    ctx.closePath();
    ctx.stroke();
}

// collision circle for ship lights up when colliding with the collisions circles for the asteroids.
function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS); 
    fxExplode.play(); 
}

function gaemeOver() {
    ship.dead = true; 
    text = "Game Over"; 
    textAlpha = 1.0; 
}


function keyDown(/** @type {KeyboardEvent} */ ev) { 

    // this if statement will not access any of the switch case statements in this function, if there are no more lives in the game
    if (ship.dead) { 
        return; 
    }

    switch(ev.keyCode) {
        case 32: // space bar (shoot laser)
        shootLaser();
            break; 
        case 37: // left arrow (rotate ship left)
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS; 
            break; 
        case 38: // up arrow (thrust the ship forward)
            ship.thrusting = true;
            break; 
        case 39: // right arrow (rotate ship right)
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS; 
            break; 
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {

    // this if statement will not access any of the switch case statements in this function, if there are no more lives in the game
    if (ship.dead) { 
        return; 
    }

    switch(ev.keyCode) {
        case 32: // space bar (allow shooting again)
            ship.canShoot = true; 
            break; 
        case 37: // left arrow (stop rotating left)
            ship.rot = 0; 
            break; 
        case 38: // up arrow (stop thrusting)
            ship.thrusting = false;
            break; 
        case 39: // right arrow (stop rotating right)
            ship.rot = 0; 
            break; 
    }
}

function newAsteroid(x, y, r) { 
    var lvlMult = 1 + 0.1 * level; // used for new levels
    var roid = {
        x: x, 
        y: y, 
        xv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r, 
        a: Math.random() * Math.PI * 2,  // in radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
        offs: []
    };

    // create the vertex offset array
    for (var i = 0; i < roid.vert; i++) { 
        roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }

    return roid; 
}

function newGame() {
    level = 0; // This represents which level the game starts. If it is set to 10, then the game will start at level 10 
    lives = GAME_LIVES // game lives will be shown in the game
    score = 0; // when the game starts, the score will be set to zero
    ship = newShip(); // a new ship will be displayed at the start of the game

    // get the high score from local storage (if you remove this if else statement, the high score will display as null on the game screen)
    var scoreStr = localStorage.getItem(SAVE_KEY_SCORE); // localStorage.getItem() will save the the current high score when the game is over
    if (scoreStr == null) {
        scoreHigh = 0; 
    }
    else { 
        scoreHigh = parseInt(scoreStr);
    }

    newLevel(); // this will be called when the game is transitioned to a new level
}

function newLevel() { 
    text = "Level " + (level + 1); // This will display the text letting the player know which level they are on. 
    textAlpha = 1.0; // the transparency and opaque appearance of the text displayed on the level
    createAsteroidBelt();
}

// a new ship will spond after your previous ship has been destroyed due to colliding with an asteroid
function newShip() {
    return {
        x: canv.width / 2, 
        y: canv.height / 2, 
        r: SHIP_SIZE / 2, 
        a: 90 / 180 * Math.PI, // convert to radians (a  represents the direction of the ship like the Unit Circle from trigonometry in your high school and college years)
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR), // the amount of blinks that will occur during the duration of ship being invisible
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS), // blink sequence happens
        canShoot: true, // allows ship to shoot
        dead: false,
        explodeTime: 0, // 0 frames left after the ship explodes when colliding with asteroid(s)
        lasers: [], // keeps track of lasers
        rot: 0,
        thrusting: false,
    
        // when you stop thrusting the ship, it will continue following the set trajectory for a short amount of time.
        thrust: {
            x: 0, 
            y: 0
        }
    }
}

function shootLaser() {
    // create the laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({ // from the nose of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a), 
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS, 
            yv: -LASER_SPD * Math.sin(ship.a) / FPS, // we set LASER_SPD to negative due to negative having an upwards direction on the screen and not downwards
            dist: 0,
            explodeTime: 0
        });
        fxLaser.play(); // the laser sounds for the ship firing is functioning in the game
    }

    // prevent further shooting
    ship.canShoot = false; 
}

// when you press the "space bar" multiple times, the laser sounds will coincide with it. 
function Sound(src, maxStreams = 1, vol = 1.0) {
    this.streamNum = 0; 
    this.streams = [];
    for (var i = 0; i < maxStreams; i++) {
        this.streams.push(new Audio(src));
        this.streams[i].volume = vol; 
    }

    // elements will be cycled through as the play element is called
    this.play = function() { 

        if (SOUND_ON) {
        this.streamNum = (this.streamNum + 1) % maxStreams;
        this.streams[this.streamNum].play(); 
        }
    }

    // 
    this.stop = function() {
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0; // sets cursor back to the start of that stream
    }
}

function update() { 
    var blinkOn = ship.blinkNum % 2 == 0; 
    var exploding = ship.explodeTime > 0; 

    // draw space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height); 

    // thrust the ship
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
        fxThrust.play(); // sounds of thrusters will play while ship is thrusting

        // if the ship is not in the exploding sequence (NOTE: blinkOn will make the exhaust flames blink along with ship)
        if (!exploding && blinkOn) {
            // draw exhaust flames
            ctx.fillStyle = "red";
            ctx.strokeStyle = "yellow"; // Feel free to change it to "orange" or "yellow"
            ctx.lineWidth = SHIP_SIZE / 10; // denominator is 10 
            ctx.beginPath();
            
            // represents the tip of the flames
            ctx.moveTo( // rear left
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)), //  0.5 * adjusts the flame size
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a)) //  0.5 * adjusts the flame size
            );

            // Adjusts the size of the exhaust flames coming out of ship.
            ctx.lineTo( // rear center behind the ship
                ship.x - ship.r * 6 / 3 * Math.cos(ship.a), // try 4/3 or 6/3 to adjust length of the exhaust flames
                ship.y + ship.r * 6 / 3 * Math.sin(ship.a) // try 4/3 or 6/3 to adjust the length of the exhaust flames
            );
            
            // represents the rear right of the ship
            ctx.lineTo(
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)), // 0.5 * adjusts the flame size (2/3 * )
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a)) //  0.5 * adjusts the flame size (2/3 * )
            );

            // helps complete the triangular ship for you
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    // ship slows down, when player stops accelerating it
    else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
        fxThrust.stop(); // sounds of the thrusters of the ship will stop, when the player stops accelerating the ship
    }

    // if the ship is not going through the process of exploding after collision
    if (!exploding) {

        // If the blink sequence when a new ship sponds is on
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a);
    }

        // handle blinking if the number of times it blinks is zero
        if (ship.blinkNum > 0) {
            // reduce the blink time
            ship.blinkTime--;

            // reduce the blink number
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }
    }

    else {
        // draws the explosion
        ctx.fillStyle = "darkred"; 
        ctx.beginPath(); 
        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "red"; 
        ctx.beginPath(); 
        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "orange"; 
        ctx.beginPath(); 
        ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "yellow"; 
        ctx.beginPath(); 
        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "white"; 
        ctx.beginPath(); 
        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
    }

    // helps complete the triangular ship for you
    /*
    ctx.closePath();
    ctx.stroke();
    */

    // outlines collision detection for ship
    if (SHOW_BOUNDING) {
        ctx.strokeStyle = "lime"; 
        ctx.beginPath(); 
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        ctx.stroke();
    }

    // draw the asteroids 
    var x, y, r, a, vert, offs;
    for (var i = 0; i < roids.length; i++){

        ctx.strokeStyle = "white"; // try "slategrey" or "white"
        ctx.lineWidth = SHIP_SIZE / 20;

        // get the asteroid properties 
        x = roids[i].x;          // x
        y = roids[i].y;          // y
        r = roids[i].r;          // radius
        a = roids[i].a;          // angle
        vert = roids[i].vert;    // vertices
        offs = roids[i].offs;


        // draw a path 
        ctx.beginPath(); 
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a), // x plus the radius times the cosine of the angle
            y + r * offs[0] * Math.sin(a) // y plus the radius times the sine of the angle
        );

        // draw the polygon (shape of the asteroid)
        for (var j = 1;  j < vert; j++) {
            ctx.lineTo(
                x + r * offs[j] *  Math.cos(a + j * Math.PI * 2 / vert),  
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert),
            );
        }
        ctx.closePath(); 
        ctx.stroke();

        // outlines the collision detection for asteroids
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime"; 
            ctx.beginPath(); 
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.stroke();
        }

    }

    // centre dot
    if (SHOW_CENTRE_DOT) {
        ctx.fillStyle = "red"; 
        ctx.fillRect(ship.x - 1, ship.y -1, 2, 2);
    }

    // draw the lasers
    for (var i = 0; i < ship.lasers.length; i++) {
        if (ship.lasers[i].explodeTime == 0) {
            ctx.fillStyle = "lightblue" // represents the color of the laser (feel free to try a different color besides "salmon" at your leisure)
            ctx.beginPath(); 
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
            ctx.fill(); 
        }
        else {
            // draw the explosion
            ctx.fillStyle = "orangered" // represents the color of the laser (feel free to try a different color besides "salmon" at your leisure)
            ctx.beginPath(); 
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * .75, 0, Math.PI * 2, false);
            ctx.fill(); 
            ctx.fillStyle = "salmon" // represents the color of the laser (feel free to try a different color besides "salmon" at your leisure)
            ctx.beginPath(); 
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * .5, 0, Math.PI * 2, false);
            ctx.fill(); 
            ctx.fillStyle = "pink" // represents the color of the laser (feel free to try a different color besides "salmon" at your leisure)
            ctx.beginPath(); 
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * .25, 0, Math.PI * 2, false);
            ctx.fill(); 
        }
    }

    // draw the game text (You can try to replace with the graphics used for Space Invaders)
    if (textAlpha >= 0) {
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")"; // makes text fade out
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75); 
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS); 
    }

    // this is where the player can reset the game and start a new one after the game is over
    else if (ship.dead) {
        newGame();
    }

    // draw the lives (displays on top left of the screen)
    var lifeColor; 
    for (var i = 0; i < lives; i++) {
        lifeColor = exploding && i == lives - 1 ? "red" : "green"; // when the ship explodes, the icons representing the lives will turn from green to red before despawning
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColor); 
    }

    // draw the score (displays on top right of the screen)
    ctx.textAlign = "right"; 
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white"; // makes text fade out
    ctx.font = TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(score, canv.width - SHIP_SIZE / 2, SHIP_SIZE); 

    // draw the high score (displays on top center of the screen)
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white"; // makes text fade out
    ctx.font = (TEXT_SIZE * 0.75) + "px dejavu sans mono"; // 0.75 makes the font smaller
    ctx.fillText(scoreHigh, canv.width / 2, SHIP_SIZE); // high schore is displayed here

    // detect laser hits on asteroids
    var ax, ay, ar, lx, ly; 
    for (var i = roids.length - 1; i >= 0; i--) {

        // grab the asteroid properties
        ax = roids[i].x; 
        ay = roids[i].y; 
        ar = roids[i].r; 

        // loop over the lasers (removes laser after it collides with asteroid)
        for (var j = ship.lasers.length - 1; j >= 0; j--) {

            // grab the laser properties 
            lx = ship.lasers[j].x; 
            ly = ship.lasers[j].y;

            // detect laser hits on asteroids 
            if (ship.lasers[j].explodeTime == 0 && distanceBetweenPoints(ax, ay, lx, ly) < ar) {

                // destroy the asteroid and activate the laser explosion
                destroyAsteroid(i);
                ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS)

                break;
            }
        }
    }

    // if the asteroid(s) and ship are not colliding (The ship will stop when it collides with an asteroid)
    if (!exploding) {

        // if the ship is not blinking, then the game can detect collisions
        if (ship.blinkNum == 0 && !ship.dead) {

        // check for asteroid collisions
        for (var i = 0; i < roids.length; i++) {
            if (distanceBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
                explodeShip();
                destroyAsteroid(i);
                break; 
            }
        }
    }

        // rotate the ship
        ship.a += ship.rot;

        // move the ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    }
    else {
        ship.explodeTime--; // reduces the amount of time left after the explosion

        // if the explosion sequence reaches to zero
        if (ship.explodeTime == 0) {
            lives--; // lives will decrement when ship explodes
            if (lives == 0) {
                gaemeOver(); // game over displays when lives hit 0
            }
            else {
                ship = newShip();
            }
        }
    }

    // handle edge of screen 
    /*(this is where the ship will appear from the west side of the screen, if it heads towards the east) */
    if (ship.x < 0 - ship.r) {
        ship.x = canv.width + ship.r;
    }
    else if (ship.x > canv.width + ship.r) {
        ship.x = 0 - ship.r;
    }

    // handle edge of screen
    /*(this is where the ship will appear from the north side of the screen, if it heads towards the south) */
    if (ship.y < 0 - ship.r) {
        ship.y = canv.height + ship.r;
    }
    else if (ship.y > canv.height + ship.r) {
        ship.y = 0 - ship.r;
    }

    // moves the lasers
    for (var i = ship.lasers.length -1; i >= 0; i--) { 

        // check distance of the lasers travelled
        if (ship.lasers[i].dist > LASER_DIST * canv.width) { 
            ship.lasers.splice(i, 1);
            continue; 
        }

        // handle the explosion of laser
        if (ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--; 

            // destroy the laser after the duration is up 
            if (ship.lasers[i].explodeTime == 0) {
                ship.lasers.splice(i, 1); 
                continue;
            }
        }
        else {
            // move the laser
            ship.lasers[i].x += ship.lasers[i].xv; 
            ship.lasers[i].y += ship.lasers[i].yv; 

            // calculates the vector of the lasers
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)); // uses the Pythagorean Theorem to create the limited vector of the lasers
        }

        // handles direction of the lasers at the edge of the x position of the screen
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canv.width; 
        }

        else if (ship.lasers[i].x > canv.width) {
            ship.lasers[i].x = 0; 
        }

        // handles direction of the lasers at the edge of the y position of the screen
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canv.height; 
        }

        else if (ship.lasers[i].y > canv.height) {
            ship.lasers[i].y = 0; 
        }
    }

    // move the asteroid
    for (var i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;

        // handle edge of screen for the asteroids horizontally
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canv.width + roids[i].r; 
        }
        else if (roids[i].x > canv.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r;
        }

        // handle edge of screen for the asteroids vertically
        if (roids[i].y < 0 - roids[i].r) {
            roids[i].y = canv.height + roids[i].r; 
        }
        else if (roids[i].y > canv.height + roids[i].r) {
            roids[i].y = 0 - roids[i].r;
        }

    }

    // centre dot 
    //ctx.fillStyle = "red";
    //ctx.fillRect(ship.x - 1, ship.y -1, 2, 2); // Shows the red dot in the ship.
}
