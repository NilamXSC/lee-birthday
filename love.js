(function(window){
    'use strict';

    function random(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    function bezier(cp, t) {  
        var p1 = cp[0].mul((1 - t) * (1 - t));
        var p2 = cp[1].mul(2 * t * (1 - t));
        var p3 = cp[2].mul(t * t); 
        return p1.add(p2).add(p3);
    }  

    function inheart(x, y, r) {
        var z = ((x / r) * (x / r) + (y / r) * (y / r) - 1) * ((x / r) * (x / r) + (y / r) * (y / r) - 1) * ((x / r) * (x / r) + (y / r) * (y / r) - 1) - (x / r) * (x / r) * (y / r) * (y / r) * (y / r);
        return z < 0;
    }

    
    function Point(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    
    Point.prototype = {
        clone: function() {
            return new Point(this.x, this.y);
        },
        add: function(o) {
            var p = this.clone();
            p.x += o.x;
            p.y += o.y;
            return p;
        },
        sub: function(o) {
            var p = this.clone();
            p.x -= o.x;
            p.y -= o.y;
            return p;
        },
        div: function(n) {
            var p = this.clone();
            p.x /= n;
            p.y /= n;
            return p;
        },
        mul: function(n) {
            var p = this.clone();
            p.x *= n;
            p.y *= n;
            return p;
        }
    };

    
    function Heart() {
        var points = [], x, y, t;
        for (var i = 10; i < 30; i += 0.2) {
            t = i / Math.PI;
            x = 16 * Math.pow(Math.sin(t), 3);
            y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            points.push(new Point(x, y));
        }
        this.points = points;
        this.length = points.length;
    }
    
    Heart.prototype = {
        get: function(i, scale) {
            return this.points[i].mul(scale || 1);
        }
    };

    
    function Branch(tree, point1, point2, point3, radius, length, branchs) {
        this.tree = tree;
        this.point1 = point1;
        this.point2 = point2;
        this.point3 = point3;
        this.radius = radius;
        this.startRadius = radius;
        this.length = length || 100;    
        this.len = 0;
        this.t = 1 / (this.length - 1);   
        this.branchs = branchs || [];
        this.drawnPoints = [];
        this.isMainTrunk = false;
    }

    Branch.prototype = {
        grow: function() {
            var s = this, p; 
            if (s.len <= s.length) {
                var t = s.len / s.length;
                p = bezier([s.point1, s.point2, s.point3], t);
                
                var adjustedRadius = s.radius;
                if (s.isMainTrunk) {
                    var taperFactor = Math.pow(1 - t, 0.8);
                    adjustedRadius = s.startRadius * (0.5 + taperFactor * 1.5);
                }
                
                s.drawnPoints.push({ point: p.clone(), radius: adjustedRadius });
                s.draw(p, adjustedRadius);
                s.len += 1;
                s.radius *= 0.97;
            } else {
                if (s.branchs && s.branchs.length > 0) {
                    s.tree.addBranchs(s.branchs);
                }
                s.tree.removeBranch(s);
            }
        },
        draw: function(p, radius) {
            var s = this;
            var ctx = s.tree.ctx;
            var drawRadius = radius !== undefined ? radius : s.radius;
            ctx.fillStyle = '#FFC0CB';
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, drawRadius), 0, 2 * Math.PI);
            ctx.fill();
        },
        redraw: function() {
            var s = this, ctx = s.tree.ctx;
            if (!s.drawnPoints || s.drawnPoints.length === 0) return;
            
            ctx.fillStyle = '#FFC0CB';
            
            if (s.drawnPoints.length > 1) {
                for (var i = 0; i < s.drawnPoints.length - 1; i++) {
                    var curr = s.drawnPoints[i];
                    var next = s.drawnPoints[i + 1];
                    
                    ctx.beginPath();
                    ctx.arc(curr.point.x, curr.point.y, Math.max(1, curr.radius), 0, 2 * Math.PI);
                    ctx.fill();
                }
                var last = s.drawnPoints[s.drawnPoints.length - 1];
                ctx.beginPath();
                ctx.arc(last.point.x, last.point.y, Math.max(1, last.radius), 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    };

    
    function Bloom(tree, point, figure, color, alpha, angle, scale, place, speed) {
        this.tree = tree;
        this.point = point;
        this.color = color || 'rgb(255, 0, 0)';
        this.alpha = alpha || 0.9;
        this.angle = angle || random(0, 360);
        this.scale = scale || 1.0;
        this.targetScale = scale || 1.0;
        this.place = place;
        this.speed = speed;
        this.figure = figure;
        this.isGrowing = true;
        this.growthSpeed = 0.15;
    }
    
    Bloom.prototype = {
        setFigure: function(figure) {
            this.figure = figure;
        },
        flower: function() {
            var s = this;
            if (s.isGrowing) {
                if (s.scale < s.targetScale) {
                    s.scale += s.growthSpeed;
                    if (s.scale >= s.targetScale) {
                        s.scale = s.targetScale;
                        s.isGrowing = false;
                    }
                } else {
                    s.isGrowing = false;
                }
            }
            s.draw();
        },
        draw: function() {
            var s = this, ctx = s.tree.ctx, figure = s.figure;
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.save();
            ctx.translate(s.point.x, s.point.y);
            ctx.scale(s.scale, s.scale);
            ctx.rotate(s.angle * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (var i = 0; i < figure.length; i++) {
                var p = figure.get(i);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1.0;
        },
        jump: function() {
            var s = this, height = s.tree.height;
            if (s.point.x < -20 || s.point.y > height + 20) {
                s.tree.removeBloom(s);
            } else {
                s.draw();
                if (s.place) {
                    s.point = s.place.sub(s.point).div(s.speed).add(s.point);
                }
                s.angle += 0.05;
                if (s.speed) s.speed -= 1;
            }
        }
    };

  
    function GroundPetal(x, y, figure, color, scale, angle) {
        this.x = x;
        this.y = y;
        this.figure = figure;
        this.color = color;
        this.scale = scale * 0.6; // Smaller on ground
        this.angle = angle;
        this.alpha = 0.8;
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.02 + Math.random() * 0.01;
        this.swayAmount = 2 + Math.random() * 3;
    }

    GroundPetal.prototype = {
        draw: function(ctx, time) {
            var sway = Math.sin(time * this.swaySpeed + this.swayOffset) * this.swayAmount;
            
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.save();
            ctx.translate(this.x + sway, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (var i = 0; i < this.figure.length; i++) {
                var p = this.figure.get(i);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1.0;
        }
    };

   
    function Tree(canvas, width, height, opt) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.opt = opt || {};
        this.branchs = [];
        this.blooms = [];
        this.bloomsCache = [];
        this.groundPetals = []; // NEW!
        this.maxGroundPetals = 30; // MAX 30 petals on ground
        this.groundY = height * 0.92; // Ground line position
        
        console.log('🌳 Tree initialized:', width, 'x', height);
        
        this.initSeed();
        this.initFooter();
        this.initBranch();
        this.initBloom();
    }
    
    Tree.prototype = {
        initSeed: function() {
            var seed = this.opt.seed || {};
            var x = seed.x || this.width / 2;
            var y = seed.y || this.height * 0.9;
            this.seedPoint = new Point(x, y);
        },

        initFooter: function() {
           
        },

        initBranch: function() {
            var branchs = this.opt.branch || [];
            this.addBranchs(branchs);
        },

        initBloom: function() {
            var bloom = this.opt.bloom || {};
            var cache = [];
            var totalHearts = bloom.num || 1000;
            var width = bloom.width || this.width;
            var height = bloom.height || this.height;
            var figure = new Heart();
            
            console.log('🌸 Generating', totalHearts, 'hearts in SUBTLE HEART SHAPE...');
            
            var centerX = width / 2;
            var centerY = height * 0.32;
            var heartScale = Math.min(width, height) * 0.35;
            
            var colors = [
                'rgb(255, 0, 0)',
                'rgb(255, 0, 0)',
                'rgb(255, 0, 0)',
                'rgb(255, 0, 0)',
                'rgb(220, 20, 60)',
                'rgb(220, 20, 60)',
                'rgb(220, 20, 60)',
                'rgb(255, 105, 180)',
                'rgb(255, 105, 180)',
                'rgb(255, 215, 0)',
                'rgb(255, 182, 193)'
            ];
            
            var generated = 0;
            
            
            var centerFillCount = 150;
            var centerRadius = heartScale * 0.35;
            for (var c = 0; c < centerFillCount; c++) {
                var angle = Math.random() * 2 * Math.PI;
                var dist = Math.sqrt(Math.random()) * centerRadius;
                var x = centerX + Math.cos(angle) * dist;
                var y = centerY + Math.sin(angle) * dist * 0.8;
                
                var color = colors[Math.floor(Math.random() * colors.length)];
                var alpha = 0.75 + Math.random() * 0.25;
                var scale = 0.85 + Math.random() * 0.5;
                
                cache.push(new Bloom(
                    this,
                    new Point(x, y),
                    figure,
                    color,
                    alpha,
                    random(0, 360),
                    scale,
                    null,
                    null
                ));
                generated++;
            }
            
           
            var layers = 10;
            var heartsPerLayer = Math.ceil((totalHearts - centerFillCount) / layers);
            
            for (var layer = 0; layer < layers && generated < totalHearts; layer++) {
                var layerScale = heartScale * (0.5 + (layer / layers) * 0.5);
                var numInLayer = Math.min(heartsPerLayer, totalHearts - generated);
                
                for (var i = 0; i < numInLayer; i++) {
                    var t = (i / numInLayer) * 2 * Math.PI;
                    
                    var heartX = 16 * Math.pow(Math.sin(t), 3);
                    var heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                    
                    var x = centerX + (heartX * layerScale / 16);
                    var y = centerY + (heartY * layerScale / 16);
                    
                    x += (Math.random() - 0.5) * layerScale * 0.4;
                    y += (Math.random() - 0.5) * layerScale * 0.4;
                    
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    var alpha = 0.75 + Math.random() * 0.25;
                    var scale = 0.85 + Math.random() * 0.5;
                    
                    cache.push(new Bloom(
                        this,
                        new Point(x, y),
                        figure,
                        color,
                        alpha,
                        random(0, 360),
                        scale,
                        null,
                        null
                    ));
                    
                    generated++;
                }
            }
            
            console.log('✅ Generated', generated, 'hearts - CENTER FILLED, SUBTLE HEART SHAPE');
            this.bloomsCache = cache;
        },

        addBranch: function(branch) {
            this.branchs.push(branch);
        },

        addBranchs: function(branchs) {
            var s = this, b, p1, p2, p3, r, l, c;
            for (var i = 0; i < branchs.length; i++) {
                b = branchs[i];
                p1 = new Point(b[0], b[1]);
                p2 = new Point(b[2], b[3]);
                p3 = new Point(b[4], b[5]);
                r = b[6];
                l = b[7];
                c = b[8] || [];
                var branch = new Branch(s, p1, p2, p3, r, l, c);
                
                if (i === 0) {
                    branch.isMainTrunk = true;
                }
                
                s.addBranch(branch); 
            }
        },

        removeBranch: function(branch) {
            var branchs = this.branchs;
            for (var i = 0; i < branchs.length; i++) {
                if (branchs[i] === branch) {
                    branchs.splice(i, 1);
                    return;
                }
            }
        },

        canGrow: function() {
            for (var i = 0; i < this.branchs.length; i++) {
                if (this.branchs[i].len <= this.branchs[i].length) {
                    return true;
                }
            }
            return false;
        },
        
        grow: function() {
            var branchs = this.branchs;
            var hasGrowing = false;
            for (var i = 0; i < branchs.length; i++) {
                var branch = branchs[i];
                if (branch && branch.len <= branch.length) {
                    branch.grow();
                    hasGrowing = true;
                }
            }
            return hasGrowing;
        },

        addBloom: function (bloom) {
            this.blooms.push(bloom);
        },

        removeBloom: function (bloom) {
            var blooms = this.blooms;
            for (var i = 0; i < blooms.length; i++) {
                if (blooms[i] === bloom) {
                    blooms.splice(i, 1);
                    return;
                }
            }
        },
        
        canFlower: function() {
            return !!this.bloomsCache.length || !!this.blooms.length;
        }, 
        
        flower: function(num) {
            var s = this, bloomsToAdd = s.bloomsCache.splice(0, num || 100);
            for (var i = 0; i < bloomsToAdd.length; i++) {
                s.addBloom(bloomsToAdd[i]);
            }
            var blooms = s.blooms;
            for (var j = 0; j < blooms.length; j++) {
                blooms[j].flower();
            }
        },

        
        addGroundPetal: function(bloom) {
            if (this.groundPetals.length >= this.maxGroundPetals) {
                this.groundPetals.shift(); // Remove oldest
            }
            
            var groundPetal = new GroundPetal(
                bloom.point.x,
                this.groundY,
                bloom.figure,
                bloom.color,
                bloom.scale,
                Math.random() * 360
            );
            
            this.groundPetals.push(groundPetal);
        },

        jump: function() {
            var s = this, blooms = s.blooms;
            var fallingCount = 0;
            var maxFalling = 8;
            
            for (var i = blooms.length - 1; i >= 0 && fallingCount < maxFalling; i--) {
                if (blooms[i].place) {
                    // Check if petal reached ground
                    if (blooms[i].point.y >= s.groundY - 20) {
                        s.addGroundPetal(blooms[i]); // Add to ground
                        s.removeBloom(blooms[i]); // Remove from falling
                    } else {
                        blooms[i].jump();
                    }
                    fallingCount++;
                }
            }
            
            if (fallingCount < maxFalling && blooms.length > 50) {
                var bloom = this.opt.bloom || {},
                    width = bloom.width || this.width,
                    height = bloom.height || this.height,
                    figure = new Heart();
                
                var centerX = width / 2;
                var centerY = height * 0.32;
                var heartScale = Math.min(width, height) * 0.40;
                
                var angle = Math.random() * 2 * Math.PI;
                var dist = Math.random() * heartScale * 0.9;
                var x = centerX + Math.cos(angle) * dist;
                var y = centerY + Math.sin(angle) * dist * 0.8;
                
                var place = new Point(random(width * 0.2, width * 0.8), s.groundY);
                blooms.push(new Bloom(this, new Point(x, y), figure, null, 0.85, null, 1, place, random(200, 350)));
            }
        },

        
        drawGround: function() {
            var ctx = this.ctx;
            var y = this.groundY;
            
            
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        },

        clear: function() {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    };

    
    window.random = random;
    window.bezier = bezier;
    window.Point = Point;
    window.Heart = Heart;
    window.Tree = Tree;
    window.Branch = Branch;
    window.Bloom = Bloom;
    window.GroundPetal = GroundPetal;

})(window);