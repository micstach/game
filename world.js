function World(width) {
    this._width = width;
    this._groundLevel = 240; 
    this._walls = [];
};

World.prototype.initialize = function() {
    var nextWallAtX = 250 + 25.0 * Math.random();

    for (var i=0; i<this._width; i++) {
        if (i > nextWallAtX) {
            var height = 15 + Math.random() * 75;
            this._walls.push(new Wall(nextWallAtX, height, i));
            nextWallAtX  += (5 * height  + (Math.random() * 50));
        }
    }
};

World.prototype.getVisible = function(a, b) {
    let walls = [];
    for (var i=0; i<this._walls.length; i++) {
        var x = this._walls[i].getX();
        if (a <=  x && x <b) {
            walls.push(this._walls[i]);
        } 
    }
    return walls;
};

World.prototype.move = function(deltaTime) {
    for (let i=0; i<this._walls.length; i++) {
        this._walls[i].move(deltaTime);
    }
};

// World.prototype.render = function(context, start, end) {
//     let walls = this.getVisible(start, end);
//     for (let i=0; i<walls.length; i++) {
//       let wall = walls[i];
//       let x = wall.getX() - s;
//       context.beginPath();
//       context.moveTo(x, _groundLevel + 2);
//       context.lineTo(x, _groundLevel - wall.getHeight());
//       context.strokeStyle = "#000000";
//       context.stroke();
//     }
// };

