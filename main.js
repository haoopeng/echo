// var width = "100%", height = 600;
var width = document.getElementById("graph-layout").offsetWidth;
var height = document.getElementById("graph-layout").offsetHeight - document.getElementById("speed-box").offsetHeight;

var colors = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

var count = 0;
var running = 0;
var valid_data = 0;
var slowest_time = 200;
var remove_link = false;
var time_interval = slowest_time - Number($("#speed").val()),
    confidence = Number($("#confidence").val()),
    learning = Number($("#learning").val()),
    rewire = Number($("#rewire").val()),
    post = Number($("#post").val());
var nodes, links, adj_list, simulation, svgLinks, svgNodes;

var n = 100, // number of nodes
    m = 400; // number of links

var timeseries = {color: "#000", data: []};
var avg_deviation;

var plotOptions = {
    xaxis: {min: 0},
    series: { shadowSize: 0 }
};

var plot = $.plot($("#epicurves"), [], plotOptions);

var svg = d3.select("#graph-layout").append("svg")
    .attr("width", width)
    .attr("height", height);

// var defs = svg.append("defs");
// var linearGradient = defs.append("linearGradient")
//     .attr("id", "linear-gradient")
//     .attr("x1", "0%")
//     .attr("y1", "0%")
//     .attr("x2", "100%")
//     .attr("y2", "0%");

// linearGradient.append("stop")
//     .attr("offset", "0%")
//     .attr("stop-color", "#b82d00");

// linearGradient.append("stop")
//     .attr("offset", "100%")
//     .attr("stop-color", "#05335c");

// var g = svg.append("g")
//     .attr("class", "legendWrapper")
//     .attr("transform", "translate(10, 20)");

// g.append("rect")
//   .attr("class", "legendRect")
//   .attr("width", 200)
//   .attr("height", 20)
//   .style("fill", "url(#linear-gradient)");

// g.append("text")
//     .text("Conservative")
//     .attr("class", "legend")
//     .attr("y", -3);

// g.append("text")
//     .text("Liberal")
//     .attr("class", "legend")
//     .attr("x", 155)
//     .attr("y", -3);

$("#speed").on("change", update_para);
$("#confidence").on("change", update_para);
$("#learning").on("change", update_para);
$("#post").on("change", update_para);
$("#rewire").on("change", update_para);

reset_all();
$("#start-button").click(start_all);
$("#stop-button").click(stop_all);
$("#reset-button").click(reset_all);

var interval = setInterval(run_Model, time_interval);

interval;

function run_Model() {
  if (running == 0 || valid_data == 0) {
    return;
  }
  // each time, randomly select a node, identify con/discordant nodes;
  var t_node = nodes[getRandomInt(0, n-1)],
      concordant_nodes = [],
      discordant_nodes = [],
      other_nodes = [],
      discordant_links = [];
  //remove the unfriended link.
  if (remove_link == true) {
    links.splice(links.length-1, 1);
    remove_link = false;
  }

  for (l in links) {
    var i = links[l].source,
        j = links[l].target;
    if (j.name == t_node.name) {
      var temp = i;
      i = j, j = temp, links[l].source = i, links[l].target = j;
    }
    if (i.name == t_node.name) {
      if (Math.abs(i.opinion - j.opinion) <= confidence) {
        concordant_nodes.push(j);
      } else {
        discordant_nodes.push(j);
        discordant_links.push(links[l]);
      }
    }
  }
  // identify nodes to which current node will build a link.
  for (l in nodes) {
    var n_t = nodes[l];
    if (n_t.name != t_node.name && discordant_nodes.indexOf(n_t) == -1 && concordant_nodes.indexOf(n_t) == -1) {
      other_nodes.push(n_t);
    }
  }
  // two ways to post a new opinion.
  if (concordant_nodes.length > 0) {
    if (Math.random() < post) {
      // post updated opinion from concordant nodes with learning rate;
      t_node.opinion = update_opinion(t_node, concordant_nodes);
    } else {
      // randomly repost opinion of one of its concordant nodes;
      t_node.opinion = concordant_nodes[getRandomInt(0, concordant_nodes.length-1)].opinion;
    }
  }
  // rewire one discordant link to other nodes;
  var t_link = false;
  if (discordant_nodes.length > 0) {
    if (Math.random() < rewire) {
      t_link = discordant_links[getRandomInt(0, discordant_links.length-1)];
      // add the link that will be removed soon to links.
      // links.push(jQuery.extend(true, {}, t_link));
      links.push(JSON.parse(JSON.stringify(t_link)));
      remove_link = true;
      // rewire and update node's degree.
      var t_list = adj_list[t_node.index],
          del_node = t_link.target,
          del_node_list = adj_list[del_node.index],
          index_o = del_node_list.indexOf(t_node),
          index_d = t_list.indexOf(del_node),
          add_node = other_nodes[getRandomInt(0, other_nodes.length-1)],
          add_node_list = adj_list[add_node.index];
      t_list.splice(index_d, 1);
      del_node_list.splice(index_o, 1);
      t_list.push(add_node);
      add_node_list.push(t_node);
      del_node.k--;
      t_link.target = add_node;
      add_node.k++;
    }
  }
  // highlight the newly established link
  update_network(t_node, t_link);
  count += 1;
  avg_deviation = cal_avg_deviation();
  timeseries.data.push([count, avg_deviation]);
  update_plot();
  // console.log(count);
  $("#iterate").html(count);
}

function update_opinion(t_node, concordant_nodes) {
  var sum = 0;
  for (k in concordant_nodes) {
    sum += concordant_nodes[k].opinion;
  }
  var opinion_f = (1-learning) * t_node.opinion + learning * sum / concordant_nodes.length;
  return opinion_f;
}

function cal_avg_deviation() {
  var total = 0,
      len = 0;
  for (i in adj_list) {
    var nlist = adj_list[i],
        squ = 0;
    if (nlist.length > 0) {
      for (j in nlist) {
        squ += Math.pow((nlist[j].opinion - nodes[i].opinion), 2);
      }
      total += Math.sqrt(squ/nlist.length);
      len += 1;
    }
  }
  return total/len;
}

function update_network(t_node = false, t_link = false) {

  svg.selectAll("line.link, circle.node").remove();
  //SVG doesn't have a convenient equivalent to html's `z-index`; instead, it relied on the order of the elements in the markup. Below, we add the nodes after the links to ensure that nodes apprear on top of links.

  svgLinks = svg.selectAll("line.link").data(links, function(d) { return d.index;})
      .enter().append("line")
      .attr("class", "link");

  svgNodes = svg.selectAll("circle.node").data(nodes, function(d) { return d.index;})
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d) { return 2 * Math.sqrt(d.k); })
      .style("fill", function(d) { return colors(d.opinion); })
      .on("mouseover", function(d) {
          $("#opinion").html(roundToTwo(d.opinion));
          $("#agent").html(d.name);
        })
      .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

  if (t_node != false) {
    svgNodes._groups[0][t_node.index].style.fill = "black";
  }
  if (t_link != false) {
    // highlight the removed link and new link.
    svgLinks._groups[0][links.length-1].style.strokeDasharray = "5, 5";
    svgLinks._groups[0][links.length-1].style.strokeOpacity = 1;
    svgLinks._groups[0][links.length-1].style.strokeWidth = 2;
    svgLinks._groups[0][t_link.index].style.strokeOpacity = 1;
    svgLinks._groups[0][t_link.index].style.strokeWidth = 2;
  }
  simulation.alpha(0.1);
  simulation.restart();
}

function update_plot() {
  plot.setData([timeseries]);
  plot.setupGrid();
  plot.draw();
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.2).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// function update_para() {
//   p = Number($(this).val());
//   name = $(this).attr("id");
//   var max = 1.0;
//   if (name == "confidence") {
//     max = 2.0;
//   }
//   if (isNaN(p) || p<0.0 || p>max) {
//     valid_data = 0;
//     $(this).css("background-color", "#f88");
//   } else {
//     if (name == "confidence") {
//       confidence = p;
//     } else if (name == "learning") {
//       learning = p;
//     } else if (name == "post") {
//       post = p;
//     } else {
//       rewire = p;
//     }
//     valid_data = 1;
//     $(this).css("background-color", "#fff");
//   }
// }

function update_para() {
  p = Number($(this).val());
  name = $(this).attr("id");
  if (name == "confidence") {
    confidence = p;
  } else if (name == "learning") {
    learning = p;
  } else if (name == "post") {
    post = p;
  } else if (name == "rewire") {
    rewire = p;
  } else {
    clearInterval(interval);
    time_interval = slowest_time - p;
    interval = setInterval(run_Model, time_interval);
  }
  valid_data = 1;
}

function ticked() {
    svgNodes
        .attr("cx", function(d) {
            var radius = 2 * Math.sqrt(d.k);
            var max = width - radius;
            if (d.x < radius) {
              return d.x = radius + 1;
            } else if (d.x > max) {
              return d.x = max - 1;
            } else {
              return d.x = d.x;
            }
        })
        .attr("cy", function(d) {
            var radius = 2 * Math.sqrt(d.k);
            var max = height - radius;
            if (d.y < radius) {
              return d.y = radius + 1;
            } else if (d.y > max) {
              return d.y = max - 1;
            } else {
              return d.y = d.y;
            }
        });
    svgLinks
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });
}


function constrain(d, bound) {

}

function start_all() {
  running = 1;
  valid_data = 1;
  // $("#start-text").fadeOut();
}

function stop_all() {
  running = 0;
  // $("#start-text").fadeIn();
}

function reset_all() {
  stop_all();
  count = 0;
  timeseries.data = [];
  // $("#iterate").html(count);
  // $("#agent").html("NaN");
  // $("#opinion").html("NaN");
  //creates a random graph on n nodes and m links
  [nodes, links, adj_list] = createRandomNet(n, m);


  simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.index; }).distance(5).strength(0.2))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2));
    // .force("y", d3.forceY(width))
    // .force("x", d3.forceX(height));

  simulation
    .nodes(nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(links);

  update_network();
  update_plot();
}

function createRandomNet(n, m) {
  var nodes = d3.range(n).map(function (i) {return {name: i}; }),
      list  = randomChoose(unorderedPairs(d3.range(n)), m),
      links = list.map(function (a) { return {source: a[0], target: a[1]}; });
  var adj_list = [];
  for (n in nodes) {
    nodes[n].k = 0;
    nodes[n].opinion = genRandomValue(-1, 1);
    adj_list[n] = [];
  }
  for (l in links) {
    nodes[links[l].source].k++;
    nodes[links[l].target].k++;
    var i = links[l].source;
    var j = links[l].target;
    adj_list[i].push(nodes[j]);
    adj_list[j].push(nodes[i]);
  }
  return [nodes, links, adj_list];
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function genRandomValue(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoose(s, k) { // returns a random k element subset of s
  var a = [], i = -1, j;
  while (++i < k) {
    j = Math.floor(Math.random() * s.length);
    a.push(s.splice(j, 1)[0]);
  };
  return a;
}

function unorderedPairs(s) { // returns the list of all unordered pairs from s
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
