(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3-array'), require('d3-collection'), require('d3-interpolate'), require('d3-format'), require('d3-selection'), require('d3-scale'), require('d3-color'), require('d3-drag'), require('d3-zoom'), require('d3-axis')) :
	typeof define === 'function' && define.amd ? define(['d3-array', 'd3-collection', 'd3-interpolate', 'd3-format', 'd3-selection', 'd3-scale', 'd3-color', 'd3-drag', 'd3-zoom', 'd3-axis'], factory) :
	(factory(global.d3,global.d3,global.d3,global.d3Format,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (d3Array,d3Collection,d3Interpolate,d3Format,d3Selection,d3Scale,d3Color,d3Drag,d3Zoom,d3Axis) { 'use strict';

function sankey() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      align = 'justify', // left, right, center, justify or none
      linkType = 'bezier',
      orderByPath = false,
      scaleNodeBreadthsByString = false,
      curvature = .5,
      showNodeValues = false,
      nodeCornerRadius = 0,
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.orderByPath = function(_) {
    if (!arguments.length) return orderByPath;
    orderByPath = _;
    return sankey;
  };

  sankey.curvature = function(_) {
    if (!arguments.length) return curvature;
    curvature = _;
    return sankey;
  };
  
  sankey.showNodeValues = function(_) {
    if (!arguments.length) return showNodeValues;
    showNodeValues = _;
    return sankey;
  };

  sankey.linkType = function(_) {
    if (!arguments.length) return linkType;
    linkType = _.toLowerCase();
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.align = function(_) {
    if (!arguments.length) return align;
    align = _.toLowerCase();
    return sankey;
  };
  
  sankey.nodeCornerRadius= function(_) {
    if (!arguments.length) return nodeCornerRadius;
    nodeCornerRadius = _;
    return sankey;
  };

  sankey.scaleNodeBreadthsByString = function(_) {
    if (!arguments.length) return scaleNodeBreadthsByString;
    scaleNodeBreadthsByString = _;
    return sankey;
  };


  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  // SVG path data generator, to be used as "d" attribute on "path" element selection.
  sankey.link = function() {
    function xy(x,y) { return x + "," + y; }
    
    // M(x,y) moveto function - moves pen to new location; doesn't draw
    function M(x,y)  { return "M" + xy(x,y); }
    
    // C(x1,y1,x2,y2,x,y) curveto function 
    //   draws a cubic bezier curve from the current point to (x,y)
    //   using (x1,y1) and (x2,y2) as control points
    function C(x1,y1,x2,y2,x,y)  { return "C" + xy(x1,y1) + " " + xy(x2,y2) + " " + xy(x,y); }
    
    // S(x2,y2,x,y) smooth curveto function 
    //   draws a cubic bezier curve from the current point to (x,y)
    //   with the first control point being a reflection of (x2,y2)
    function C(x1,y1,x2,y2,x,y)  { return "C" + xy(x1,y1) + " " + xy(x2,y2) + " " + xy(x,y); }
    
    // L(x,y) lineto function - moves pen to new location; doesn't draw
    function L(x,y)  { return "L" + xy(x,y); }
    
    // Z() closepath function - line is drawn from last point to first
    function Z()  { return "Z"; }
    
    // v(dy) vertical lineto function - draws a horizontal line from the current point for dy px
    function v(dy)  { return "v" + dy; }
    
    // H(y) horizontal lineto function - draw a horizontal line from the current point to x
    function H(x)  { return "H" + x; }
    
    
    function link(d) {
      
      var x0 = d.source.x + d.source.dx - nodeCornerRadius,  // x source point
          x1 = d.target.x  + nodeCornerRadius,               // x target point
          xi = d3Interpolate.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature);


      var y0 = d.source.y + d.sy,
          y1 = d.target.y + d.ty,
          y2 = y1 + d.dy,
          y3 = y0 + d.dy;

      var ld;
      if (d.cycleBreaker) {
        // TODO: Fix notation (xs = x0, etc)
        var xdelta = (1.5 * d.dy + 0.05 * Math.abs(xs - xt));
        xsc = xs + xdelta;
        xtc = xt - xdelta;
        var xm = xi(0.5);
        var ym = d3Interpolate.interpolateNumber(ys, yt)(0.5);
        var ydelta = (2 * d.dy + 0.1 * Math.abs(xs - xt) + 0.1 * Math.abs(ys - yt)) * (ym < (size[1] / 2) ? -1 : 1);
        
        ld = M(xs,ys) + C(xsc,ys, xsc,(ys + ydelta), xm,(ym + ydelta)) + S(xtc,yt, xt,yt);
      } else {
        switch (linkType) {
          case "trapez":
            ld = M(x0,y0) + L(x0,y3) + L(x1,y2) + L(x1,y1) + Z(); 
            break;
          case "path1":    // from @ghedamat https://github.com/d3/d3-plugins/pull/36 
            ld = M(x0,y0) + C(x2,y0, x3,y1, x1,y1) + L(x1,y2) + C(x3,y2, x2,y3, x0,y3) + Z(); 
            break;
          case "path2":   // from @cmorse https://github.com/d3/d3-plugins/pull/40 
            var x4 = x3 + ((d.dy < 15) ? ((d.source.y < d.target.y) ? -1 * d.dy : d.dy) : 0),
                x5 = x2 + ((d.dy < 15) ? ((d.source.y < d.target.y) ? -1 * d.dy : d.dy) : 0);
            ld = M(x0,y0) + C(x2,y0, x3,y1, x1,y1) + v(d.dy) + C(x4,y2, x5,y3, x0,y3) + Z();
            break;
          case "l-bezier": // from @michealgasser pull request #120 to d3/d3-plugins
            y0 = d.source.y + d.sy + d.dy / 2;
            y1 = d.target.y + d.ty + d.dy / 2;
            x4 = x0 + d.source.dx/4;
            x5 = x1 - d.target.dx/4;
            x2 = Math.max(xi(curvature), x4+d.dy);
            x3 = Math.min(xi(curvature), x5-d.dy);
            ld = M(x0,y0) + H(x4) + C(x2,y0, x3,y1, x5,y1) + H(x1);
            break;
          case "bezier":
          default:
            y0 = d.source.y + d.sy + d.dy / 2;
            y1 = d.target.y + d.ty + d.dy / 2;
            ld = M(x0,y0) + C(x2,y0, x3,y1, x1,y1);
            break;
        }
      }
      return ld;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      // Links that have this node as source.
      node.sourceLinks = [];
      // Links that have this node as target.
      node.targetLinks = [];
      node.inactive = false;
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      link.inactive = false;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    if (typeof nodes[0].value == "undefined") {
      nodes.forEach(function(node) {
        node.value = Math.max(
          d3Array.sum(node.sourceLinks, value),
          d3Array.sum(node.targetLinks, value)
        );
      });
    }
  }

  var summed_str_length = [0];
  var max_posX;

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var reverse = (align === 'right'); // Reverse traversal direction

    if (typeof nodes[0].posX == "undefined") {
      var remainingNodes = nodes,
          x = 0,
          nextNodes;
      // Work from left to right.
      // Keep updating the breath (x-position) of nodes that are target of recently updated nodes.
      while (remainingNodes.length && x < nodes.length) {
        nextNodes = [];
        remainingNodes.forEach(function(node) {
          node.x = x;
          node.posX = x;
          node.dx = nodeWidth;

          node[reverse ? 'targetLinks' : 'sourceLinks'].forEach(function(link) {
            var nextNode = link[reverse ? 'source' : 'target'];
            if (nextNodes.indexOf(nextNode) < 0) {
              nextNodes.push(nextNode);
            }
          });
        });
        if (nextNodes.length == remainingNodes.length) {
          // There must be a cycle here. Let's search for a link that breaks it.
          findAndMarkCycleBreaker(nextNodes);
          // Start over.
          // TODO: make this optional?
          return computeNodeBreadths();
        }
        else {
          remainingNodes = nextNodes;
          ++x;
        }
      }
    } else {
        nodes.forEach(function(node) {
            node.x = node.posX;
            node.dx = nodeWidth;
        });
    }

    // calculate maximum string lengths at each posX
    max_posX= d3Array.max(nodes, function(d) { return(d.posX); } ) + 1;
    var max_str_length = new Array(max_posX);
    nodes.forEach(function(node) {
        if (typeof max_str_length[node.x] == "undefined" || node.name.length > max_str_length[node.x]) {
          max_str_length[node.x] = node.name.length;
        }

        // make a path to the beginning for vertical ordering
        if (orderByPath) {
          node.path = node.name;
          nn = node;
          while (nn.targetLinks.length) {
              if (nn.targetLinks.length > 1) {
                console.log("Error - orderByPath not useful when there is more than one parent for a node.");
              }
              nn = nn.targetLinks[0].source;
              node.path = nn.name + ";" + node.path;
          }
        }

    });

    for (var i=1; i<max_posX; ++i) {
        summed_str_length[i] = summed_str_length[i-1] + max_str_length[i-1] * 6 + nodeWidth + nodePadding;
    }

    if (reverse) {
      // Flip nodes horizontally
      nodes.forEach(function(node) {
        node.x *= -1;
        node.x += x - 1;
      });
    }
    

    if (align === 'center') {
      moveSourcesRight();
    } else if (align === 'justify') {
      moveSinksRight(max_posX);
    }
    
    if (align == 'none') {
      scaleNodeBreadths((size[0] - nodeWidth) / (max_posX));
    } else {
      scaleNodeBreadths((size[0] - nodeWidth) / (max_posX - 1));
    }
  }

  // Find a link that breaks a cycle in the graph (if any).
  function findAndMarkCycleBreaker(nodes) {
  // Go through all nodes from the given subset and traverse links searching for cycles.
    var link;
    for (var n=nodes.length - 1; n >= 0; n--) {
      link = depthFirstCycleSearch(nodes[n], []);
      if (link) {
        return link;
      }
    }

    // Depth-first search to find a link that is part of a cycle.
    function depthFirstCycleSearch(cursorNode, path) {
      var target, link;
      for (var n = cursorNode.sourceLinks.length - 1; n >= 0; n--) {
        link = cursorNode.sourceLinks[n];
        if (link.cycleBreaker) {
          // Skip already known cycle breakers.
          continue;
        }

        // Check if target of link makes a cycle in current path.
        target = link.target;
        for (var l = 0; l < path.length; l++) {
          if (path[l].source == target) {
            // We found a cycle. Search for weakest link in cycle
            var weakest = link;
            for (; l < path.length; l++) {
              if (path[l].value < weakest.value) {
                weakest = path[l];
              }
            }
            // Mark weakest link as (known) cycle breaker and abort search.
            weakest.cycleBreaker = true;
            return weakest;
          }
        }

        // Recurse deeper.
        path.push(link);
        link = depthFirstCycleSearch(target, path);
        path.pop();
        // Stop further search if we found a cycle breaker.
        if (link) {
          return link;
        }
      }
    }
  }

  function moveSourcesRight() {
    nodes.slice()
      // Pack nodes from right to left
      .sort(function(a, b) { return b.x - a.x; })
      .forEach(function(node) {
        if (!node.targetLinks.length) {
          node.x = d3Array.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
        }
      });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      } else {
        //move node to second from right
        var nodes_to_right = 0;
        node.sourceLinks.forEach(function(n) {
          nodes_to_right = Math.max(nodes_to_right,n.target.sourceLinks.length);
        });
         if (nodes_to_right==0)node.x = x - 2;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      if (scaleNodeBreadthsByString) {
        // this scaling is suboptimal - ideally it will be moved out to sankeyNetwork.js and 
        // calculated based on measured string lengths using el.getComputedTextLength() or 
        
        node.x = summed_str_length[node.x];
      } else {
        node.x *= kx;
      }
    });
  }

  // Compute the depth (y-position) for each node.
  function computeNodeDepths(iterations) {
    var nodesByBreadth;

    if (orderByPath) {
      nodesByBreadth = new Array(max_posX);
      for (var i=0; i < nodesByBreadth.length; ++i) {
          nodesByBreadth[i] = [];
      }

      // Add 'invisible' nodes to account for different depths
      for (posX=0; posX < max_posX; ++posX) {
          for (j=0; j < nodes.length; ++j) {
              if (nodes[j].posX != posX) {
                  continue;
              }
              node = nodes[j];
              nodesByBreadth[posX].push(node);
              no_intermediary_nodes = node.sourceLinks.length && node.sourceLinks[0].target.posX > node.posX +1;
              no_end_nodes = !node.sourceLinks.length && node.posX < max_posX;

              if (no_intermediary_nodes || no_end_nodes) {
                end_node = no_intermediary_nodes? node.sourceLinks[0].target.posX : max_posX;
                  for (new_node_posX=node.posX+1; new_node_posX < end_node; ++new_node_posX) {
                      var new_node = node.constructor();
                      new_node.posX = new_node_posX;
                      new_node.dy = node.dy;
                      new_node.y = node.y;
                      new_node.value = node.value;
                      new_node.path = node.path;
                      new_node.sourceLinks = node.sourceLinks;
                      new_node.targetLinks = node.targetLinks;
                      nodesByBreadth[new_node_posX].push(new_node);
                  }
              }
          }
      }
    } else {
      nodesByBreadth = d3Collection.nest()
                             .key(function(d) { return d.x; })
                             .sortKeys(function(a, b) { return a - b; }) // pull request #124 in d3/d3-plugins
                             .entries(nodes)
                             .map(function(d) { return d.values; });

    }

    //console.log(nodesByBreadth)

    initializeNodeDepth();
    resolveCollisions();
    computeLinkDepths();

    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      computeLinkDepths();
      relaxLeftToRight(alpha);
      resolveCollisions();
      computeLinkDepths();
    }

    function initializeNodeDepth() {
      // Calculate vertical scaling factor.
      var ky = d3Array.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3Array.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            // Value-weighted average of the y-position of source node centers linked to this node.
            var y = d3Array.sum(node.targetLinks, weightedSource) / d3Array.sum(node.targetLinks, value);

            //console.log([y, node.targetLinks[0].source.y, node.targetLinks[0].sy, node.targetLinks[0] ]);
            //var y = node.targetLinks[0].source.y;
            //if (typeof node.targetLinks[0].sy != "undefined") {
            //  y = y + node.targetLinks[0].sy;
            //}
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            // Value-weighted average of the y-positions of target nodes linked to this node.
            var y = d3Array.sum(node.sourceLinks, weightedTarget) / d3Array.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (var i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (var i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      if (orderByPath) {
        return ( a.path < b.path ? -1 : (a.path > b.path ? 1 : 0 ));
      } else {
        return a.y - b.y;
      }
    }
  }

  // Compute y-offset of the source endpoint (sy) and target endpoints (ty) of links,
  // relative to the source/target node's y-position.
  // includes fix by @gmadrid in pull request #74 in d3/d3-plugins
  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
    });
    nodes.forEach(function(node) {
      node.targetLinks.sort(descendingLinkSlope);
    });
    nodes.forEach(function(node) {
      var ty = 0;
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function descendingLinkSlope(a, b) {
        function slope(l) {
          return (l.target.y - (l.source.y + l.sy)) /
              (l.target.x - l.source.x);
        }
        return slope(b) - slope(a);
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  // Y-position of the middle of a node.
  function center(node) {
    return node.y + node.dy / 2;
  }

  // Value property accessor.
  function value(x) {
    return x.value;
  }

  return sankey;
}

HTMLWidgets.widget({

    name: "sankeyNetwork",

    type: "output",

    initialize: function(el, width, height) {

        d3Selection.select(el).append("svg")
            .style("width", "100%")
            .style("height", "100%");

        return {
          sankey: sankey(),
          x: null
        };
    },

    resize: function(el, width, height, instance) {
        /*  handle resizing now through the viewBox
        select(el).select("svg")
            .attr("width", width)
            .attr("height", height + height * 0.05);

        this.renderValue(el, instance.x, instance);
        */
        
        // with flexdashboard and slides
        //   sankey might be hidden so height and width 0
        //   in this instance re-render on resize
        if( d3Array.min(instance.sankey.size()) <= 0 ) {
          this.renderValue(el, instance.x, instance);
        }
    },

    renderValue: function(el, x, instance) {

        // save the x in our instance (for calling back from resize)
        instance.x = x;
        
        // alias sankey and options
        var sankey$$1 = instance.sankey;
        var options = x.options;

        // convert links and nodes data frames to d3 friendly format
        var links = HTMLWidgets.dataframeToD3(x.links);
        var nodes = HTMLWidgets.dataframeToD3(x.nodes);

        // margin handling
        //   set our default margin to be 20
        //   will override with x.options.margin if provided
        var margin = {top: 20, right: 20, bottom: 20, left: 20};
        //   go through each key of x.options.margin
        //   use this value if provided from the R side
        Object.keys(x.options.margin).map(function(ky){
          if(x.options.margin[ky] !== null) {
            margin[ky] = x.options.margin[ky];
          }
          // set the margin on the svg with css style
          // commenting this out since not correct
          // s.style(["margin",ky].join("-"), margin[ky]);
        });

        // get the width and height
        var width = el.getBoundingClientRect().width - margin.right - margin.left;
        var height = el.getBoundingClientRect().height - margin.top - margin.bottom;

        // set this up even if d3Zoom = F
        var d3Zoom$$1 = d3Zoom.zoom().scaleExtent([.75, 3]);    

        var color = eval(options.colourScale);
        
        var color_node = function color_node(d){
          if (d.group){
            return color(d.group);
          } else {
            return options.linkColor;
          }
        };

        var color_link = function color_link(d) {
          if (d.group){
            return color(d.group);
          } else if (options.linkGradient) {
            return "url(#linearLinkGradient)";
          } else {
            return  "#CCCCCC";
          }
        };

        var animation_duration = 50;
        var opacity_node = 1;
        var opacity_link_plus = 0.45;
        
        var opacity_link = function opacity_link(d) {
          if (d.inactive) {
            return 0;
          }
          if (d.group){
            return options.linkOpacity;
          } else {
            return options.linkOpacity;
          }
        };

        var format_use = function(d) { 
          if (options.numberFormat == "pavian") {
            var formated_num;
            if (d > 1000) {
              formated_num = d3Format.format(".3s")(d);
            } else if (d > 0.001) {
              formated_num = d3Format.format(".3r")(d);
            } else {
              formated_num = d3Format.format(".3g")(d);
            }
              
            if (formated_num.indexOf('.') >= 0) {
              if (formated_num.search(/[0-9]$/ >= 0)) {
                formated_num = formated_num.replace(/0+$/, "");
                formated_num = formated_num.replace(/\.$/, "");
              } else {
                formated_num = formated_num.replace(/0+(.)/, "$1");
                formated_num = formated_num.replace(/\.(.)/, "$1");
              }
            }
            
          } else {
            formated_num = d3Format.format(options.numberFormat)(d);
          }
          return formated_num;
        };

        // create d3 sankey layout
        sankey$$1
            .nodes(d3Collection.values(nodes))
            .align(options.align)
            .links(links)
            .size([width, height - 20])
            .linkType(options.linkType)
            .nodeWidth(options.nodeWidth)
            .nodePadding(options.nodePadding)
            .scaleNodeBreadthsByString(options.scaleNodeBreadthsByString)
            .curvature(options.curvature)
            .orderByPath(options.orderByPath)
            .showNodeValues(options.showNodeValues)
            .nodeCornerRadius(options.nodeCornerRadius)
            .layout(options.iterations);


        var max_posX = d3Array.max(sankey$$1.nodes(), function(d) { return d.posX; });
        sankey$$1.nodes().forEach(function(node) { node.x = node.x * options.xScalingFactor; });

        // thanks http://plnkr.co/edit/cxLlvIlmo1Y6vJyPs6N9?p=preview
        //  http://stackoverflow.com/questions/22924253/adding-pan-d3Zoom-to-d3js-force-directed
        // allow force drag to work with pan/d3Zoom drag
        function dragstart(d) {
          d3Selection.event.sourceEvent.preventDefault();
          d3Selection.event.sourceEvent.stopPropagation();
        }


        function dragmove(d) {
          if (options.dragX || options.dragY) {
            d3Selection.select(this).attr("transform", 
                    "translate(" + 
                      (options.dragX? (d.x = Math.max(0, d3Selection.event.x)) : d.x ) + "," +
                      (options.dragY? (d.y = Math.max(0, d3Selection.event.y)) : d.y ) + ")");
            sankey$$1.relayout();
            
            // update link path description
            link.attr("d", draw_link);
          }
        }

        // select the svg element and remove existing children or previously set viewBox attribute
        var svg = d3Selection.select(el).select("svg");
        svg.selectAll("*").remove();
        svg.attr("viewBox", null);
        
        // append g for our container to transform by margin
        svg = svg
                .append("g").attr("class","zoom-layer")
                .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        //make defs and add the linear gradient
        // filters go in defs element
        var defs = svg.append("defs");

        if (options.linkGradient) {
          var lg = defs.append("linearGradient")
          .attr("id", "linearLinkGradient")
          .attr("x1", "0%")
          .attr("x2", "100%") // horizontal gradient
          .attr("y1", "0%")
          .attr("y2", "0%");

          lg.append("stop")
          .attr("offset", "0%")
          .style("stop-color", "#A0A0A0")//end in light gray
          .style("stop-opacity", 1);
        
          lg.append("stop")
          .attr("offset", "100%")
          .style("stop-color", "#D0D0D0")//start in dark gray
          .style("stop-opacity", 1);
        }
        
       
        if (options.nodeShadow) {
          // drop shadow definitions from http://bl.ocks.org/cpbotha/5200394
          // create filter with id #drop-shadow
          // height=130% so that the shadow is not clipped
          var filter = defs.append("filter")
              .attr("id", "drop-shadow")
              .attr("height", "130%")
              .attr("width", "130%");
 
          // SourceAlpha refers to opacity of graphic that this filter will be applied to
          // convolve that with a Gaussian with standard deviation 3 and store result
          // in blur
          filter.append("feGaussianBlur")
              .attr("in", "SourceAlpha")
              .attr("stdDeviation", .5)
              .attr("result", "blur");
          
          // translate output of Gaussian blur to the right and downwards with 2px
          // store result in offsetBlur
          filter.append("feOffset")
              .attr("in", "blur")
              .attr("dx", .5)
              .attr("dy", .5)
              .attr("rx", options.nodeCornerRadius)
              .attr("ry", options.nodeCornerRadius)
              .attr("result", "offsetBlur");
          
          // overlay original SourceGraphic over translated blurred opacity by using
          // feMerge filter. Order of specifying inputs is important!
          var feMerge = filter.append("feMerge");
          
          feMerge.append("feMergeNode")
              .attr("in", "offsetBlur");
          feMerge.append("feMergeNode")
              .attr("in", "SourceGraphic");
        }
        
               
        // add zooming if requested
        if (options.zoom) {
          d3Zoom$$1.on("zoom", redraw);
          function redraw() {
            d3Selection.select(el).select(".zoom-layer").attr("transform",
            "translate(" + d3Selection.event.transform.x + "," + d3Selection.event.transform.y + ")"+
            " scale(" + d3Selection.event.transform.k + ")");
          }
      
          d3Selection.select(el).select("svg")
            .attr("pointer-events", "all")
            .call(d3Zoom$$1);

          d3Selection.select(el).select("svg").on("dblclick.zoom", null);

  
        } else {
          d3Zoom$$1.on("zoom", null);
 
        }
        
        if (typeof options.title != "undefined") {
          svg.append("text")
            .attr("dy", ".5em")
            .attr("render-order", -1)
            .text(options.title)
            .style("cursor", "move")
            .style("fill", "black")
            .style("font-size", "28px")
            .style("font-family", options.fontFamily ? options.fontFamily : "inherit");
            
        }

        // draw path
        var draw_link = sankey$$1.link();

        // draw links
        var link = svg.selectAll(".link").data(sankey$$1.links());

        // new objects
        var newLink = link.enter().append("path").attr("class", "link");
        
        link = newLink.merge(link);
            
        function min1_or_dy(d) {
          return Math.max(1, d.dy);
        }


        if (options.linkType == "bezier" || options.linkType == "l-bezier") {
          link.attr("d", draw_link)
              .style("stroke",         color_link)
              .style("stroke-width",   min1_or_dy)
              .style("stroke-opacity", opacity_link)
              .style("fill",           "none");
        } else {
          link.attr("d", draw_link)
              .style("fill",         color_link)
              .style("fill-opacity", opacity_link);
        }

        link
            .sort(function(a, b) { return b.dy - a.dy; })
            .on("mouseover", function(d) {
              if (d.inactive) return;
              var sel = d3Selection.select(this);
              if (options.highlightChildLinks) {
                sel = link.filter(function(d1, i) { return(d == d1 || is_child(d.target, d1)); } );
              }
              sel
                .style("stroke-opacity", function(d){return opacity_link(d) + opacity_link_plus})
                .style("fill-opacity", function(d){return opacity_link(d) + opacity_link_plus});
            })
            .on("mouseout", function(d) {
              if (d.inactive) return;
                var sel = d3Selection.select(this);
                if (options.highlightChildLinks) {
                  sel = link.filter(function(d1, i) { return(d == d1 || is_child(d.target, d1)); } );
                }
                sel
                .style("stroke-opacity", opacity_link)
                .style("fill-opacity", opacity_link);
            });

        // add backwards class to cycles
        link.classed('backwards', function (d) { return d.target.x < d.source.x; });

        svg.selectAll(".link.backwards")
            .style("stroke-dasharray","9,1")
            .style("stroke","#402");

        // draw nodes
        var node = svg.selectAll(".node")
            .data(sankey$$1.nodes());

        function is_child (source_node, target_link) {
          for (var i=0; i < source_node.sourceLinks.length; i++) {
            if (source_node.sourceLinks[i] == target_link || is_child(source_node.sourceLinks[i].target, target_link)) {
              return true;
            } 
          }
          return false;
        }
        function is_child_node (source_node, target_node) {
          for (var i=0; i < source_node.sourceLinks.length; i++) {
            if (source_node.sourceLinks[i].target == target_node || is_child_node(source_node.sourceLinks[i].target, target_node)) {
              return true;
            } 
          }
          return false;
        }

        var newNode = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })  // change here if you wanna change
            .call(d3Drag.drag()
            .subject(function(d) { return d; })
            .on("start", function() { 
                dragstart(this);
                this.parentNode.appendChild(this); 
            })
            .on("drag", dragmove))
            .on("mouseover", function(d,i) {
              if (d.inactive) return;
              
              if (options.highlightChildLinks) {
                  link.filter(function(d1, i) { return(is_child(d, d1)); } )
                      .style("stroke-opacity", function(d){return opacity_link(d) + opacity_link_plus})
                      .style("fill-opacity", function(d){return opacity_link(d) + opacity_link_plus});
              }
              
             var t = setTimeout(function() {
               Shiny.onInputChange(el.id + '_hover', d.name);
             }, 1000);
             $(this).data('timeout', t);

            })
            .on("mouseout", function(d,i) {
              clearTimeout($(this).data('timeout')); // Clear hover timeout when the mouse leaves the node

              if (d.inactive) return;
              if (options.highlightChildLinks) {
                  link.filter(function(d1, i) { return(is_child(d, d1)); } )
                      .style("stroke-opacity", opacity_link)
                      .style("fill-opacity", opacity_link);
              }
            })
            .on("click", function(d) {
               Shiny.onInputChange(el.id + '_clicked', d.name);
            })
            .on("dblclick", function(d) {
               Shiny.onInputChange(el.id + '_clicked', d.name);
               if (!options.doubleclickTogglesChildren) {
                 return;
               }
               d.inactive = !d.inactive;

               if (d.inactive) {
                 d3Selection.select(this).selectAll('rect').style("stroke-width",options.nodeStrokeWidth+2);
                 d3Selection.select(this).selectAll('text').style('font-weight', 'bold');
               } else {
                 d3Selection.select(this).selectAll('rect').style("stroke-width",options.nodeStrokeWidth);
                 d3Selection.select(this).selectAll('text').style('font-weight', 'normal');
               }
               
               /* Draft of a transform animation of the links - not working currently
               if (d.inactive) {
                link.filter(function(d1, i) { if(is_child(d, d1)) { d1.inactive = d.inactive; return true; } else { return false; }} )
                 .attr("transform", "scale(1, 1)")
                  .transition().duration(500)
                  .delay(function(d1) { 
                    var delay = (d1.source.posX - d.posX )*100 + 50; 
                    if (!d.inactive) delay = 500 - delay;
                    return delay
                  } )
                  .attr("transform", "scale(0, 1)");
               } else {
                 link.filter(function(d1, i) { if(is_child(d, d1)) { d1.inactive = d.inactive; return true; } else { return false; }} )
                  .attr("transform", "scale(0, 1)")
                  .transition().duration(500)
                  .delay(function(d1) { 
                    var delay = (d1.source.posX - d.posX )*100 + 50; 
                    if (!d.inactive) delay = 500 - delay;
                    return delay
                  } )
                  .attr("transform", "scale(1, 1)");
                  
               } */
               
               var max_delay = (max_posX - d.posX) * animation_duration;
               
               link.filter(function(d1, i) { if(is_child(d, d1)) { d1.inactive = d.inactive; return true; } else { return false; }} )
                 .transition().duration(max_delay)
                  .delay(function(d1) { 
                    var delay = (d1.source.posX - d.posX + .5)*animation_duration; 
                    if (d.inactive) delay = max_delay - delay;
                    return delay
                  } )
                  .style("stroke-opacity", opacity_link)
                  .style("fill-opacity",   opacity_link);
               
               var new_opacity = d.inactive? 0 : opacity_node;
               node.filter(function(d1, i) { if(is_child_node(d, d1)) { d1.inactive = d.inactive; return true; } else { return false; }} )
                  .transition().duration(max_delay)
                  .delay(function(d1) { 
                    var delay = (d1.posX - d.posX + .5)*animation_duration; 
                    if (d.inactive) delay = max_delay - delay;
                    return delay
                  })
                  .style("opacity", new_opacity);
               
            });
        
        node = newNode.merge(node);
        
        // note: u2192 is right-arrow
        link.append("title")
            .text(function(d) { 
                return d.source.name + " \u2192 " + d.target.name +
                " \r\n" + format_use(d.value) + " " + options.units; });

        node
            .append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey$$1.nodeWidth())
            .style("fill", function(d) {
                if (d.targetLinks[0]) {
                  return d.color = color_node(d); 
                  return d.color = d3Color.rgb(d.targetLinks[0].source.color).darker(1); 
                } else {
                  return d.color = color_node(d); 
                }
                })
            .style("stroke", function(d) { return d3Color.rgb(d.color).darker(2); })
            .style("stroke-width", options.nodeStrokeWidth)
            .style("opacity", opacity_node )
            .style("cursor", "move")
            .attr("rx", options.nodeCornerRadius)
            .attr("ry", options.nodeCornerRadius)
			.style("filter", function(d) {
                if (options.nodeShadow) { return( "url(#drop-shadow)");  } } )
            .append("title")
            .attr("class", "tooltip")
            .attr("title", function(d) { return format_use(d.value); })
            .text(function(d) { 
                return d.name + " \r\n" + format_use(d.value) + 
                " " + options.units; });

        node
            .append("text")
            .attr("x", - options.nodeLabelMargin)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("class", "node-text")
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .style("cursor", "move")
            .style("font-size", options.fontSize + "px")
            .style("font-family", options.fontFamily ? options.fontFamily : "inherit")
            .filter(function(d) { return d.x < width / 2 || (options.align == "none"); })
            .attr("x", options.nodeLabelMargin + sankey$$1.nodeWidth())
            .attr("text-anchor", "start");
            
        if (options.showNodeValues) {
          node
            .append("text")
            .attr("x", sankey$$1.nodeWidth()/2)
            .attr("text-anchor", "middle")
            .attr("dy", "-" + (options.nodeStrokeWidth + .1 ) + "em")
            .attr("transform", null)
            .attr("class", "node-number")
            .text(function(d) { return format_use(d.value); })
            .style("cursor", "move")
            .style("font-size", ( options.fontSize - 2) + "px")
            .style("font-family", options.fontFamily ? options.fontFamily : "inherit");
        }
        
        
        // Create an array with values from 1 to max_posX
        //var axis_domain = new Array(max_posX + 1)
        //  .join().split(',')
        //  .map(function(item, index){ return ++index;})

        
        if (options.xAxisDomain) {
          
          var axisXPos = new Array(options.xAxisDomain.length);
          sankey$$1.nodes().forEach(function(node) { axisXPos[node.posX] = node.x + options.nodeWidth/2; });

          var x = d3Scale.scaleOrdinal().domain(options.xAxisDomain).range(axisXPos);
          svg.append("g").attr("class", "x axis")
             .attr("transform", "translate(0," + height + ")")  // move into position
           .call(d3Axis.axisBottom(x));
        }

        // adjust viewBox to fit the bounds of our tree
        /* // doesn't work with D3 v4
        var s = select(svg[0][0].parentNode);
        s.attr(
            "viewBox",
            [
              min(
                s.selectAll('g')[0].map(function(d){
                  return d.getBoundingClientRect().left
                })
              ) - s.node().getBoundingClientRect().left - margin.right,
              min(
                s.selectAll('g')[0].map(function(d){
                  return d.getBoundingClientRect().top
                })
              ) - s.node().getBoundingClientRect().top - margin.top,
              max(
                s.selectAll('g')[0].map(function(d){
                  return d.getBoundingClientRect().right
                })
              ) -
              min(
                s.selectAll('g')[0].map(function(d){
                  return d.getBoundingClientRect().left
                })
              )  + margin.left + margin.right,
              max(
                s.selectAll('g')[0].map(function(d){
                  return d.getBoundingClientRect().bottom
                })
              ) -
              min(
                s.selectAll('g')[0].map(function(d){
                  return d.getBoundingClientRect().top
                })
              ) + margin.top + margin.bottom
            ].join(",")
          );
          */

    },
});

})));
