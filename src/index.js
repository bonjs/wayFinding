
var WayFinding = function(opts) {
	this.rows = opts.rows || 10;
	this.cols = opts.cols || 10;
	
	this.isShowInfo = opts.isShowInfo !== false;

	var allNodes = this.allNodes;
	for(var i = 0; i < this.rows; i ++) {
		var a = []
		for(var j = 0; j < this.cols; j ++) {
			var el = $('<li />');
			a.push(new Node({
				el: el,
				x: j,
				y: i
			}));
			$('.container').append(el);
		}
		allNodes.push(a);
	}
	
	this.setStart(opts.start[0], opts.start[1]);
	this.setEnd(opts.end[0], opts.end[1]);
	
	this.setRoadblock(opts.roadblock);
};

WayFinding.prototype = {
	constructor: WayFinding,
	allNodes: [],	// 存放所有的节点
	openList: [],	// 开放列表
	closeList: [],	// 闭合列表
	setStart: function(x, y) {		// 设置始点node
		var proto = this.constructor.prototype;
		var startNode = proto.startNode = proto.currentNode = this.allNodes[y][x]
		startNode.el.addClass('start').html('A');
		startNode.type = 'start';
		startNode.g = 0;
		//startNode.h = startNode.getH();
	},
	setEnd: function(x, y) {		// 设置终点node
		var proto = this.constructor.prototype;
		proto.endNode = this.allNodes[y][x]
		proto.endNode.el.addClass('end').html('B');
		proto.endNode.type = 'end';
	},
	setRoadblock: function(arr) {	// 设置障碍物
		arr.forEach(function(n) {
			var node = this.allNodes[n[1]][n[0]];
			node.el.addClass('npc');
			node.type = 'roadblock';
		}.bind(this));
	},
	
	start: function() {
		this.checkNode(this.startNode);
	},
	checkNode: function(node) {
		
		node.el.removeClass('smallest');
		
		this.closeList.push(node);
		if(node.getH() == 0) {
			this.showLine();
			return;
		}
		
		if(!/start|roadblock|end/.test(node.type)) {
			node.el.css({
				//background: '#6d6d1e'
			});	
		}
		
		var neighbors = node.getNeighbors(this.isShowInfo);
	
		Array.prototype.push.apply(this.openList, neighbors);
		
		this.openList.forEach(function(n, i) {
			if(n == node) {
				this.openList.splice(i, 1);
				return false;
			}
		}.bind(this));
		
		// 获取F值最小的节点
		var smallestF = this.openList.reduce(function(node, n, i) {
			return node.f > n.f ? n : node;
		}, {
			f: Number.MAX_VALUE
		});
		
		smallestF.el.addClass('smallest');
		
		console.log(smallestF);
		
		//setTimeout(function() {
			this.checkNode(smallestF);	
		//}.bind(this), 0);
		
	},
	showLine: function() {
		
		var arr = [];
		var node = this.endNode;
		while(node = node.parentNode) {
			arr.push(node);
		}
		
		var timer = setInterval(function(){
			node = arr.pop();
			if(!node) {
				clearInterval(timer);	
				return;
			}

			if(!/start|roadblock|end/.test(node.type)) {
				node.el.css({
					background: '#1f1'
				});
			}			
		}, 0);
	},
	
	showLine2: function() {
		var node = this.endNode;
		var timer = setInterval(function(){

			node = node.parentNode;
			
			if(!node) {
				clearInterval(timer);	
				return;
			}

			if(!/start|roadblock|end/.test(node.type)) {
				node.el.css({
					background: '#1f1'
				});
			}			
		}, 100);
	}
};

var Node = function(opts) {
	$.extend(this, opts);
	this.type = 'space';	// start:始点|end:终点|roadblock:路障|space:空地
	this.f = this.g = this.h = 0;
}
Node.prototype = {
	constructor: Node,
	getNeighbors: function(isShowInfo) {
		var proto = WayFinding.prototype;
		var allNodes = proto.allNodes;
		var openList = proto.openList;
		var closeList = proto.closeList;
		
		var arr = [];
		
		var p = {
			topLeft		: [-1, -1],
			topCenter	: [0, -1],
			topRight	: [1, -1],
			centerLeft	: [-1, 0],
			centerRight	: [1, 0],
			bottomLeft	: [-1, 1],
			bottomCenter: [0, 1],
			bottomRight	: [1, 1]
		}
		
		for(var k in p) {
			var node = allNodes[this.y + p[k][0]] ? allNodes[this.y + p[k][0]][this.x + p[k][1]] : null;
			if(node) {
				if(/start|roadblock/.test(node.type)) {	// 忽略
					//console.log('start|roadblock忽略');
				} else if(checkIn(closeList, node)) {
					//console.log('closeList忽略');
				} else if(checkIn(openList, node)) {
					console.log('openList');
					/**
					如果邻居已经在 Open List 中（即该邻居已有父节点），
					计算从当前节点移动到该邻居是否能使其得到更小的 G 值。
					如果能，则把该邻居的父节点重设为当前节点，并更新其 G 和 F 值。					
					*/
					var gNew;
					if(this.x == node.x || this.y == node.y) {
						gNew = toFixed(this.g + 1);
					} else {
						gNew = toFixed(this.g + 1.4);
					}
					if(gNew < node.g) {
						node.g = gNew;
						node.f = node.getF();
						node.parentNode = this;
					}
				} else {
					console.log('其他');
					
					if(this.x == node.x || this.y == node.y) {	// 上下，左右，距离为1, 故g增1
						node.g = toFixed(this.g + 1);
					} else {								// 斜方，距离为1.4,故g增1.4
						node.g = toFixed(this.g + 1.4);
					}
					
					node.h = node.getH();
					node.f = node.getF();
					node.parentNode = this;
					if(!/start|roadblock|end/.test(node.type)) {
						isShowInfo && node.showInfo();
					}
					
					arr.push(node);
				}
			}
		}
		
		return arr;
		
		function checkIn(list, node) {
			return !!list.filter(function(n, i) {
				return n == node;
			}).length;
		}
	},
	
	getH: function() {	// 获取距终点的距离
		var endNode = WayFinding.prototype.endNode;
		return this.h = toFixed(Math.abs(this.x - endNode.x) + Math.abs(this.y - endNode.y));
	},
	
	getG2222: function() {
		
		var startNode = WayFinding.prototype.startNode;
		var x1 = Math.abs(this.x - startNode.x);
		var y1 = Math.abs(this.y - startNode.y);
		
		var smaller = Math.min(x1, y1);
		var bigger 	= Math.max(x1, y1);
		
		return this.g = smaller * 1.4 + (bigger - smaller);
	},
	getF: function() {
		return this.f = this.getH() + this.g;
	},
	showInfo: function() {
		this.el.html([
			'<span class="g">' + this.g + '</span>',
			'<span class="h">' + this.h + '</span>',
			'<span class="f">' + this.f + '</span>',
		].join('')).css({
			background: '#ee0'
		});
	},
	
};



function toFixed(f) {
	return f;
}
