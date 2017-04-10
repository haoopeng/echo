
var width = "100%", height = 500;
// var colors = d3.scale.category20();
var colors = d3.scaleSequential(d3.interpolateRdBu);
var confidence = 0.6, learning = 0.08, rewire = 0.1, post = 0.5;

var valid_data = 1;
var running = 0;
var time_interval = 500;
var nodes, links, force;

var n = 100, // number of nodes
    m = 400; // number of links

var svg = d3.select("#graph-layout").append("svg")
    .attr("width", width)
    .attr("height", height);
    // .on("mousedown", create);

// var tip = d3.tip()
//     .attr("class", "d3-tip")
//     .offset([-5, 0])
//     .html(function(d) { return "Opinion: " + roundToTwo(d.opinion); });
// svg.call(tip);


$("#confidence").keyup(update_para);
$("#learning").keyup(update_para);
$("#post").keyup(update_para);
$("#rewire").keyup(update_para);

reset_all();
$("#reset-button").click(reset_all);


// setInterval(run_Model, time_interval);


function run_Model() {
  if (running == 0) {
    return;
  }

}

function update_network () {

  svg.selectAll("line.link, circle.node").remove();
  //SVG doesn't have a convenient equivalent to html's `z-index`; instead, it relied on the order of the elements in the markup. Below, we add the nodes after the links to ensure that nodes apprear on top of links.

  var svgLinks = svg.selectAll("line.link").data(links)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", 1)
      .style("stroke-opacity", 0.2);

  var svgNodes = svg.selectAll("circle.node").data(nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d) { return 2 * Math.sqrt(d.k); })
      .style("fill", function(d) { return colors(d.opinion); })
      // .on("mouseover", tip.show)
      // .on("mouseout", tip.hide)
      .on("mouseover", function(d) { $("#opinion").html(roundToTwo(d.opinion)); })
      .call(force.drag);

  force.start();
}

function update_para () {
  p = Number($(this).val());
  name = $(this).attr("id");
  var max = 1.0;
  if (name == "confidence") {
    max = 2.0;
  }
  if (isNaN(p) || p<0.0 || p>max) {
    valid_data = 0;
    $(this).css("background-color", "#f88");
  } else {
    if (name == "confidence") {
      confidence = p;
    } else if (name == "learning") {
      learning = p;
    } else if (name == "post") {
      post = p;
    } else {
      rewire = p;
    }
    valid_data = 1;
    $(this).css("background-color", "#fff");
  }
}

function reset_all () {
  // running = 0;
  //creates a random graph on n nodes and m links
  [nodes, links] = createRandomNet(n, m);

  force = d3.layout.force()
    .size([1000, height])
    .nodes(nodes)
    .links(links)
    .charge(-400)
    .friction(0.2) //the tension of edges.
    .gravity(0.01) //the interaction force between nodes.
    .linkDistance(100)
    .on("tick", function () {
      svg.selectAll("circle.node")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      svg.selectAll("line.link")
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    });

  update_network();
  $("#start-text").fadeIn();
}

function createRandomNet(n, m) {
  var nodes = d3.range(n).map(function (i) {return {name: i}; }),
      list  = randomChoose(unorderedPairs(d3.range(n)), m),
      links = list.map(function (a) { return {source: a[0], target: a[1]}; });
  var kArray = [];
  for (i in nodes) {
    kArray[nodes[i].name] = 0;
  }
  for (i in links) {
    kArray[links[i].source]++;
    kArray[links[i].target]++;
  }
  for (i in nodes) {
    nodes[i].k = kArray[i];
    nodes[i].opinion = genRandomValue(0, 1);
  }
  return [nodes, links];
}

function genRandomValue (min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoose (s, k) { // returns a random k element subset of s
  var a = [], i = -1, j;
  while (++i < k) {
    j = Math.floor(Math.random() * s.length);
    a.push(s.splice(j, 1)[0]);
  };
  return a;
}

function unorderedPairs (s) { // returns the list of all unordered pairs from s
  var i = -1, a = [], j;
  while (++i < s.length) {
    j = i;
    while (++j < s.length) a.push([s[i],s[j]])
  };
  return a;
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}
