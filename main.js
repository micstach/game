// world
// obstacle [x-position, height]

var world = new World(32000);
world.initialize();

var gameSpeed = 1.0;
var groundLevel = 240;
var CONST_PI = 3.14159;

var jumpsStats = [];

var cpuPlayer = new CpuPlayer();
cpuPlayer.watchStats(jumpsStats);

var sigmoid = function(x) {
  return 1.0 / (1.0 + Math.exp(-x));
}

var gaussian = function(x) {
  return Math.exp(-(x * x));
}
      
$(document).ready(function() {

    var context = $('#gameView')[0].getContext("2d");
    
    window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();

    context.lineWidth = 1;
  
    let totalTime = 0.0;
    let deltaTime = 0;
    let playerX = 25;
    let playerY = 0;
    let playerScore = 0;
    let playerPassedTheWall = null;
    let jumpQuality = 0.0; // [0, 1]
    let jump = false;
    let jumpLength = 0.0;
    let jumpsCount = 0;
    let jumpLengthCollision = 0.0;
    let countHeight = false;
    let countHeightPrepare = false;
    let height = 0;
    let distanceToWallAtJumpStart = 0.0;
    let distanceToWallAtJumpPrepare = 0.0;
    let wallHeightAtJumpStart = 0.0;
    let passedWalls = {};

    let collision = false;

    var playerColor = "#00ff00";

    function animate() {
      context.clearRect(0, 0, 640, 480);

      world.move(deltaTime);

      let walls = world.getVisible(0, 640);

      for (let i=0; i<walls.length; i++) {
        let wall = walls[i];
        wall.render(context, groundLevel);
      }
  
      if (!collision) {
        context.fillStyle = playerColor;
      } else {
        context.fillStyle = "#ff0000";
      }

      if (walls.length > 0) {
        let nearestWall = {
          distance: 1024,
          height: 0
        };
        
        for (let i=0; i<walls.length; i++) {
          let wall = walls[i];
          let x = wall.getX();
          if (x > playerX) {
            if (x - playerX < nearestWall.distance) {
              nearestWall.distance = x - playerX;
              nearestWall.height = wall.getHeight();
            }
          }
        }
        if (countHeight) {
          if (countHeightPrepare) {
            distanceToWallAtJumpPrepare = nearestWall.distance;
            countHeightPrepare = false;
          }
          distanceToWallAtJumpStart = nearestWall.distance;
          wallHeightAtJumpStart = nearestWall.height;
        } 
        
        $("#distance").text(nearestWall.distance);
        $("#wallHeight").text(nearestWall.height);

        cpuPlayer.watch(nearestWall.height, nearestWall.distance);
      }
      else {
        $("#distance").text("");
        $("#wallHeight").text("");
        cpuPlayer.watch(0.0, 0.0);
      }

      $("#distanceToWallAtJump").text(distanceToWallAtJumpStart);


      context.fillRect(playerX - 3, groundLevel - playerY - 3, 6, 6);

      context.beginPath();
      context.moveTo(playerX, groundLevel);
      context.lineTo(playerX, groundLevel + height);
      context.strokeStyle = "#0000ff";
      context.stroke();

      context.beginPath();
      context.moveTo(playerX, groundLevel);
      context.lineTo(playerX + CONST_PI * (Math.ceil(height + 0.01) / 3.0), groundLevel);
      context.strokeStyle = "#0000ff";
      context.stroke();

      let wallCollision = false;
      for (let i=0; i<walls.length; i++) {
        let wall = walls[i];
        let x = wall.getX();

        if ((x - 3) < playerX && playerX < (x + 3)) {
          playerPassedTheWall = wall;

          wallCollision = true;
          
          if (playerY <= 0.0) {            
            collision = true;
          }
        } 
      }

      // game control
      if (countHeight) {
        height += 1.0 * gameSpeed;
      }

      let scale = (3.0 / Math.ceil(height + 0.01));
      let jl = CONST_PI / scale;
      for (let i=0; i<jl; i++) {
        let px = i;
        py = height * Math.sin(i * scale);
        context.fillRect(playerX + px, groundLevel - py, 1, 1);          
      }

      $("#jumpHeight").text(height);

      if (jump) {
        jumpLength += deltaTime * (3.0 / Math.ceil(height + 0.01));
        playerY = height * Math.sin(jumpLength);
      }

      if (jump && jumpLength >= CONST_PI) {
        if (playerPassedTheWall) {
          playerScore += collision ? 0 : 1;
          jumpsStats.push(new JumpStats(wallHeightAtJumpStart, distanceToWallAtJumpPrepare, distanceToWallAtJumpStart, height, jumpQuality));
        } 
        jump = false;
        playerY = 0.0;
        height = 0.0;
        playerPassedTheWall = null;
        collision = false;
      } 

      if (playerPassedTheWall) {
        passedWalls[playerPassedTheWall.getIdx()] = true;
        jumpsCount = Object.keys(passedWalls).length ;
        collision = false;
      }

      $("#jumpsCount").text(jumpsCount);
      $("#score").text(playerScore);
      $("#quality").text(jumpQuality);
      
      cpuPlayer.decision(collision,
        function() {
          prepareJump();
        }, 
        function(p) { 
          startJump(p);
        });

      //if (!collision) {
        deltaTime = 1.0 * gameSpeed;
        totalTime += deltaTime;
      //} else {
      //  deltaTime = 0.0;
      //}
      
      // if (collision) {
      //   // cpuPlayer.restart();
      //   //world.move(-totalTime);
      //   //totalTime = 0.0;
      //   //playerScore = 0;
      //   //jumpsCount = 0;
      //   collision = false;
      //   //time = 0;
      //   //jump = false;
      //   //playerY = 0.0;
      //   //height = 0.0;
      //   //distanceToWallAtJumpPrepare = 0;
      //   //distanceToWallAtJumpStart = 0;
      //   playerPassedTheWall = false;
      // }

      //gameSpeed += 0.01;
      requestAnimFrame(function() {
        animate();
      });
    };
    
    animate();

    function jumpRating(jumpPrepare, jumpStart, wallHeight) {
      let jumpHeight = jumpPrepare - jumpStart;
      let scale = (3.0 / Math.ceil(jumpHeight));
      let jumpLength = CONST_PI / scale;
      let py = jumpHeight * Math.sin(jumpStart * scale);
      let heightDiff = py - (wallHeight + 10);

      let quality = gaussian((jumpStart - jumpLength/2.0)/25.0);
      if (jumpHeight < wallHeight + 10)
        quality *= gaussian(((wallHeight + 10) - jumpHeight)/(0.5 * (wallHeight + 10)));
      else 
        quality *= gaussian(((wallHeight + 10) - jumpHeight)/(2.0 * (wallHeight + 10)));

      return {
        quality: quality,
        collision: (py <= wallHeight)
      }
    };

    cpuPlayer.jumpRating = jumpRating;

    function prepareJump() {
      if (!jump) {
        distanceToWallAtJumpPrepare = 0;
        distanceToWallAtJumpStart = 0;
        countHeight = true;
        countHeightPrepare = true;
        height = 0.0;
        playerY = 0.0;
        jumpLength = 0.0;
        collision = false;
      } else {
      }
    };

    function startJump(p){
      if (!jump) {
        //gameSpeed = 0.0;
        jump = true;
        countHeight = false;
        countHeightPrepare = false;
        playerY = 0.0;
        jumpLength = 0.0;
        jumpQuality = 0.0;

        // calculate quality of the jump
        let jumpHeight = (p ? p._jumpHeight: height);
        let jumpPrepare = (p ? p._jumpDistanceAtStart : distanceToWallAtJumpStart) + jumpHeight;
        let jumpStart = p ? p._jumpDistanceAtStart : distanceToWallAtJumpStart;
        
        let rating = jumpRating(jumpPrepare, jumpStart, wallHeightAtJumpStart);

        jumpQuality = rating.quality;
        collision = rating.collision;
      }
    };

    $("#gameView").mousedown(function(e) {
      prepareJump();
    });

    $("#gameView").mouseup(function(e) {
      startJump();
    });
});