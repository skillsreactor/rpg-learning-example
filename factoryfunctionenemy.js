function Orc( options ) {
  this.name = options.name || "Orc";
this.health = options.health || 80 - (Math.floor(Math.random() * 30));
this.attack = options.attack || 8 - (Math.floor(Math.random() * 3));
this.inPockets = options.inPockets || [];
}

function Troll( options){
  this.name = options.name || "Troll";
  this.health = options.health || 100 - (Math.floor(Math.random() * 40));
  this.attack = options.attack || 10 - (Math.floor(Math.random() * 2));
this.inPockets = options.inPockets || [];
}
​
function EnemyFactory() {}
​
​
// Enemey Factory makes Orcs by default.
EnemyFactory.prototype.enemyClass = Orc;
EnemyFactory.prototype.createEnemy = function ( options ) {
  return new this.enemyClass( options );
};
​
function OrcFactory () {}
OrcFactory.prototype = new EnemyFactory();
// Make the Orc Factories create orcs!
OrcFactory.prototype.enemyClass = Orc;
​
var orcFactory = new OrcFactory();
var orc = orcFactory.createEnemy({
attack: 6,
gold: 3
});
​
console.log( orc instanceof Orc );
console.log( orc );
​
function TrollFactory () {}
TrollFactory.prototype = new EnemyFactory();
// Make the Troll Factories create trolls!
TrollFactory.prototype.enemyClass = Troll;
​
var trollFactory = new TrollFactory();
​
var woodTroll = trollFactory.createEnemy({
health: 100,
gold: 15
});
​
var waterTroll = trollFactory.createEnemy( {
gold: 10,
inPockets: ["raw hide scraps"]
});
​
console.log(woodTroll instanceof Troll );
console.log( waterTroll instanceof Troll );
console.log( waterTroll );

module.exports = 