var VMail;
(function (VMail) {
    (function (App) {
        var FRICTION = 0.8;
        var LINKDISTANCE = 200;
        var NTOPCONTACTS = 15;

        //number of nodes to precompute graph for
        var NNODES_PRECOMPUTE = 200;

        //default network viz parameters
        var NNODES_DEFAULT = 100;
        var CHARGE_DEFAULT = -2500;

        //In-memory database object holding all the contacts and emails,
        // visible to outside for debuging purposes (e.g. testing in browser console)
        App.db = null;
        App.userinfo = null;
        App.version = null;
        App.working = null;
        App.aliases = null;

        // ****** CURRENT STATE OF PRESENTATION LAYER *********
        App.viz = null;
        App.graph = null;

        App.isWithinRange = true;
        App.isContactDetails = false;
        App.isUserStats = true;
        App.wasUserStats = true;

        //current number of nodes
        var nnodes = NNODES_DEFAULT;
        var nlinks = 1000000000;

        // returns the timespan between the two dates in human-friendly format
        var timespanPretty = function (seconds) {};

        // show a list of the topN contacts on the page using only information
        //(emails) between start and end date
        var showTopContacts = function (topN) {};

        // show details about a particular contact on the page using information
        // (emails) between start and end date
        var showContactDetails = function (contact, start, end) {};

        // auto-complete search box allowing searching for contacts
        var initSearchBox = function () {};

        //call this only after you have induced a new network
        var initLinksSlider = function () {};

        var initNetworkSliders = function () {};

        var updateNetwork = function (data,newdata) {
            if (data) {
                ////generate a network out of email data
                App.graph = VMail.Graph.induceNetwork(data);
                //initLinksSlider();
            }else if(newdata){
                App.graph = VMail.Graph.induceLinks(newdata);
            }
            VMail.Graph.filterNodes(App.graph, function (nodeAttr, idx) {
                return idx < nnodes;
            });
            VMail.Graph.filterLinks(App.graph, function (linkAttr, idx) {
                return idx < nlinks;
            });

            /*//run community detection on the network
            VMail.Graph.communityDetection(App.graph);
            var sizeExtent = d3.extent(App.graph.nodes, function (node) {
                //console.log(node.attr.size)
                return node.attr.size;
            });
            var nodeRadius = d3.scale.linear().range([3, 50]).domain(sizeExtent);
            var linkSizeExtent = d3.extent(App.graph.links, function (link) {
                return link.attr.weight;
            });
            var linkWidth = d3.scale.linear().range([1, 12]).domain(linkSizeExtent);
*/
            App.viz.settings.nodeSizeFunc = function (attr) {
                return 20;//nodeRadius(attr.size);
            };
            App.viz.settings.linkSizeFunc = function (attr) {
                return 1;
            };

            //viz.settings.nodeSizeFunc = null;
            App.viz.updateNetwork(App.graph);
            //if(!viz.guestbook) {
            //  setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 5000)
            //}
        };

        function findTarget(nodes,link){
            var o = {};
            nodes.forEach(function(node){
                if(node.id === link.sid){
                    o.source = node;
                }else if(node.id === link.tid){
                    o.target = node;
                }else if(o.source && o.target){
                    return false;
                }
            })
            return o;
        }
        // slider where users selects time-sliced view of the data
        var startCheck = function () {
            setTimeout(function(){
                d3.json("data/getlinks.json", function (error, data) {
                    console.log("checking...");
                    // var links = VMail.Graph.induceLinks(data);
                    // links.length && App.viz.drawLinks(links);
                    /*var nodes = App.viz.filteredNodes,newLinks = [];
                    data.links && data.links.forEach(function(link){
                        var o = findTarget(nodes,link);
                        var newLink = $.extend({attr:{weight:1},id:link.sid+"#"+link.tid,skip:false},o);
                        App.viz.filteredLinks.push(newLink);
                    })*/
                    // console.log(App.viz.force.links())
                    // console.log(App.viz.force.nodes())
                    //App.viz.drawLinks();
                     updateNetwork(null,data);
                    //startCheck();
                });
            },3000);
        };

        //populate the left column with some basic info and aggregate statistics
        var initBasicInfo = function (aliases, userinfo) {};

        var numParser = function (num) {};

        App.snapshot = function (notext) {};
        //user_stats
        var initHistograms = function () {};

        App.toggleinfo = function (show_mystats, show_topcollab) {};

        var sendStatsToServer = function () {};

        // show initial data including our own details (left column),
        // the unfiltered network (center column), and the ranking list (right column).
        // This function gets called once the server has fetched the inital batch of emails
        var showData = function (data) {
            $("#data").fadeIn();
            var color = d3.scale.category10();
            var settings = {
                svgHolder: "#network",
                size: {
                    width: $('#centercolumn').width(),
                    height: $(window).height() - 50
                },
                forceParameters: {
                    friction: FRICTION,
                    gravity: 0.9,
                    linkDistance: LINKDISTANCE,
                    charge: CHARGE_DEFAULT,
                    live: true
                },
                nodeLabelFunc: function (attr) {
                    return attr.type;
                },
                nodeLabelFuncHover: function (attr) {
                    return attr.type;
                },
                nodeSizeFunc: null,
                linkSizeFunc: null,
                colorFunc: function (attr) {
                    return color(attr.color);
                },
                clickHandler: function (node) {
                }
            };

            //initialize slider
            //initTimeSlider();
            //initNetworkSliders();

            //vizualize the network
            App.viz = new VMail.Viz.NetworkViz(settings, false);
            updateNetwork(data);

        };

        var nscheduled = null;
        var queuesize = null;
        $(document).ready(function () {
            $("#loader").css("display", "block").html('Downloading data to browser.. 0%');
            d3.json("data/getnodes.json", function (error, data) {
                console.log("done setting up the db");
                dataIsShown = true;
                showData(data);
                startCheck();
            });
        });
    })(VMail.App || (VMail.App = {}));
    var App = VMail.App;
})(VMail || (VMail = {}));
//# sourceMappingURL=app.js.map
