//mithril stuff
var highScores = {};
highScores.highScore = function (data) {
	this.name = m.prop(data.name);
	this.score = m.prop(data.score);
}
highScores.highScoreList = Array;

highScores.controller = function () {
	this.list = new highScores.highScoreList();
	this.name = m.prop("");
	this.score = m.prop(0);
	this.addScore = function (name, score) {
		if(name() && score()) {
			this.list.push(new highScores.highScore({
				name: name(),
				score: score()
			}));
		}
	}
}

var ctrl = new highScores.controller();

highScores.view = function (ctrl) {
	return m('table#scoreTable',[
			m('tr', [
				m('th', "position"),
				m('th', "name"),
				m('th', "score")
			])
		])
}

m.render(document.getElementById('scoreholder'),highScores.view(ctrl));