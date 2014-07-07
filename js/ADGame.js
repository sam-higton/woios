function simpleObject (game) {

	this.type = "simpleObject";
	this.shapeType = "circle";
	this.game = game;

	this.pos = {
		x: 0,
		y: 0
	};

	this.vel = {
		x: 0,
		y: 0
	};
	this.updateActions = [];
	this.rad = 5;
	this.dim = {
		x: 5,
		y: 5
	};
	this.collisionBoxDim = {
		x: 5,
		y: 5
	};

	this.collisionRad = 5;

	this.objectAttachments = [];
	this.id = IDKeeper.getId();

	this.renderObject = false;

	var self = this;

	/*this.isInScene = function (renderPos) {
		if(self.shapeType == "circle") {
			return (
				(renderPos.x - self.rad > 0 && renderPos.x + self.rad < self.game.viewPortSize.x) &&
				(renderPos.y - self.rad > 0 && renderPos.y + self.rad < self.game.viewPortSize.y) 
			 );
		} else if (self.shapeType == "rect") {
			var topLeft = self.pos;
			var bottomRight = self.game.helpers['2DMath'].addTwoVectors(self.pos,self.dim);
			return (
				(

				)

			);
		} else {
			console.log('err: unspecified shape type');
			return false
		}
	};*/

	this.getRenderPos = function () {
		self.game.helpers['2DMath'].subtractTwoVectors(self.pos,self.game.viewPortOffset);
	}

	this.updatePosition = function () {
		self.pos.x += self.vel.x;
		self.pos.y += self.vel.y;

		if(self.pos.x <= 0) {
			self.vel.x = 0;
		}
	}

	this.update = function (self) {
		self.updatePosition();
		for(var i in self.updateActions) {
			self.updateActions[i](self);
		}
	}

	this.preRender = function (self) {

	}

	this.render = function (self) {
		self.renderObject = self.game.canvas.circle(self.pos.x,self.pos.y,self.rad);
	}

	this.destroy = function () {
		self.game.removeGameObject(self.id);
	}

}

var IDKeeper = {
	currentId: 1,
	getId: function () {
		return this.currentId++;
	}
};

function RandomNumber() {
	this.getFloat = function (min, max) {
    	return Math.random() * (max - min) + min;
	};
	this.getInt = function (min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;	
	};
}

function TwoDimensionalMath () {

	var self = this;

	this.distanceBetweenTwoPoints = function (posA,posB) {
		var diffX = posA.x - posB.x;
		var diffY = posA.y - posB.y;
		var cSquared = (diffX * diffX) + (diffY * diffY);
		var distance = Math.sqrt(cSquared);
		return distance;
	};

	this.addTwoVectors = function (vectorA, vectorB) {
		var resultantVector = {};
		resultantVector.x = vectorA.x + vectorB.x;
		resultantVector.y = vectorA.y + vectorB.y;
		return resultantVector;
	};

	this.subtractTwoVectors = function (vectorA, vectorB) {
		var resultantVector = {};
		resultantVector.x = vectorA.x - vectorB.x;
		resultantVector.y = vectorA.y - vectorB.y;
		return resultantVector;
	};

	//todo: this needs to be made shape agnostic, as it currently only works
	//with  primaryObject == rect && secondaryObject == circle
	this.objectIntersect = function(primaryObject,secondaryObject) {
		if(primaryObject.renderObject && secondaryObject.renderObject) {
			topLeft = primaryObject.pos;
			bottomRight = self.addTwoVectors(primaryObject.pos,primaryObject.dim);
			var distanceTL = self.distanceBetweenTwoPoints(topLeft,secondaryObject.pos);
			var distanceBR = self.distanceBetweenTwoPoints(bottomRight,secondaryObject.pos);
			if(distanceTL < secondaryObject.rad || distanceBR < secondaryObject.rad) {
				return true;
			} else {
				return false;
			}
		} else {
			return false
		}
	};

}

function GameObjectCollection () {

	this.objectList = [];

	var self = this;

	this.removeSecondaryObjectById = function (id) {
		for(var i in self.objectList) {
			if(self.objectList[i].id == id) {
				self.objectList.splice(i,1);
				return true;
			}
		}
		return false;
	};

}

function gameObjectFactory (game) {

	this.game = game;
	this.typeList = [];
	var self = this;


	this.addType = function (name,newObject) {
		self.typeList[name] = newObject;
	}

	this.get = function (name, params) {
		return self.typeList[name](params);
	}

};

function CollisionLayer () {

	this.subscribedElements = [];
	var self = this;

	this.checkCollisions = function (gameObject) {
		for(var i in self.subscribedElements) {
			for(var j in self.subscribedElements) {
				if(i != j) {
					var el1 = self.subscribedElements[i];
					var el2 = self.subscribedElements[j];
					if(el1.pos.x == el2.pos.x && el1.pos.y == el2.pos.y) {
						console.log('COLLISION!');
					}
				}
			}
		}
	};

}

function SingletonInteractionLayer (game) {
	this.primaryObject = false;
	this.secondaryObjectCollectionRef = "";
	this.interactions = [];
	this.game = game;
	

	var self = this;

	this.check = function () {
		for(var i in self.game.register[self.secondaryObjectCollectionRef].objectList) {
			var secondaryObject = self.game.register[self.secondaryObjectCollectionRef].objectList[i];
			//console.log(secondaryObject);
			for(var j in self.interactions) {
				self.interactions[j](self,self.primaryObject,secondaryObject);
			}
		}
	};

}

function TotalInteractionLayer () {

}

function KeyListener(){
    var kb = {};
    var unicode_mapping = {};
    document.onkeydown = function(e){
        var unicode=e.charCode? e.charCode : e.keyCode
        var key = getKey(unicode);
        kb[key] = true;
       
    }

    document.onkeyup = function(e){
        var unicode=e.charCode? e.charCode : e.keyCode
        var key = getKey(unicode);
        delete kb[key];
        
    }

    function getKey(unicode){
        if(unicode_mapping[unicode]){
            var key = unicode_mapping[unicode];
        }else{
            var key= unicode_mapping[unicode] = String.fromCharCode(unicode);
        }
        return key;
    }
    return kb;
}

function ADGame (targetElementID) {

	this.canvas = false;
	this.loopSubscriptions = [];
	this.renderSubscriptions = [];
	this.initActions = [];
	this.postRenderActions = [];
	this.preRenderActions = [];
	this.activeState = "";
	this.stateActions = [];
	this.gameObjects = [];
	this.objectFactory = new gameObjectFactory(this);
	this.activeKeys = [];
	this.register = [];
	this.helpers = [];
	this.sounds = [];
	this.keyboard = new KeyListener();
	this.loopTime = 20;//ms
	this.loopActive = false;
	this.currentFrame = 0;
	this.backgroundColor = "#333";
	this.gameOver = false;
	this.pos = {
		x: 10,
		y: 40
	};

	this.viewPortSize = {
		x: 640,
		y: 480
	};

	this.worldSize = {
		x: 640,
		y: 480
	};

	this.viewPortOffset = {
		x: 0,
		y: 0
	}

	var self = this;

	this.init =  function () {
		//console.log(this.pos.y);
		var gameElement = document.getElementById(targetElementID);
		this.canvas = Raphael(gameElement,this.viewPortSize.x,this.viewPortSize.y);
		//this.canvas.attr('fill',this.backgroundColor);

		self.addState("main");
		self.activeState = "main";
		self.addStateAction("main",function (self) {
			for(var i in self.gameObjects) {
				self.gameObjects[i].update(self.gameObjects[i]);
			}
		});

		self.addStateAction("main", function (self) {
			self.canvas.clear();
			var background = self.canvas.rect(0,0,self.viewPortSize.x, self.viewPortSize.y);
			background.attr('fill',self.backgroundColor);
			for(var i in self.gameObjects) {				
				self.gameObjects[i].render(self.gameObjects[i]);
			}
		});

		for(var i in self.initActions) {
			self.initActions[i](self);
		}
	};

	this.addSound = function (name, filepath) {
		var newSound = new buzz.sound(filepath);
		//newSound.setSpeed(2);
		self.sounds[name] = newSound;
	}

	this.playSound = function (name) {
		self.sounds[name].play();
	}

	this.addState = function (stateTypeName) {
		this.stateActions[stateTypeName] = [];
	}

	this.addStateAction = function (state, action) {
		this.stateActions[state].push(action);
	}

	this.loop = function () {

		this.currentFrame += 1;

		//clear screen
		

		//run through all pre-render actions
		for(var i in self.preRenderActions) {
			self.preRenderActions[i](self);
		};

		//run through current state actions
		for(var i in self.stateActions[self.activeState]) {
			self.stateActions[self.activeState][i](self);
		}

		//loop through all loop subscriptions
		for(var i in self.loopSubscriptions) {
			self.loopSubscriptions[i](self);
		}

		//run through all post render actions
		for(var i in self.postRenderActions) {
			self.postRenderActions[i](self);
		}

		//if active, initiate next loop sequence
		if(this.loopActive) {
			setTimeout(function () { self.loop(); }, this.loopTime);
		}
		
	};
	this.startLoop = function () {
		this.loopActive = true;
		this.loop();
	},
	this.stopLoop =  function () {
		this.loopActive = false;
	}

	this.removeGameObject = function (objectId) {
		for(var i in self.gameObjects) {
			if(self.gameObjects[i].id == objectId) {
				self.gameObjects.splice(i,1);
				return true;
			}
		}
		return false;
	};

	this.getObjectById = function (objectId) {
		for(var i in self.gameObjects) {
			if(self.gameObjects[i].id == objectId) {
				return self.gameObjects[i];
			}
		}
		return false;
	};

	this.addGameObject = function (gameObject) {
		self.gameObjects.push(gameObject);
	}
}