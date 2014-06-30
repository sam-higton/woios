



window.onload = function () {
	var game = new ADGame();
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
			"A": "#fee",
			"B": "#eef"
		}

		//destroy if asteroid leaves game limits
		newAsteroid.updateActions.push(function (self) {
			if((self.pos.y < 0 || self.pos.y > self.game.dimensions.y) || self.pos.x < 0) {
				console.log('out of bounds: ' + self.id);
				//spawn between 1 and 3 new asteroids
				for(var i = 0; i < self.game.helpers['RandomNumber'].getInt(1,3); i++) {
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

		playerShip.pos = {
			x: params.startPosX,
			y: params.startPosY
		}

		playerShip.dim = {
			x: 15,
			y: 7
		}

		playerShip.vel = {
			x: 0,
			y: 0
		}

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
				self.cooldown = self.maxCooldown;
			}

			this.reduceCooldown = function () {
				if(self.cooldown > 0) {
					self.cooldown -= 1;
				}
			}
		}(playerShip);

		playerShip.updateActions.push(function (self) {
			if(self.game.keyboard['W']) {
				self.vel.y = -self.maxVel;
			} else if(self.game.keyboard['S']) {
				self.vel.y = self.maxVel;
			} else {
				self.vel.y = 0;
			}

			if(self.game.keyboard['A']) {
				self.vel.x = -self.maxVel;
			} else if(self.game.keyboard['D']) {
				self.vel.x = self.maxVel;
			} else {
				self.vel.x = 0;
			}

			if(self.game.keyboard['K']) {
				self.objectAttachments['gun'].attemptFire();
			}

			if(self.game.keyboard['L']) {
		
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
				
				var gameOverMessage = "GAME OVER\n FINAL SCORE: " + self.game.register['totalScore'];
				var gameOverText = self.game.canvas.text(320,240,gameOverMessage);
				self.game.stopLoop();
			}
		});

		playerShip.updateActions.push(playerShipInteractions.check);

		return playerShip;

	});

	game.objectFactory.addType('bullet', function (params) {
		var bullet = new simpleObject(game);
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
				
				primaryObject.destroy();
				if(primaryObject.type == secondaryObject.type) {
					secondaryObject.rad -= 10;
				} else {
					secondaryObject.rad += 10
				}
				
				if(secondaryObject.rad < 7) {
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
	

	//game.loopSubscriptions.push(playerShipInteractions.check);

	//game.register['playerShipInteractions'] = playerShipInteractions;

	game.loopSubscriptions.push(function (gameObject) {
		if(gameObject.keyboard['P']) {
			if(!gameObject.register['pActive'] || gameObject.register['pActive'] == undefined) {
				gameObject.register['pActive'] = true;
				if(gameObject.loopActive) {
					console.log('STOPPING THE LOOP');
					gameObject.stopLoop();
				} else {
					console.log('STARTING THE LOOP');
					gameObject.startLoop();
				}
			}
			
		} else {
			gameObject.register['pActive'] = false
		}
	});

	game.loopSubscriptions.push(function (gameObject) {
			var textObject = gameObject.canvas.text(60,20,'asteroids: ' + gameObject.register['asteroidCount']);

	});

	game.loopSubscriptions.push(function (gameObject) {
		gameObject.register['totalScore'] += gameObject.currentFrame;
		var textObject = gameObject.canvas.text(580,20, 'total score: ' + gameObject.register['totalScore']);
	});

	game.startLoop();

	document.getElementById('startButton').addEventListener("click",function () {
		game.startLoop();
	});

		
};
