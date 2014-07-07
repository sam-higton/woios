



window.onload = function () {
	var game = new ADGame('game-target');

	

	

	game.addSound("shoot","assets/sounds/shoot2.wav");
	game.addSound("hit","assets/sounds/hit2.wav");
	game.addSound('killed',"assets/sounds/player_killed.wav");

	game.initActions.push(function (game) {
		var as1 = game.objectFactory.get('asteroid',{
			startPosX: 640,
			startPosY: 20,
			velocityX: -2,
			velocityY: 5,
			radius: 10
		});
		var as2 = game.objectFactory.get('asteroid', {
			startPosX: 640,
			startPosY: 200,
			velocityX: -3,
			velocityY: -2,
			radius: 20
		});
		var playerShip = game.objectFactory.get('playerShip',{
			startPosX: 20,
			startPosY: 240,
			maxVel: 5
		});
		game.addGameObject(as1);
		game.addGameObject(as2);

		game.register['asteroidCount'] = 2;
		game.register['maxAsteroids'] = 40;
		game.register['totalScore'] = 0;
		game.register['asteroidCollection'] = new GameObjectCollection();
		game.register['asteroidCollection'].objectList.push(as1);
		game.register['asteroidCollection'].objectList.push(as2);
		game.helpers['RandomNumber'] = new RandomNumber();
		game.helpers['2DMath'] = new TwoDimensionalMath();
		game.addGameObject(playerShip);
	});

	game.objectFactory.addType('asteroid', function (params) {
		var newAsteroid = new simpleObject(game);

		newAsteroid.pos = {
			x: params.startPosX,
			y: params.startPosY
		};
		newAsteroid.vel = {
			x: params.velocityX,
			y: params.velocityY
		};
		newAsteroid.rad = params.radius;
		//update position, based on velocity
		newAsteroid.types = ["A","B"];
		newAsteroid.type = "A";
		newAsteroid.colorTypes = {
			"A": "#f55",
			"B": "#55f"
		}

		//destroy if asteroid leaves game limits
		newAsteroid.updateActions.push(function (self) {
			if((self.pos.y < 0 || self.pos.y > self.game.worldSize.y) || self.pos.x < 0) {
				console.log('out of bounds: ' + self.id);
				//spawn between 1 and 3 new asteroids
				for(var i = 0; i < self.game.helpers['RandomNumber'].getInt(1,2); i++) {
					if(self.game.register['asteroidCount'] > self.game.register['maxAsteroids']) 	{
						break;
					}
					var newRad = self.game.helpers['RandomNumber'].getInt(10,40);
					var newPosX = 640;
					var newPosY = self.game.helpers['RandomNumber'].getInt(1,480);
					var newVelX = self.game.helpers['RandomNumber'].getFloat(-6,-1);
					if(newPosY < 30) {
						newVelY = self.game.helpers['RandomNumber'].getFloat(0,1);
					} else if (newPosY > 450) {
						newVelY = self.game.helpers['RandomNumber'].getFloat(-1,0);
					} else {
						newVelY = self.game.helpers['RandomNumber'].getFloat(-1,1);
					}

					if(self.game.helpers['RandomNumber'].getInt(0,1)) {
						var type = "A";
					} else {
						var type = "B";
					}

					var nextAsteroid = self.game.objectFactory.get('asteroid', {
						startPosX: newPosX,
						startPosY: newPosY,
						velocityX: newVelX,
						velocityY: newVelY,
						radius: newRad
					});

					nextAsteroid.type = type;

					self.game.addGameObject(nextAsteroid);
					self.game.register['asteroidCollection'].objectList.push(nextAsteroid);
					self.game.register['asteroidCount']++;

				}
				//kell me now
				self.destroy();
				self.game.register['asteroidCount']--;
				self.game.register['asteroidCollection'].removeSecondaryObjectById(self.id);
			}

			newAsteroid.render = function (self) {
				self.renderObject = self.game.canvas.circle(self.pos.x,self.pos.y,self.rad);
				self.renderObject.attr('fill', self.colorTypes[self.type]);
				self.renderObject.attr('stroke', "#888");
				self.renderObject.attr('stroke-width',3);
			};
		});

		return newAsteroid;
		
	});

	game.objectFactory.addType('playerShip',function (params) {
		var playerShip = new simpleObject(game);
		playerShip.type = "playerShip";
		playerShip.shapeType = "rect";
		playerShip.pos = {
			x: params.startPosX,
			y: params.startPosY
		};

		playerShip.dim = {
			x: 30,
			y: 14
		};

		playerShip.vel = {
			x: 0,
			y: 0
		};

		playerShip.ammoType = "A";
		playerShip.hasFlipped = false;
		playerShip.colorTypes = {
			"A" : "#F55",
			"B" : "#55F"
		};

		playerShip.maxVel = params.maxVel;

		playerShip.render  = function (self) {
			self.renderObject = self.game.canvas.rect(self.pos.x,self.pos.y,self.dim.x,self.dim.y);
			self.renderObject.attr('stroke',self.colorTypes[self.ammoType]);
			self.renderObject.attr('stroke-width',"3px");
			self.renderObject.attr('fill','#F2F2F2');
		}

		playerShip.objectAttachments['gun'] = new function (parentObject) {
			this.parentObject = parentObject;
			this.cooldown = 0;
			this.maxCooldown = 10;
			this.muzzelVelocity = 20;
			this.firePoint = {
				x:15,
				y: 4
			}
			var self = this;
			
			this.attemptFire = function () {
				console.log('attempting to fire');
				if(self.cooldown == 0) {
					self.fire();
				}
			};

			this.fire = function() {
				var startOffset = self.parentObject.game.helpers['2DMath'].addTwoVectors(self.parentObject.pos,self.firePoint);
				var newBullet = self.parentObject.game.objectFactory.get('bullet',{
					startPosX: startOffset.x,
					startPosY: startOffset.y,
					vel: self.muzzelVelocity,
					type: self.parentObject.ammoType
				});
				self.parentObject.game.addGameObject(newBullet);
				self.parentObject.game.playSound("shoot");
				self.cooldown = self.maxCooldown;
			}

			this.reduceCooldown = function () {
				if(self.cooldown > 0) {
					self.cooldown -= 1;
				}
			}
		}(playerShip);

		playerShip.updateActions.push(function (self) {

			

			var actions = {
				"up" : false,
				"down" : false,
				"left" : false,
				"right" : false,
				"fire" : false,
				"switchMode" : false
			}

			if(self.game.keyboard['W']) {
				actions.up = true;
			}

			if(self.game.keyboard['S']) {
				actions.down = true;
			}

			if(self.game.keyboard['D']) {
				actions.right = true;
			}

			if(self.game.keyboard['A']) {
				actions.left = true;
			}

			if(self.game.keyboard['K']) {
				actions.fire = true;
			}

			if(self.game.keyboard['L']) {
				actions.switchMode = true;
			}

			if(typeof navigator.webkitGetGamepads != "undefined") {
				var gamePad = navigator.webkitGetGamepads()[0];
				if(typeof gamePad != "undefined") {
					if(gamePad.axes[0] > 0.3) {
						actions.right = true;
					}

					if(gamePad.axes[0] < -0.3) {
						actions.left = true;
					}

					if(gamePad.axes[1] < -0.3) {
						actions.up = true;
					}

					if(gamePad.axes[1] > 0.3) {
						actions.down = true;
					}

					if(gamePad.buttons[0]) {
						actions.fire = true;
					}

					if(gamePad.buttons[1]) {
						actions.switchMode = true;
					}
				}

			}

			//var gamePad = navigator.webkitGetGamepads()[0];

			if((actions.up) && self.pos.y > 0) {
				self.vel.y = -self.maxVel;
			} else if(actions.down && self.pos.y < (self.game.worldSize.y - self.dim.y)) {
				self.vel.y = self.maxVel;
			} else {
				self.vel.y = 0;
			}

			if(actions.left && self.pos.x > 0) {
				self.vel.x = -self.maxVel;
			} else if(actions.right && self.pos.x < (self.game.worldSize.x - self.dim.x)) {
				self.vel.x = self.maxVel;
			} else {
				self.vel.x = 0;
			}

			if(actions.fire) {
				self.objectAttachments['gun'].attemptFire();
			}

			if(actions.switchMode) {
		
				if(!self.hasFlipped) {
					if(self.ammoType == "A") {
						self.ammoType = "B";
					} else {
						self.ammoType = "A";
					}
					self.hasFlipped = true;
				}
				

			} else {
				self.hasFlipped = false;
			}

			self.objectAttachments['gun'].reduceCooldown();
		});

		var playerShipInteractions = new SingletonInteractionLayer(game);
		playerShipInteractions.primaryObject = playerShip;
		playerShipInteractions.secondaryObjectCollectionRef = "asteroidCollection";
		playerShipInteractions.interactions.push(function (self, primaryObject, secondaryObject) {
			//do collision check here
			//console.log(self);
			if(self.game.helpers['2DMath'].objectIntersect(primaryObject,secondaryObject)) {
				//end game
				self.game.playSound('killed');
				self.game.activeState = "gameOver";
				
			}
		});

		playerShip.updateActions.push(playerShipInteractions.check);

		return playerShip;

	});

	game.objectFactory.addType('bullet', function (params) {
		var bullet = new simpleObject(game);
		bullet.type = "bullet";
		bullet.shapeType = "rect";
		bullet.pos = {
			x:params.startPosX,
			y:params.startPosY
		};
		bullet.vel = {
			x: params.vel,
			y: 0
		};

		bullet.dim = {
			x: 3,
			y: 2
		};

		bullet.type = params.type;

		bullet.typeColors = {
			"A" : "#F44",
			"B" : "#44F"
		}

		bullet.updateActions.push(function(self) {
			if(self.pos.x > 640) {
				console.log('bullet out of range');
				self.destroy();
			}
		});

		
		var bulletCollisions = new SingletonInteractionLayer(game);
		bulletCollisions.primaryObject = bullet;
		bulletCollisions.secondaryObjectCollectionRef = "asteroidCollection";
		bulletCollisions.interactions.push(function (self,primaryObject,secondaryObject) {
			//console.log(primaryObject);
			if(self.game.helpers['2DMath'].objectIntersect(primaryObject,secondaryObject)) {
				self.game.playSound('hit');
				primaryObject.destroy();
				if(primaryObject.type == secondaryObject.type) {
					secondaryObject.rad -= 10;
				} else {
					secondaryObject.rad += 10
				}
				
				if(secondaryObject.rad < 7) {
					self.game.register['asteroidCollection'].removeSecondaryObjectById(secondaryObject.id);
					secondaryObject.destroy();
				}
			}
		});

		bullet.updateActions.push(bulletCollisions.check);

		bullet.render = function (self) {
			//console.log(self);
			self.renderObject = self.game.canvas.rect(self.pos.x,self.pos.y,self.dim.x,self.dim.y);
			self.renderObject.attr("stroke",self.typeColors[self.type]);
		};

		return bullet;
	});

	game.init();
	
	game.addState('gameOver');
	game.addStateAction('gameOver', function (self) {
		var gameOverMessage = "GAME OVER\n FINAL SCORE: " + self.register['totalScore'];
		gameOverMessage += "\n PRESS 'K' TO TRY AGAIN";
		var gameOverText = self.canvas.text(320,240,gameOverMessage);
		gameOverText.toFront();
		gameOverText.attr('font-size', '42px');
		gameOverText.attr('font-weight','bold');
		gameOverText.attr('fill', '#fff');
		gameOverText.attr('stroke','#000');
		gameOverText.attr('stroke-width','2px');
	});

	game.addState('start');
	game.addStateAction('start', function(self) {
		self.resetFrame();
		var gameOverText = self.canvas.text(320,240,"PRESS 'K' TO START");
		gameOverText.toFront();
		gameOverText.attr('font-size', '42px');
		gameOverText.attr('font-weight','bold');
		gameOverText.attr('fill', '#fff');
		gameOverText.attr('stroke','#000');
		gameOverText.attr('stroke-width','2px');

		if(self.keyboard['K']) {
			self.activeState = "main";
		}


	});
	game.activeState = "start";


	//game.loopSubscriptions.push(playerShipInteractions.check);

	//game.register['playerShipInteractions'] = playerShipInteractions;

	game.addState('paused');

	game.addStateAction('paused', function (self) {
		var gameOverText = game.canvas.text(320,240,"PAUSED");
			gameOverText.toFront();
			gameOverText.attr('font-size', '42px');
			gameOverText.attr('font-weight','bold');
			gameOverText.attr('fill', '#fff');
			gameOverText.attr('stroke','#000');
			gameOverText.attr('stroke-width','2px');
	});

	game.loopSubscriptions.push(function (gameObject) {
		if(gameObject.keyboard['P']) {
			if(!gameObject.register['pActive'] || gameObject.register['pActive'] == undefined) {
				gameObject.register['pActive'] = true;
				if(gameObject.activeState == "main") {
					console.log('STOPPING THE LOOP');
					//gameObject.stopLoop();
					gameObject.activeState = "paused";
				} else {
					console.log('STARTING THE LOOP');
					gameObject.activeState = "main";
				}
			}
			
		} else {
			gameObject.register['pActive'] = false
		}
	});

	game.loopSubscriptions.push(function (gameObject) {
			var textObject = gameObject.canvas.text(60,20,'asteroids: ' + gameObject.register['asteroidCount']);

	});

	game.addStateAction("main", function (gameObject) {
		gameObject.register['totalScore'] += gameObject.currentFrame;
		var textObject = gameObject.canvas.text(500,20, 'total score: ' + gameObject.register['totalScore']);
		textObject.attr("fill","#fff");
		textObject.attr('font-size', "18px");
		textObject.attr('text-align','right');

	});

	game.startLoop();

		
};

