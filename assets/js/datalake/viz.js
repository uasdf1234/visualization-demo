var VMail;
(function (VMail) {
    (function (Viz) {
        var NetworkViz = (function () {
            function NetworkViz(settings, for_guestbook) {
                var _this = this;
                this.LABEL_THRESHOLD = 1;
                this.clustercolors = true;
                this.neighbors_num = null;
                this.drag_node = null;
                this.recolorTimer = null;
                /*private baseNodeColor = "#ffffff";
                private baseLabelColor = "#c2c2c2";
                private baseStrokeColor = "#fff";
                private baseStrokeOpacity = 0.1;*/
                this.baseNodeColor = "#000";
                this.baseLabelColor = "#111";
                this.baseStrokeColor = "#000";
                this.baseStrokeOpacity = 0.3;
                this.baseNodeStrokeColor = "#555";
                this.highlightedNodeColor = "#222";
                this.moveContact = function (d) {
                    d.fixed = true;
                    var r = this.settings.nodeSizeFunc(d.attr);
                    var newx = d3.event.x + d.x;
                    var newy = d3.event.y + d.y;
                    newx = Math.max(r, Math.min(this.settings.size.width - r, newx));
                    newy = Math.max(r, Math.min(this.settings.size.height - r - 17, newy));
                    d.x = newx;
                    d.y = newy;
                    d.px = newx;
                    d.py = newy;
                    this.forceTick();
                    var g = d3.select(d.parentNode);
                    g.attr("transform", function (d) {
                        return "translate(" + newx + "," + newy + ")";
                    });
                };
                this.centeredNode = null;
                this.settings = settings;
                this.svg = d3.select(settings.svgHolder);
                this.svg.attr("pointer-events", "all");
                this.svg.attr("width", this.settings.size.width);
                this.svg.attr("height", this.settings.size.height);
                this.svg.on("click", function () {
                    if(this.glowing)
                        return false;
                    this.glowing = true;
                    _this.undoCenterNode();
                    _this.settings.clickHandler(null);
                    this.glowing = false;
                });
                this.defs = this.svg.append("svg:defs");
                this.defs.append("svg:filter").attr("id", "blur").append("svg:feGaussianBlur").attr("stdDeviation", 1);

                this.linksG = this.svg.append("g").attr("id", "links");
                this.nodesG = this.svg.append("g").attr("id", "nodes");
                this.glowing = false;
                this.labelsVisible = true;
                this.guestbook = for_guestbook;

                if (!this.guestbook) {
                    //this.svg.append("svg:image").attr("width", 250).attr("height", 35).attr("xlink:href", "static/images/basic-url-logo.png").attr("x", 10).attr("y", 18).attr("opacity", 0.8);
                }
            }
            NetworkViz.prototype.updateNetwork = function (graph) {
                var _this = this;
                var centeredNode = null;
                this.filteredNodes = graph.nodes.filter(function (node) {
                    return !node.skip;
                });
                var idToNode2 = {};

                this.filteredNodes.forEach(function (node) {
                    if (_this.idToNode !== undefined && node.id in _this.idToNode) {
                        var oldNode = _this.idToNode[node.id];
                        if (oldNode === _this.centeredNode) {
                            centeredNode = node;
                        }
                        node['x'] = oldNode['x'];
                        node['px'] = oldNode['px'];
                        node['y'] = oldNode['y'];
                        node['py'] = oldNode['py'];
                    }
                    idToNode2[node.id] = node;
                });
                this.idToNode = idToNode2;
                this.filteredLinks = graph.links.filter(function (link) {
                    return !link.skip && !link.source.skip && !link.target.skip;
                });
                if (centeredNode) {
                    this.draw(false);
                } else {
                    this.undoCenterNode();
                    this.draw(true);
                }

                //redo centering after network has been updated
                if (centeredNode) {
                    //console.log("previously centered node ", centeredNode.attr.contact.name)
                    this.centerNode(centeredNode);
                }
            };

            NetworkViz.prototype.rescale = function () {
                var trans = d3.event.translate;
                var scale = d3.event.scale;
                this.svg.attr("transform", "translate(" + trans + ")" + " scale(" + scale + ")");
            };

            NetworkViz.prototype.resume = function () {
                //this.force.stop();
                this.force.alpha(.15);
            };

            NetworkViz.prototype.draw = function (live) {
                var _this = this;
                if (live === undefined) {
                    live = this.settings.forceParameters.live;
                }
                if (this.force !== undefined) {
                    this.force.stop();
                } else {
                    this.force = d3.layout.force();
                }
                this.force.size([this.settings.size.width, this.settings.size.height]);
                this.force.charge(this.settings.forceParameters.charge);
                this.force.linkDistance(this.settings.forceParameters.linkDistance);
                this.force.gravity(this.settings.forceParameters.gravity);
                this.force.friction(this.settings.forceParameters.friction);
                this.force.nodes(this.filteredNodes);
                this.force.links(this.filteredLinks);
                if (live) {
                    this.force.on("tick", function () {
                        return _this.forceTick();
                    });
                }

                this.redraw();

                this.force.start();
                if (!live) {
                    for (var i = 0; i < 150; ++i) {
                        this.force.tick();
                    }
                    this.force.stop();
                }
            };

            NetworkViz.prototype.redraw = function () {
                this.drawNodes();
                this.drawLinks();
            };

            NetworkViz.prototype.forceTick = function () {
                var _this = this;
                this.nodeBind.attr("transform", function (node) {
                    var r = _this.settings.nodeSizeFunc(node.attr);

                    node.x = Math.max(r, Math.min(_this.settings.size.width - r, node.x));
                    node.y = Math.max(r, Math.min(_this.settings.size.height - r - 17, node.y));
                    return "translate(" + node.x + "," + node.y + ")";
                });

                this.linkBind.attr("transform",function(link){
                    var x = (link.source.x + link.target.x)/2;
                    var y = (link.source.y + link.target.y)/2;
                    return "translate(" + x + "," + y + ")";
                });
                /*this.linksG.selectAll(".linetext").attr("x",function(link){
                    return (link.source.x + link.target.x)/2;
                }).attr("y",function(link){
                    return (link.source.y + link.target.y)/2;
                }).transition().duration(5000);*/
                this.linkBind.selectAll(".line").attr("x1", function (link) {
                    return (link.source.x - link.target.x)/2;
                }).attr("y1", function (link) {
                    return (link.source.y - link.target.y)/2;
                }).attr("x2", function (link) {
                    return (link.target.x - link.source.x)/2;
                }).attr("y2", function (link) {
                    return (link.target.y - link.source.y)/2;
                });
/*
                this.linkBind.selectAll(".status").attr("cx",function(link){
                    return (link.source.x - link.target.x)/2;
                }).attr("cy",function(link){
                    return (link.source.y - link.target.y)/2;
                }).attr("class","animation");

                this.linkBind.selectAll(".status").attr("cx",function(link){
                    return (link.target.x - link.source.x)/2;
                }).attr("cy",function(link){
                    return (link.target.y - link.source.y)/2;
                });
                
                */
                this.linkBind.selectAll(".status").attr("transform",function(link){
                    var x = (link.target.x - link.source.x)/2;
                    var y = (link.target.y - link.source.y)/2;
                    return "translate(" + x + "," + y + ")";
                });
            };

            NetworkViz.prototype.clickNode = function (node) {
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                // var e = document.createEvent('UIEvents');
                // e.initUIEvent('click', true, true, window, 1);
                var e = new UIEvent("click");
                selectedNode.node().dispatchEvent(e);
            };

            NetworkViz.prototype.mouseoverNode = function (node) {
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });

                //change the looks of the circle
                selectedNode.select("circle").transition().attr("stroke-width", 3.0).attr("stroke", "#000").attr("fill", this.highlightedNodeColor);

                //.attr("filter", (d) => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
                //change the looks of the text
                selectedNode.select("text").transition().attr("visibility", "visible").style("font-size", "20px").text(this.settings.nodeLabelFuncHover(node.attr));

                this.linkBind.select(".line").style("stroke-opacity", 0).filter(function (link, i) {
                    return link.source === node || link.target === node;
                }).style("stroke-opacity", 0.5);
            };

            NetworkViz.prototype.mouseoutNode = function (node) {
                var _this = this;
                //console.log("mouseout:" + node.attr.contact.name);
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });

                selectedNode.select("circle").transition().attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 0.8).attr("stroke-width", 1.0).attr("opacity", "1.0").attr("fill", function (d) {
                    if (_this.clustercolors)
                        return _this.settings.colorFunc(d.attr);
                    else
                        return _this.baseNodeColor;
                });

                selectedNode.select("text").transition().text(this.settings.nodeLabelFunc(node.attr)).style("font-size", "12px").attr("visibility", function (d) {
                    if (_this.centeredNode === null && _this.settings.nodeSizeFunc(d.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                });
                this.linkBind.select(".line").style("stroke-opacity", this.baseStrokeOpacity);
            };

            NetworkViz.prototype.undoCenterNode = function () {
                var _this = this;
                if (d3.event) {
                    d3.event.stopPropagation();
                }

                // don't undo if there is noone centered
                if (this.centeredNode === null) {
                    return;
                }

                //un-highlight the node if uncentering
                this.mouseoutNode(this.centeredNode);

                var centerNode = this.centeredNode;
                // find the neighbors of the centered node (this takes o(1) time given the underlying graph structure)
                var neighbors = {};
                centerNode.links.forEach(function (link) {
                    if (link.skip || link.source.skip || link.target.skip) {
                        return;
                    }
                    if (link.source !== centerNode)
                        neighbors[link.source.id] = link.source;
                    if (link.target !== centerNode)
                        neighbors[link.target.id] = link.target;
                });
                // === ANIMATION CODE ===
                var centeringNodes = this.nodeBind.style("opacity", 1.0).filter(function (d2, i) {
                    return d2 === centerNode || d2.id in neighbors;
                });

                centeringNodes.transition().attr("transform", function (d, i) {
                    d.x = d.px;
                    d.y = d.py;
                    return "translate(" + d.x + "," + d.y + ")";
                });

                //return the original styles of the cirles of the centering nodes
                centeringNodes.select("circle").attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 0.8).attr("stroke-width", 1.0).attr("fill", function (node) {
                    if (_this.clustercolors)
                        return _this.settings.colorFunc(node.attr);
                    else
                        return _this.baseNodeColor;
                });

                //return the original style and position of the text of the centering nodes
                centeringNodes.select("text").attr("text-anchor", "middle").attr("dy", function (node) {
                    return _this.settings.nodeSizeFunc(node.attr) + 15;
                }).attr("dx", '0em').attr("transform", null).attr("visibility", function (node) {
                    if (_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                });
                var flink = this.linkBind.style("opacity", 1.0).filter(function (link, i) {
                    return link.source === centerNode || link.target === centerNode;
                }).transition();



                flink.attr("transform",function(link){
                    var x = (link.source.x + link.target.x)/2;
                    var y = (link.source.y + link.target.y)/2;
                    return "translate(" + x + "," + y + ")";
                });
                /*this.linksG.selectAll(".linetext").attr("x",function(link){
                    return (link.source.x + link.target.x)/2;
                }).attr("y",function(link){
                    return (link.source.y + link.target.y)/2;
                });*/
                flink.selectAll(".line").attr("x1", function (link) {
                    console.log((link.source.x - link.target.x)/2)
                    return (link.source.x - link.target.x)/2;
                }).attr("y1", function (link) {
                    return (link.source.y - link.target.y)/2;
                }).attr("x2", function (link) {
                    return (link.target.x - link.source.x)/2;
                }).attr("y2", function (link) {
                    return (link.target.y - link.source.y)/2;
                });

                flink.selectAll(".linetext").attr("opacity",0);
                //uncenter the node
                this.centeredNode = null;
            };

            NetworkViz.prototype.centerNode = function (centerNode) {
                var _this = this;
                // stop any animation before animating the "centering"
                this.force.stop();

                //un-highlight the node
                //this.mouseoutNode(centerNode);
                if (this.centeredNode === centerNode) {
                    this.undoCenterNode();
                    return;
                }
                this.undoCenterNode();

                // remember the centered node
                this.centeredNode = centerNode;

                // store all the neighbors of the centered node (neighbors are found in O(1) time from the graph data structure)
                var neighbors = {};
                var nneighbors = 0;
                centerNode.links.forEach(function (link) {
                    if (link.skip || link.source.skip || link.target.skip) {
                        return;
                    } else {
                        nneighbors += 1;
                    }
                    if (link.source !== centerNode)
                        neighbors[link.source.id] = link.source;
                    if (link.target !== centerNode)
                        neighbors[link.target.id] = link.target;
                });

                // radius of the "centering" circle
                var radius = parseInt(this.settings.size.height / 3);
                var angle = (2 * Math.PI) / nneighbors;

                //  ===COORDINATES COMPUTATION CODE===
                //  ---center node---
                //store old coordinates. Need them when we undo the centering to return objects to their original position.
                centerNode.px = centerNode.x;
                centerNode.py = centerNode.y;
                centerNode.x = this.settings.size.width / 2.0;
                centerNode.y = this.settings.size.height / 2.0;

                //  ---neighboring nodes---
                var idx = 0;
                var neighbors_array = [];
                for (var id in neighbors) {
                    neighbors_array.push(neighbors[id]);
                }
                neighbors_array.sort(function (a, b) {
                    return a.attr.color - b.attr.color;
                });

                for (var id in neighbors_array) {
                    var node = neighbors_array[id];
                    node.px = node.x;
                    node.py = node.y;
                    node.x = centerNode.x + radius * Math.cos(idx * angle);
                    node.y = centerNode.y + radius * Math.sin(idx * angle);
                    node.angle = idx * angle;
                    idx += 1;
                }
                this.neighbors_num = neighbors_array.length - 1;

                // === ANIMATION CODE ===
                // ---neighboring nodes---
                this.nodeBind.style("opacity", 0.05).filter(function (d2, i) {
                    return d2.id in neighbors;
                }).style("opacity", 1.0).transition().attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).select("text").attr("text-anchor", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "end";
                    }
                    return "start";
                }).attr("dx", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return -_this.settings.nodeSizeFunc(d.attr) - 10;
                    }
                    return _this.settings.nodeSizeFunc(d.attr) + 10;
                }).attr("dy", function (d, i) {
                    return 5;
                }).attr("transform", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "rotate(" + ang + " 0 0) scale(-1,-1)";
                    }
                    return "rotate(" + ang + " 0 0)";
                }).attr("visibility", null);

                //---center node---
                var tmp = this.nodeBind.filter(function (d2, i) {
                    return d2 === centerNode;
                });

                //make the center node fully vizible
                tmp.select("text").attr("visibility", null);
                tmp.style("opacity", 1.0).transition().attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).select("circle").attr("stroke-width", 3.0).attr("stroke", "#000").attr("fill", this.highlightedNodeColor);

                //un-highlight the node
                this.mouseoutNode(centerNode);

                //---links---
                var linkf = this.linkBind.style("opacity", 0).filter(function (link, i) {
                    return link.source === centerNode || link.target === centerNode;
                }).style("opacity", 1.0).transition();


                linkf.attr("transform",function(link){
                    var x = (link.source.x + link.target.x)/2;
                    var y = (link.source.y + link.target.y)/2;
                    return "translate(" + x + "," + y + ")";
                });
                /*this.linksG.selectAll(".linetext").attr("x",function(link){
                    return (link.source.x + link.target.x)/2;
                }).attr("y",function(link){
                    return (link.source.y + link.target.y)/2;
                });*/
                linkf.selectAll(".line").attr("x1", function (link) {
                    return (link.source.x - link.target.x)/2;
                }).attr("y1", function (link) {
                    return (link.source.y - link.target.y)/2;
                }).attr("x2", function (link) {
                    return (link.target.x - link.source.x)/2;
                }).attr("y2", function (link) {
                    return (link.target.y - link.source.y)/2;
                });

                linkf.selectAll(".linetext").attr("transform", function (link, i) {
                    var ang = link.source == centerNode ? link.target.angle : link.source.angle;
                    ang = 180 * (ang) / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "rotate(" + ang + " 0 0) scale(-1,-1)";
                    }
                    return "rotate(" + ang + " 0 0)";
                }).attr("opacity",1);
                /*.attr("x",function(link){
                    return (link.source.x + link.target.x)/2;
                }).attr("y",function(link){
                    return (link.source.y + link.target.y)/2;
                })*/
            };

            NetworkViz.prototype.recolorNodes = function () {
                var _this = this;
                if (this.clustercolors) {
                    this.nodeBind.select("circle").transition().duration(750).attr("fill", function (node) {
                        return _this.settings.colorFunc(node.attr);
                    });
                } else {
                    this.nodeBind.select("circle").attr("fill", this.baseNodeColor);
                }
            };

            NetworkViz.prototype.glowNodes = function () {
                if (!this.glowing) {
                    this.nodeBind.select("circle").transition().style("filter", "url(#blur)");
                    this.glowing = true;
                } else {
                    this.nodeBind.select("circle").transition().style("filter", "none");
                    this.glowing = false;
                }
            };

            NetworkViz.prototype.toggleLabelVisibility = function () {
                if (this.labelsVisible) {
                    this.nodeBind.select("text").transition().style("opacity", 0);
                    this.labelsVisible = false;
                } else {
                    console.log('displaying labels..');
                    this.nodeBind.select("text").transition().style("opacity", 0.8);
                    this.labelsVisible = true;
                }
            };

            NetworkViz.prototype.drawNodes = function () {
                var _this = this;
                var tmp = function (node) {
                    return node.id;
                };
                this.nodeBind = this.nodesG.selectAll("g.node").data(this.force.nodes(), tmp);
                //update
                this.nodeBind.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")";
                });
                var circles = this.nodeBind.select("circle");
                circles.transition().duration(1000).attr("r", function (node) {
                    return _this.settings.nodeSizeFunc(node.attr);
                }).attr("fill", function (node) {
                    if (!_this.guestbook) {
                        if (_this.clustercolors) {
                            return _this.settings.colorFunc(node.attr);
                        } else {
                            return _this.baseNodeColor;
                        }
                    } else {
                        return "url(#" + node.attr.contact.userinfo.id + "_pic)";
                    }
                });

                var labels = this.nodeBind.select("text");
                labels.transition().attr("visibility", function (node) {
                    if (_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                }).attr("dy", function (node) {
                    return _this.settings.nodeSizeFunc(node.attr) + 15;
                }).attr("dx", '0em');

                //enter
                var enteringNodes = this.nodeBind.enter().append("g");
                enteringNodes.attr("class", "node").attr("id", function (node) {
                    return node.id;
                });

                enteringNodes.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")";
                });
                if (this.settings.clickHandler !== undefined) {
                    enteringNodes.on("click.1", this.settings.clickHandler);
                    enteringNodes.on("click2.centerNode", function (d, i) {
                        if(this.glowing)
                            return false;
                        this.glowing = true;
                        _this.centerNode(d);
                        this.glowing = false;
                    });
                }

                var circles = enteringNodes.append("circle");
                circles.attr("r", function (node) {
                    return _this.settings.nodeSizeFunc(node.attr);
                });
                circles.attr("stroke", function (node) {
                    return _this.settings.colorFunc(node.attr);
                });

                circles.style("opacity", "1").attr("fill","#fff")
                .attr("stroke-opacity", 1).attr("stroke-width", 1.0);

                //.style("filter", () => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
                circles.on("mouseover1", function (d, i) {
                    _this.mouseoverNode(d);
                }).on("mouseout1.1", function (d, i) {
                    _this.mouseoutNode(d);
                }).call(d3.behavior.drag().on("drag", function (node) {
                    return _this.moveContact(node);
                }));

                enteringNodes.append("text").attr("text-anchor", "middle").attr("dy", function (node) {
                    return _this.settings.nodeSizeFunc(node.attr)-14;
                }).attr("dx", '0em').attr("class", "nodelabeltext").attr("visibility", function (node) {
                    if (_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                }).style("font-size", "16px").attr("fill", function (node) {
                    return _this.settings.colorFunc(node.attr);
                }).attr("opacity", 0.8).style("pointer-events", 'none').text(function (node) {
                    return _this.settings.nodeLabelFunc(node.attr);
                });

                //exit
                this.nodeBind.exit().remove();
            };

            NetworkViz.prototype.showLabel = function (radius) {
                return (radius < 5);
            };
            NetworkViz.prototype.drawNewLinks = function (links) {
                links.forEach(function(link){
                    var key = Math.min(link.sid,link.tid) + '#' + Math.max(link.sid,link.tid);
                    this.linksG.select("#"+key)
                })
            };
            NetworkViz.prototype.drawLinks = function (links) {
                var _this = this;
                var tmp = function (link) {
                    return link.source.id + "#" + link.target.id;
                };
                if(links){
                    this.filteredLinks = links;
                    //this.linksG.selectAll(".link").remove();
                    //this.force.links(this.filteredLinks);
                }
                this.linkBind = this.linksG.selectAll(".link").data(this.force.links(), tmp);

                //enter
                var lines = this.linkBind.enter().append("g");
                lines.attr("class", "link");
                lines.append("line")
                    .attr("class",function(link){
                        //console.log(link.attr.status)
                        return "line " + (link.attr.status||"");
                    }).attr("id", function (link) {
                        return link.id;
                    })
                    .attr("stroke-opacity", function(link){
                        return link.attr.status ? ".5" : _this.baseStrokeOpacity;
                    })
                    .attr("stroke-width", function (link) {
                        return _this.settings.linkSizeFunc(link.attr);
                    });
                
                //lines.append("circle").attr("class","status").attr("r",3);
                /*
                lines.append("text").attr("class","linetext").text(function(link){
                    var names = link.attr.name, pnode = d3.select(this.parentNode);
                    for(var i=1;i<names.length;i++){
                        pnode.append("text").attr("class","linetext").text(names[i]).attr("dy",-20 * i -4).attr("opacity",0);
                    }
                    return names[0];
                }).attr("dy",-4).attr("opacity",0);*/
                //exit
                this.linkBind.exit().remove();
            };
            return NetworkViz;
        })();
        Viz.NetworkViz = NetworkViz;

        Viz.plotIntroductionTrees = function (trees) {};

        Viz.plotTimeHistogram = function (timestamps, settings) {};
    })(VMail.Viz || (VMail.Viz = {}));
    var Viz = VMail.Viz;
})(VMail || (VMail = {}));
//# sourceMappingURL=viz.js.map
