

$(function() {
	
	var WayFinding = function() {
		var allNodes = this.allNodes;
		for(var i = 0; i < 10; i ++) {
			for(var j = 0; j < 10; j ++) {
				var el = $('<li />');
				allNodes.push(new Node({
					el: el,
					x: j,
					y: i
				}));
				$('.container').append(el);
			}
		}
		
		this.setStart(6);
		this.setEnd(76);
		
		this.setRoadblock([32,33,34,35,36,37,27,17,7,42, 52,62, 72,82,83,84,85,86,87,77,67, 57,56,55,54]);
	};
	WayFinding.prototype = {
		constructor: WayFinding,
		allNodes: [],	// 存放所有的节点
		openList: [],	// 开放列表
		closeList: [],	// 闭合列表
		setStart: function(index) {		// 设置始点node
			var proto = this.constructor.prototype;
			var startNode = proto.startNode = proto.currentNode = this.allNodes[index];
			startNode.el.addClass('start').html('A');
			startNode.type = 'start';
			startNode.g = 0;
			//startNode.h = startNode.getH();
		},
		setEnd: function(index) {		// 设置终点node
			var proto = this.constructor.prototype;
			proto.endNode = this.allNodes[index];
			proto.endNode.el.addClass('end').html('B');
			proto.endNode.type = 'end';
		},
		setRoadblock: function(arr) {	// 设置障碍物
			arr.forEach(function(n) {
				this.allNodes[n].el.addClass('npc');
				this.allNodes[n].type = 'roadblock';
			}.bind(this));
		},
		getNodeByPosition: function(x, y) {
			return this.allNodes.filter(function(node) {
				return node.x == x && node.y == y;
			})[0];
		},
		start: function() {
			this.checkNode(this.startNode);
		},
		checkNode: function(node) {
			
			this.closeList.push(node);
			if(node.getH() == 0) {
				this.showLine();
				return;
			}
			
			if(!/start|roadblock|end/.test(node.type)) {
				node.el.css({
					background: '#6d6d1e'
				});	
			}
			
				// 获取始点邻居
			//this.openList.push(node);
			
			var neighbors = node.getNeighbors();
		
			neighbors.forEach(function(n, i) {
				if(n.x == node.x || n.y == node.y) {	// 上下，左右，距离为1, 故g增1
					n.g = node.g + 1;
				} else {								// 斜方，距离为1.4,故g增1.4
					n.g = node.g + 1.4;
				}
				if(!/start|roadblock|end/.test(n.type)) {
					n.showInfo(n.g, n.getH(), n.getF());
				}
				this.openList.push(n);
				n.parentNode = node;
			}.bind(this));
			
			this.openList.forEach(function(n, i) {
				if(n == node) {
					this.openList.splice(i, 1);
					return false;
				}
			}.bind(this));
			
			// 获取F值最小的节点
			var smallestF = this.openList.reduce(function(node, n, i) {
				return node.f > n.f ? n : node;
			}, {f:Number.MAX_VALUE});
			
			console.log(smallestF);
			
			this.checkNode(smallestF);
		},
		showLine: function() {
			var node = this.endNode;
			var timer = setInterval(function(){
				node = node.parentNode;
				if(!/start|roadblock|end/.test(node.type)) {
					node.el.css({
						background: '#1f1'
					});
				}
				node || clearInterval(timer);				
			}, 100);
			
			return;
			
			while(node = node.parentNode) {
				console.log(node);
				if(!/start|roadblock|end/.test(node.type)) {
					node.el.css({
						background: '#1f1'
					});
				}
			}
		}
	};
	
	var Node = function(opts) {
		$.extend(this, opts);
		this.type = 'space';	// start:始点|end:终点|roadblock:路障|space:空地
		this.f = this.g = this.h = 0;
	}
	Node.prototype = {
		constructor: Node,
		getNeighbors: function() {
			var proto = WayFinding.prototype;
			var allNodes = proto.allNodes;
			var openList = proto.openList;
			var closeList = proto.closeList;
			var getNode = proto.getNodeByPosition.bind(WayFinding.prototype);
			
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
				var node = getNode(this.x + p[k][0], this.y + p[k][1]);
				if(node) {
					if(/start|roadblock/.test(node.type)) {	// 忽略
						console.log('start|roadblock忽略');
					} else if(checkIn(closeList, node)) {
						console.log('closeList忽略');
					} else if(checkIn(openList, node)) {
						console.log('openList　忽略');
					} else {
						console.log('其他');
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
			return this.h = Math.abs(this.x - endNode.x) + Math.abs(this.y - endNode.y);
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
		showInfo: function(g, h, f) {
			this.el.html([
				'<span class="g">' + g + '</span>',
				'<span class="h">' + h + '</span>',
				'<span class="f">' + f + '</span>',
			].join('')).css({
				background: '#ee0'
			});
		},
		
	};
	
	var w = new WayFinding();
	
	setTimeout(function() {
		w.start();
	}, 1000);
	
});

