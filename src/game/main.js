var SPEED = 160;
var BACKGROUND_PARALLAX = 0.8;
var GRAVITY = 983;
var BUOYANCY = 8;
var JET = 400;
var JETOFF = -20;
var GAMEOVER_DELAY = 1200;
var OPENING = 160;
var SPAWN_RATE = 1.5;

var state = {
    preload: function() {
        this.load.image('wall', '/assets/wall.png');
        this.load.image('background', '/assets/background-texture.png');
        this.load.spritesheet('player', '/assets/player.png', 48, 48);
        this.load.audio('hurt', '/assets/hurt.wav');
        this.load.audio('jet', '/assets/jet.wav');
        this.load.audio('score', '/assets/score.wav');
    },
    create: function() {
        this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');

        this.walls = this.add.group();

        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = GRAVITY;

        this.player = this.add.sprite(0, 0, 'player');
        this.player.animations.add('fly', [0, 2], 10, true);
        this.player.anchor.setTo(0.5, 0.5);

        this.scoreText = this.add.text(
            this.world.centerX,
            this.world.height / 5,
            '',
            { size: '32px', fill: '#ffffff', align: 'center' }
        );
        this.scoreText.anchor.setTo(0.5, 0);

        this.upKey = this.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.input.onDown.add(this.jet, this);
        this.upKey.onDown.add(this.jet, this);

        this.hurt = this.add.audio('hurt');
        this.jet = this.add.audio('jet');
        this.scoreSound = this.add.audio('score');

        this.physics.arcade.enableBody(this.player);
        this.player.body.collideWorldBounds = true;
        this.reset();
    },
    update: function() {
        if (this.gameStarted) {
            if (this.player.body.velocity.y > JETOFF) {
                this.player.frame = 3;
            } else {
                this.player.animations.play('fly');
            }

            if (!this.gameOver) {
                if (this.player.body.bottom >= this.world.bounds.bottom) {
                    this.endGame();
                }

                this.physics.arcade.collide(this.player, this.walls, this.endGame, null, this);

                this.walls.forEachAlive(function(wall) {
                    if (wall.x + wall.width < game.world.bounds.left) {
                        wall.kill();
                    } else {
                        if (!wall.scored && wall.x <= state.player.x) {
                            state.addScore(wall);
                        }
                    }
                });
            } else {
                if (this.time.now > this.timeOver + GAMEOVER_DELAY) {
                    this.scoreText.setText(this.score + '\nGAME OVER\n\n' + 'touch to restart')
                }
            }
        } else {
            this.player.y = this.world.centerY + (BUOYANCY * Math.cos(this.time.now / SPEED));
        }
    },
    reset: function() {
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;

        this.background.autoScroll(-BACKGROUND_PARALLAX * SPEED, 0);

        this.player.body.allowGravity = false;
        this.player.reset(this.world.width / 4, this.world.centerY);
        this.player.animations.play('fly');

        this.walls.removeAll();

        this.scoreText.setText('touch to start game');
    },
    start: function() {
        this.gameStarted = true;
        this.player.body.allowGravity = true;
        this.scoreText.setText(this.score);
        this.wallTimer = this.game.time.events.loop(Phaser.Timer.SECOND * SPAWN_RATE, this.spawnWalls, this);
        this.wallTimer.timer.start();
    },
    endGame: function() {
        this.gameOver = true;
        this.scoreText.setText(this.score + '\nGAME OVER')
        this.background.autoScroll(0, 0);
        this.timeOver = this.time.now;
        this.wallTimer.timer.stop();
        this.walls.forEachAlive(function(wall) {
            wall.body.velocity.x = 0;
        });
        this.player.body.velocity.x = this.player.body.velocity.y = 0;
        this.hurt.play();
    },
    jet: function() {
        if (!this.gameStarted) {
            this.start();
        }

        if (!this.gameOver) {
            this.player.body.velocity.y = -JET;
            this.jet.play();
        } else {
            if (this.time.now > this.timeOver + GAMEOVER_DELAY) {
                this.reset();
            }
        }
    },
    spawnWall: function(y, flipped) {
        var wall = this.walls.create(
            game.width,
            y + (flipped ? -OPENING : OPENING) / 2,
            'wall'
        );

        this.physics.arcade.enableBody(wall);
        wall.body.allowGravity = false;
        wall.body.immovable = true;
        wall.body.velocity.x = -SPEED;
        if (flipped) {
            wall.scale.y = -1;
            wall.body.offset.y = - wall.body.height;
        }

        return wall;
    },
    spawnWalls: function() {
        var wallY = this.rnd.integerInRange(game.height * 0.3, game.height * 0.7);
        var bottomWall = this.spawnWall(wallY, false);
        var topWall = this.spawnWall(wallY, true);
    },
    addScore: function(wall) {
        wall.scored = true;
        this.score += 0.5;
        if (this.score % 1 == 0) {
            this.scoreText.setText(this.score);
            this.scoreSound.play();
        }
    }
};

var game = new Phaser.Game(
    320,
    568,
    Phaser.AUTO,
    'game',
    state
);
