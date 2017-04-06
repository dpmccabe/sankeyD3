### rollup

```
rollup -g d3-selection:d3,d3-array:d3,d3-zoom:d3,d3-scale:d3,d3-color:d3,d3-drag:d3,d3-collection:d3,d3-axis:d3,d3-interpolate:d3 -f umd -n sankeyNetwork -o sankeyNetwork-rollup.js -- index.js
```

### browserify

```
browserify sankeyNetwork-rollup.js > sankeyNetwork.js
```

### copy to htmlwidgets

```
cp sankeyNetwork.js ../inst/htmlwidgets/sankeyNetwork.js
```

### optional | uglify


```
uglifyjs sankeyNetwork.js -c -m -o sankeyNetwork.min.js
```