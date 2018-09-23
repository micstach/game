function Wall(x, height, idx) {
    this._x = x;
    this._height = height;
    this._idx = idx;
};

Wall.prototype.getX = function() {
    return this._x;
};

Wall.prototype.getIdx = function() {
    return this._idx;
};

Wall.prototype.getHeight = function() {
    return this._height;
};

Wall.prototype.move = function(deltaTime) {
    this._x -= deltaTime;
};

Wall.prototype.render = function(context, groundLevel) {
    context.beginPath();
    context.moveTo(this.getX(), groundLevel);
    context.lineTo(this.getX(), groundLevel - this.getHeight());
    context.strokeStyle = "#000000";
    context.stroke();
}