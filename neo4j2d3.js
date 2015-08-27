// size of the svg rect
var width  = 2*480,
    height = 480,
    depth = {                 // not really needed but it was convenient
      min: 0,
      max: Number.MIN_VALUE
    }

var neoquery = "MATCH path = (n)-[r:Manages*2]->(m) WHERE n.manager_empno=0 RETURN path"
//this way for a POST (or vice-versa)
var dataString = {
  "statements": [{
      "statement": neoquery,
      "resultDataContents" : ["row", "graph"]
  }]
}
// $ echo -n "neo4j:secret" | base64
var authString = "Basic bmVvNGo6c2VjcmV0"

//alert("change authString")

// this was taken from a number of places, none of which by themselves worked for me.
// close:      http://blog.ashokalella.com/neo4j/d3/2015/04/27/neo4j-and-d3/
// also close:  
$.ajax({
   type:    "POST",
   url:     "http://localhost:7474/db/data/transaction/commit",
   accepts: "application/json",
   dataType:"json",
   data:    JSON.stringify(dataString), 
   beforeSend: function (xhr) {
     xhr.setRequestHeader("Authorization", authString)
     xhr.setRequestHeader("Content-Type",  "application/json; charset=utf-8")
   },
   success: function (data, xhr, status) {
     var treedata = data2tree(data)
     reingold_tree(treedata)

     var graphdata = data2graph(data)
     forced_directory(graphdata)
   },
   error: function (xhr, err, msg) {
     console.log("ERROR: xhr: " + xhr)
     console.log("ERROR: err: " + err)
     console.log("ERROR: msg: " + msg)
   }
})

// http://bl.ocks.org/mbostock/4339083
function reingold_tree(data) {
  var offset = 40

  var tree = d3.layout.tree()
      .size([height, width - 160]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y + offset, d.x]; });

  var svg = d3.select("#tree")
    .append("svg")
    .attr("width",  width  + "px") //"100%")
    .attr("height", height + "px") //"100%")
    .attr("pointer-events", "all")

  var vertline = svg.append("line")
    .attr("class", "cline")
    .attr("x1", width/2)
    .attr("y1", 0)
    .attr("x2", width/2)
    .attr("y2", height)

  var horzline = svg.append("line")
    .attr("class", "cline")
    .attr("x1", 0)
    .attr("y1", height/2)
    .attr("x2", width)
    .attr("y2", height/2)

  // set the root node's position
  data = data.nodes[0]
  data.x0 = width/2
  data.y0 = height/2

  function collapse(d) {
    if (d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }
  // only show the top rung of the hiearchy
//  data.children.forEach(collapse)

  var nodes = tree.nodes(data),
      links = tree.links(nodes)

  var link = svg.selectAll("path.link")
    .data(links)
    .enter()
      .append("path")
      .attr("class", "link tree")
      .attr("d", diagonal);

  var node = svg.selectAll("g.node")
      .data(nodes)
    .enter().append("circle")
      .attr("transform", function(d) { return "translate(" + (d.y+offset) + "," + d.x + ")"; })
      .attr("class", function(d){return "node tree " + d.label})
      .attr("r", function(d){return 2*(4-d.depth)}) // function(d){return d.radius })

  node.append("text")
      .attr("dx", function(d) { return d.children ? -8 : 8; })
      .attr("dy", 3)
      .attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) { return d.name; });

  return null
}

// modified by keith jolley, originally from http://bl.ocks.org/mbostock/
function forced_directory(data) {
  var force = d3.layout.force()
    .charge(-300) 
    .linkDistance(0.7*height/(2+depth.max-depth.min))
    .size([width, height])

  var svg = d3.select("#graph")
    .append("svg")
    .attr("width",  width  + "px") //"100%")
    .attr("height", height + "px") //"100%")
    .attr("pointer-events", "all")

  var vertline = svg.append("line")
    .attr("class", "cline")
    .attr("x1", width/2)
    .attr("y1", 0)
    .attr("x2", width/2)
    .attr("y2", height)

  var horzline = svg.append("line")
    .attr("class", "cline")
    .attr("x1", 0)
    .attr("y1", height/2)
    .attr("x2", width)
    .attr("y2", height/2)

  // load data (nodes,links) json from /data endpoint
  force
    .nodes(data.nodes)
    .links(data.links)
    .start()

  // render relationships as lines
  var link = svg.selectAll(".link")
      .data(data.links)
    .enter()
      .append("line")
      .attr("class", "link graph")
      .attr("stroke-width", function(d){return d.source.radius})

  // render nodes as circles, css-class from label
  var node = svg.selectAll(".node")
      .data(data.nodes)
    .enter()
      .append("circle")
      .attr("class", function(d){return "node graph " + d.label})
      .attr("r", function(d){return 2*(4-d.depth)}) // function(d){return d.radius })
      .call(force.drag)

    node.append("title")
      .text(function(d){return d.name + " / " + d.depth})

  // force feed algo ticks for coordinate computation
  force.on("tick", function() {
    // tell the nodes where to go
    var q = d3.geom.quadtree(data.nodes)
    data.nodes.forEach(function(node){
      ////
      // this forces the nodes to arrange themselves into the familiar org chart.
      // unfortunately it doesn't converge well in the x-axis with lots of nodes.
      // was hoping for more. it's a start. meh.
      ////
      node.y = (2*(node.y) + ((1+node.depth) * height/(2+depth.max-depth.min)))/3
      q.visit(collide(node))
    })
    // draw the nodes and links in their right places
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
    node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
  })
  return null
}

// https://github.com/mbostock/d3/blob/gh-pages/talk/20111018/collision.html#L76-101
// i really dislike this code. i hope nobody ever looks here. but it works. and that's hard to argue with.
function collide(node) {
  var r1  = 1 + node.radius
  var nx1 = node.x - r1
  var nx2 = node.x + r1
  var ny1 = node.y - r1
  var ny2 = node.y + r1
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x
      var y = node.y - quad.point.y
      var l = Math.sqrt(x * x + y * y)
      var r = node.radius + quad.point.radius
      if (l < r) {
        l = (l - r) / l * 0.5
        node.x -= x *= l
        node.y -= y *= l
        quad.point.x += x
        quad.point.y += y
      }
    }
    return x1 > nx2
        || x2 < nx1
        || y1 > ny2
        || y2 < ny1
  }
}

function data2tree(data) {
  // put data into flat json format
  // notice that this completely ignores
  // the relationship information.
  // makes heirarchy based only on "empno" -> "manager_empno"
  // also note that "children" is a d3 construct - not mine.

  data = data2graph(data)
  
  var dataMap = {};
  data.nodes.forEach(function(node) {
    dataMap[node.empno] = node
  })
  var tree = []
  data.nodes.forEach(function(node) {
    var parent = dataMap[node.parent]
    if (parent) {
      (parent.children || (parent.children=[]))
      parent.children.push(node)
    } else {
      tree.push(node)
    }
  })
  return ({
    nodes: tree,
    links: data.links
  })
}

function data2graph(stuff) {
  //Creating graph object
  var nodes=[], links=[]
  stuff.results[0].data.forEach(function(row) {
    row.graph.nodes.forEach(function(d) {
      if (idIndex(nodes, d.id) == null) {
        nodes.push({
          id:    d.id,              // i don't really care about the id, more interested in empno as index
          name:  d.properties.name,
          depth: d.properties.depth,
          empno: d.properties.empno,
          label: d.labels[0],
          radius:10,
          hire_date:      d.properties.hire_date,
          contractor:     d.properties.contractor,
          manager_empno: (d.properties.manager_empno==0 ? null : d.properties.manager_empno),
          parent:        (d.properties.manager_empno==0 ? null : d.properties.manager_empno)
        })
        if (depth.max < d.properties.depth) depth.max = d.properties.depth
        if (depth.min > d.properties.depth) depth.min = d.properties.depth
      }
    })
    // this doesn't make links unique - uniqueify in next section
    links = links.concat(
      row.graph.relationships.map(function(r) {
        return {
          source:idIndex(nodes,r.startNode),
          target:idIndex(nodes,r.endNode),
          type:r.type,
          value:1
        }
      })
    )
  })
  var tmplinks = []
  var foo = new Set()
  links.forEach(function(link) {
    var flat = ""
    for (key in link) { flat = flat + "" + link[key] }
    if(!foo.has(flat)) {
      foo.add(flat)
      tmplinks.push(link)
    }
  })
  return ({
    nodes:nodes,
    links:tmplinks
  })
}

// returns the array index of the node with "id"
function idIndex(a, id) {
  for (var i=0; i<a.length; i++) {
    if (a[i].id == id) return i
  }
  return null;
}
