function CpuPlayer() {
    this._stats = [];
    this._closestJump = null;
    this._watchWallDistance = 0.0;
    this._watchWallHeight = 0.0;

    // _jumpState
    // READY
    // INITIATED
    // STARTED
    this._jumpStatus = 'ready';

    this.jumpRating = null;
};

CpuPlayer.prototype.watch = function(wallHeight, wallDistance) {
    this._watchWallDistance = wallDistance;
    this._watchWallHeight = wallHeight;
}

CpuPlayer.prototype.watchStats = function(stats) {
    this._stats = stats;
}

CpuPlayer.prototype.restart = function() {
    this._watchWallHeight = 0.0;
    this._watchWallDistance = 0.0;
    this._closestJump = null;
    this._jumpInitiated = false;
};

CpuPlayer.prototype.findWallDistanceToPrepareJump = function() {
    // find best jump
    let minDiff = 1024;
    let closestJump = null;

    for (let i=0; i<this._stats.length; i++) {
        let diff = Math.abs(this._watchWallHeight - this._stats[i]._wallHeight);
        if (diff < minDiff) {
            minDiff = diff;
            closestJump = this._stats[i];
        } else if (diff === minDiff) {
            if (closestJump && closestJump._quality > this._stats[i]._quality) {
                closestJump = this._stats[i];
            }
        } 
    }

    return closestJump;
};

CpuPlayer.prototype.optimize = function(jump) {
    let rate = this.jumpRating(jump._jumpDistanceToWallAtPrepare, jump._jumpDistanceAtStart, jump._wallHeight);
    let optimizationSteps = 1000 * (1.0 - rate.quality);
    console.log('initial quality: ' + rate.quality);
    console.log('optimization steps: ' + optimizationSteps)
    for (let j=0;j<optimizationSteps; j++) { 
        
        rate = this.jumpRating(jump._jumpDistanceToWallAtPrepare, jump._jumpDistanceAtStart, jump._wallHeight);
        let step = 0.1;
        let ratex = this.jumpRating(jump._jumpDistanceToWallAtPrepare + step, jump._jumpDistanceAtStart, jump._wallHeight);
        let ratey = this.jumpRating(jump._jumpDistanceToWallAtPrepare, jump._jumpDistanceAtStart + step, jump._wallHeight);

        let dx = (rate.quality - ratex.quality) / step;
        let dy = (rate.quality - ratey.quality) / step;

        let gradient = {
            dx: -2.0 * dx / Math.sqrt(dx*dx + dy*dy),
            dy: -2.0 * dy / Math.sqrt(dx*dx + dy*dy)
        }
                        
        if (jump._quality < 1.0) {
            jump._jumpDistanceToWallAtPrepare += gradient.dx;
            jump._jumpDistanceAtStart += gradient.dy;
            jump._jumpHeight = jump._jumpDistanceToWallAtPrepare - jump._jumpDistanceAtStart;
        }

        jump._quality = this.jumpRating(jump._jumpDistanceToWallAtPrepare, jump._jumpDistanceAtStart, jump._wallHeight).quality;
    }
    rate = this.jumpRating(jump._jumpDistanceToWallAtPrepare, jump._jumpDistanceAtStart, jump._wallHeight);
    console.log('optimized quality: ' + rate.quality);
};

CpuPlayer.prototype.decision = function(collision, prepareJump, jump) {

    if (this._jumpStatus === 'started' && this._statsSize < this._stats.length) {
        // take last jump and optimize it
        let jump = this._stats[this._stats.length-1];

        this.optimize(jump);

        this._statsSize = this._stats.length;
        this._closestJump = null;
        this._jumpStatus = 'ready';
    }

    if (this._jumpStatus === 'initiated') {
        if (this._closestJump && this._closestJump._jumpDistanceAtStart >= this._watchWallDistance) {
            jump(this._closestJump);
            this._jumpStatus = 'started';
        }        
    } else {
        if (!collision && this._watchWallHeight > 0) {
            if (this._jumpStatus === 'ready') {
                if (!this._closestJump) {
                    this._closestJump = this.findWallDistanceToPrepareJump();
                    this._preoptimized = false;
                }

                if (this._closestJump && !this._preoptimized) {
                    // pre-optimize random jump
                    let jump = {
                        _jumpDistanceToWallAtPrepare: this._closestJump._jumpDistanceToWallAtPrepare,
                        _jumpDistanceAtStart: this._closestJump._jumpDistanceAtStart,
                        _jumpHeight: this._closestJump._jumpHeight,
                        _wallHeight: this._watchWallHeight,
                        _quality: this._closestJump._quality
                    }

                    this.optimize(jump);

                    this._closestJump = jump;
                    this._preoptimized = true;     
                }
                
                if (this._closestJump && this._watchWallDistance <= this._closestJump._jumpDistanceToWallAtPrepare) {
                    prepareJump();
                    this._statsSize = this._stats.length;
                    this._jumpStatus = 'initiated';
                }
            }
        }
    }
};



