(function($){
var r = 10, w = 840, h = 500, interval = 3000,
    zoom = d3.behavior.zoom().scaleExtent([.5, 2]).on("zoom", zoomed);
    nodeArray = [],
    linkArray = [],
    vis = d3.select("#network").append("svg:svg").attr("height",h).attr("width",w).attr("pointer-events", "all").call(zoom);;
var link = vis.append('svg:g').attr("id", "link").selectAll(".link"),
    node = vis.append('svg:g').attr("id", "node").selectAll(".node");
var idToNode = {},
    idpairToLink = {};
var mockData = (function(){
    var nodes = [], id = 1;
    "SHDC".split("").forEach(function(type,idx){
        for(var i=0;i<10;i++){
            var hx = Math.random()*w/2,
                hy = Math.random()*h/2;
            var x = hx, y = hy;
            if(idx === 1){
                x += (w/2);
            }else if(idx === 2){
                y += (h/2);
            }else if(idx === 3){
                x += (w/2);
                y += (h/2);
            }
            nodes.push({
                "node":{
                    "type":type,
                    "y":y,
                    "x":x,
                    "id":id++//(idx+1)*(i+1)
                }});
        }
    });
    return nodes;
})();
function zoomed() {
    node.selectAll("circle,text").attr("transform", "scale(" + d3.event.scale + ")");
    //node.selectAll("text").attr("transform", "scale(" + d3.event.scale + ")");
}
function induceNetwork(data) {
    var nodes = [];
    data.forEach(function(p) {
        var node = {
            links: [],
            id: p.node.id,
            skip: false
        };
        node.attr = p.node;
        node.x = p.node.x;
        node.y = p.node.y;
        if (!idToNode[node.id]) {
            idToNode[node.id] = node;
            nodes.push(node);
        }
    });
    for (var i = 0; i < data.length; i++) {
        var ev = data[i];
        if (ev.relations && ev.relations.length) {
            var aid = ev.node.id;
            for (var j = 0; j < ev.relations.length; j++) {
                var b = ev.relations[j],
                    bid = b.id;
                if (!(bid in idToNode) || bid === aid) continue;
                var key = Math.min(aid, bid) + '_' + Math.max(aid, bid);
                if (!(key in idpairToLink)) {
                    var link = {
                        id: key,
                        source: idToNode[aid],
                        target: idToNode[bid],
                        attr: {
                            status: b.status,
                            weight: 1
                        },
                        skip: false
                    };
                    idpairToLink[key] = link;
                }
            }
        }
    }
    var links = [];
    for (var idpair in idpairToLink) {
        links.push(idpairToLink[idpair]);
    }
    return {
        nodes: nodes,
        links: links
    };
}
d3.json("data/getnodes.json", function(error, data) {
    //mock
    var gragh = induceNetwork(mockData);
    linkArray = linkArray.concat(gragh.links);
    nodeArray = nodeArray.concat(gragh.nodes);
    window.force = d3.layout.force()
            .gravity(0.04)
            .charge(-60)
            .friction(0.95)
            .linkDistance(100)
            .linkStrength(5)
            .size([w, h])
            .nodes(nodeArray)
            .links(linkArray)
            .on("tick", tick);

    draw();
    startCheck();
});

function findTarget(nodes, link) {
    var o = {};
    nodes.forEach(function(node) {
        if (node.id === link.sid) {
            o.source = node;
        } else if (node.id === link.tid) {
            o.target = node;
        } else if (o.source && o.target) {
            return false;
        }
    });
    return o.source && o.target ? o : null;
}
var findLinkIndexById = function(id) {
    var index = -1;
    linkArray.forEach(function(l, i) {
        if (l.id === id) {
            index = i;
            return false;
        }
    });
    return index;
};
var startCheck = function() {
    
        d3.json("data/getlinks.json?"+Math.random(), function(error, data) {
            console.log("checking...");
            var nodes = nodeArray,
                newLinks = [],
                redraw = false;
            data.links && data.links.forEach(function(link) {
                    var o = findTarget(nodes, link),
                        id = link.sid + "_" + link.tid;
                    if(!o){
                        console.log("can't find link source or target");
                        console.log(link);
                        return true;
                    }
                    var newLink = $.extend({
                        attr: {
                            weight: 1,
                            status: link.status
                        },
                        id: id,
                        skip: false
                    }, o);
                    if (!(id in idpairToLink)) {
                        linkArray.push(newLink);
                        idpairToLink[id] = newLink;
                        redraw = true;
                    } else if (idpairToLink[id].attr.status != link.status) {
                        idpairToLink[id] = newLink;
                        linkArray.splice(findLinkIndexById(id), 1);
                        draw();
                        linkArray.push(newLink);
                        redraw = true;
                        // draw();
                    }
                });
            if (redraw) draw();
            //startCheck();
    setTimeout(startCheck, interval);
        });
};
function draw() {
    console.log("draw")
    node = node.data(function(){
        var r = [];
        nodeArray.forEach(function(n){
            n.skip || r.push(n);
        });
        return r;
    }, function(d) {
        return d.id;
    });
    link = link.data(function(){
        var r = [];
        linkArray.forEach(function(n){
            n.source.skip || n.target.skip || r.push(n);
        });
        return r;
    }, function(d) {
        return d.source.id + "-" + d.target.id;
    });
    //create the link object using the links object in the json
    //link = vis.selectAll("line").data(linkArray);
    //link.enter()
    var glink = link.enter().append("svg:g")
                //.filter(function (l) {return !l.source.skip && !l.target.skip;});
    glink.append("svg:line").attr("class", function(link) {
        return "line " + (link.attr.status || "");
    }).attr("id", function(link) {
        return link.id;
    }).attr("stroke-opacity", function(link) {
        return link.attr.status ? ".5" : ".2";
    }).attr("stroke-width", function(link) {
        return 1;
    });


    glink.filter(function (l) {
        return l.attr.status === "processing";
    }).append("svg:image").attr("width", 12).attr("height", 12)
    .attr("xlink:href", "assets/images/Clock_reversed.gif");

    //node = vis.selectAll("g").data(nodeArray);
    var g = node.enter().append("svg:g")
            //.filter(function (d) {return !d.skip;})
            .call(force.drag);
    //append to each node an svg circle element
    //vis.selectAll(".realnode").filter(function (d) {return d.added;})
    g.append("svg:circle").attr("r", function(node) {
        return r;
    }).attr("class", function(n){
        return "node " + n.attr.type;
    }).on("mouseover", function (d, i) {
        var snode = d3.select(this), color = snode.style("stroke");
        snode.style("fill",color);
        var stext = d3.select(this.nextSibling);
        stext.style("fill","#fff");
    }).on("mouseout", function (d, i) {
        var snode = d3.select(this), color = snode.style("fill");
        snode.style("fill","#fff");
        var stext = d3.select(this.nextSibling);
        stext.style("fill",color);
    });
    //append to each node the attached text desc
    //vis.selectAll(".label").filter(function (d) {return d.added;})
    g.append("svg:text").attr("dy", 4).attr("dx", 0).attr("class", function(n){
        return "nodelabel " + n.attr.type;
    }).text(function(d) {
        return d.attr.type// + d.id;
    });

    node.exit().transition().ease("elastic").remove();
    link.exit().transition().ease("elastic").remove();
    //activate it all - initiate the nodes and links
    force.start();
}

function tick() {
    node.attr("cx", function(d) {
        var x = Math.min(w-r,Math.max(r,d.x));
        d.x = x;
        return x;//d.x ? d.x : (d.x = Math.random()*870);
    }).attr("cy", function(d) {
        var y = Math.min(h-r,Math.max(r,d.y));
        d.y = y;
        return y;
    }).attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
    link.selectAll("line").attr("x1", function(d) {
        return d.source.x;
    }).attr("y1", function(d) {
        return d.source.y;
    }).attr("x2", function(d) {
        return d.target.x;
    }).attr("y2", function(d) {
        return d.target.y;
    });

    link.selectAll("image").attr("x", function(d) {
        return (d.source.x + d.target.x)/2 - 6;
    }).attr("y", function(d) {
        return (d.source.y + d.target.y)/2 - 6;
    });
}

$('#accordion').collapse({
  toggle: false
}).on('hide.bs.collapse', function (e) {
  var id = $(e.target).attr("id");
  var type = id.substring(8);
  nodeArray.forEach(function(n){
    n.skip = n.attr.type !== type;
  });
  draw();
});
$(document).on("dblclick",function(){
    nodeArray.forEach(function(n){
        n.skip = false;
      });
  draw();
}).on("click",".md-head",function(e){
    var $tar = $(e.target),
        $this = $tar.closest(".md"), disabledClass = "disabled";
    if($tar.is(".fa")){
        $this.find(".md-body").toggleClass(disabledClass);
        $tar.toggleClass("fa-angle-double-up").toggleClass("fa-angle-double-down");
        return false;
    }
    $this.toggleClass(disabledClass);
    var type = $this.attr("class").substring(3,4),
        disabled = $this.hasClass(disabledClass);
    nodeArray.forEach(function(n){
        n.attr.type === type && (n.skip = disabled);
    });
  draw();
});
})(jQuery);