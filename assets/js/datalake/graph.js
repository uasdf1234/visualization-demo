var VMail;
(function (VMail) {
    (function (Graph) {
        Graph.communityDetection = function (graph) {
            //var nodes = graph.nodes;
            var nodesMap = {};
            for (var i in graph.nodes) {
                if (graph.nodes[i].skip) {
                    continue;
                }
                var node = graph.nodes[i];
                nodesMap[node.id] = { node: node, degree: 0 };
            }
            var m = 0;
            var linksMap = {};

            graph.links.forEach(function (link) {
                a = link.source.id;
                b = link.target.id;
                if (link.skip || link.source.skip || link.target.skip) {
                    return;
                }
                if (!(a in linksMap)) {
                    linksMap[a] = {};
                }
                if (!(b in linksMap)) {
                    linksMap[b] = {};
                }
                if (!(b in linksMap[a])) {
                    linksMap[a][b] = 0;
                    linksMap[b][a] = 0;
                    m++;
                    nodesMap[a].degree += 1;
                    nodesMap[b].degree += 1;
                }
            });

            //console.log(m);
            var communities = {};
            var Q = 0;
            for (var id in nodesMap) {
                communities[id] = { score: nodesMap[id].degree / (2.0 * m), nodes: [id] };
            }
            for (var a in linksMap) {
                for (var b in linksMap[a]) {
                    linksMap[a][b] = 1.0 / (2 * m) - (nodesMap[a].degree * nodesMap[b].degree) / (4.0 * m * m);
                }
            }

            var iter = 0;
            while (iter < 1000) {
                //find largest element of links
                var deltaQ = -1;
                var maxa = undefined;
                var maxb = undefined;
                for (var a in linksMap) {
                    for (var b in linksMap[a]) {
                        if (linksMap[a][b] > deltaQ) {
                            deltaQ = linksMap[a][b];
                            maxa = a;
                            maxb = b;
                        }
                    }
                }
                if (deltaQ < 0)
                    break;

                for (var k in linksMap[maxa]) {
                    if (k != maxb) {
                        if (k in linksMap[maxb]) {
                            // k is connected to both a and b
                            linksMap[maxb][k] += linksMap[maxa][k];
                        } else {
                            //k is connected to a but not b
                            linksMap[maxb][k] = linksMap[maxa][k] - 2 * communities[maxb].score * communities[k].score;
                        }
                        linksMap[k][maxb] = linksMap[maxb][k];
                    }
                    delete linksMap[k][maxa];
                }
                for (var k in linksMap[maxb]) {
                    if (!(k in linksMap[maxa]) && k != maxb) {
                        // k is connected to b but not a
                        linksMap[maxb][k] -= 2 * communities[maxa].score * communities[k].score;
                        linksMap[k][maxb] = linksMap[maxb][k];
                    }
                }
                for (var i in communities[maxa].nodes) {
                    communities[maxb].nodes.push(communities[maxa].nodes[i]);
                }
                communities[maxb].score += communities[maxa].score;
                delete communities[maxa];
                delete linksMap[maxa];
                Q += deltaQ;
                iter++;
                //console.log(Q);
            }

            //assign colors based on community size
            var tmp = [];
            for (var cid in communities) {
                tmp.push([cid, communities[cid].nodes.length]);
            }
            tmp.sort(function (a, b) {
                return b[1] - a[1];
            });
            var colorid = 0;
            for (var i in tmp) {
                cid = tmp[i][0];
                for (var i in communities[cid].nodes) {
                    nodesMap[communities[cid].nodes[i]].node.attr.color = colorid;
                }
                if (communities[cid].nodes.length > 1) {
                    colorid++;
                }
            }
        };

        Graph.filterNodes = function (graph, filter) {
            graph.nodes.forEach(function (node, idx) {
                node.skip = !filter(node.attr, idx);
            });
            //adjustLinks(graph);
        };

        Graph.filterLinks = function (graph, filter) {
            graph.links.forEach(function (link, idx) {
                link.skip = !filter(link.attr, idx);
            });
            //filterNonExistentLinks();
        };

        Graph.induceLinks = function (data) {
            var links = [],nodes = [],idpairToLink = Graph.idpairToLink,idToNode = Graph.idToNode;
            data && data.links && data.links.forEach(function(l){
                var aid = l.sid, bid = l.tid;
                if (!(bid in idToNode) || bid === aid)
                    return;
                var key = Math.min(aid,bid) + '#' + Math.max(aid,bid);
                //if (!(key in idpairToLink)) {
                    var link = { id:key,source: idToNode[aid], target: idToNode[bid], attr: { status:l.status,weight: 1 }, skip: false };
                    addLink(idToNode[aid].links,link);
                    addLink(idToNode[bid].links,link);
                    idpairToLink[key] = link;
                //}
            });
            for (var idpair in idpairToLink) {
                links.push(idpairToLink[idpair]);
            }
            for (var idpair in idToNode) {
                nodes.push(idToNode[idpair]);
            }
            return { nodes: nodes, links: links };
        };
        function addLink(links,link){
            var idx = -1;
            links.forEach(function(l,i){
                if(l.id === link.id){
                    idx = i;
                    return false;
                }
            })
            if(idx === -1){
                links.push(link);
            }else{
                links.splice(idx,1,link);
            }
        }
        Graph.induceNetwork = function (data) {
            var nodes = [];
            var idToNode = {};
            data.forEach(function (p) {
                var node = { links: [], id: p.node.id, skip: false };
                node.attr = p.node;
                idToNode[node.id] = node;
                nodes.push(node);
            });

            // map a link to a link object
            var idpairToLink = {};
            for (var i = 0; i < data.length; i++) {
                var ev = data[i];
                if(ev.relations && ev.relations.length){
                    var aid = ev.node.id;
                    for (var j = 0; j < ev.relations.length; j++) {
                        var b = ev.relations[j], bid = b.id;
                        if (!(bid in idToNode) || bid === aid)
                            continue;
                        var key = Math.min(aid,bid) + '#' + Math.max(aid,bid);
                        if (!(key in idpairToLink)) {
                            var link = { id:key, source: idToNode[aid], target: idToNode[bid], attr: { name: [b.name],weight: 1 }, skip: false };
                            addLink(idToNode[aid].links,link);
                            addLink(idToNode[bid].links,link);
                            idpairToLink[key] = link;
                        }else if(idpairToLink[key].attr.name.indexOf(b.name) === -1){
                            idpairToLink[key].attr.name.push(b.name);
                            idpairToLink[key].attr.weight++;
                        }
                    }
                }
            }
            var links = [];
            for (var idpair in idpairToLink) {
                links.push(idpairToLink[idpair]);
            }
            links.sort(function (a, b) {
                return b.attr.weight - a.attr.weight;
            });
            Graph.idToNode = idToNode;
            Graph.idpairToLink = idpairToLink;
            return { nodes: nodes, links: links };
        };
    })(VMail.Graph || (VMail.Graph = {}));
    var Graph = VMail.Graph;
})(VMail || (VMail = {}));
//# sourceMappingURL=graph.js.map
