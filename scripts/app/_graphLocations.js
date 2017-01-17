/**
* Init locations graph.
*/
// eslint-disable-next-line
function locationsGraph() {
  const width = 450;
  const height = 300;

  const colorStart = '#CACAD0';
  const colorStop = '#2c74b1';

  const legendX = width - 35;
  const legendY = height - 80;

  let projection = d3.geoAlbersUsa()
      .scale(600)
      .translate([width / 2, height / 2]);

  let path = d3.geoPath()
      .projection(projection);

  let heatmap = d3.scaleLinear()
        .interpolate(d3.interpolateRgb)
        .range([colorStart, colorStop]);

  let g = d3.select('#locations').select('.graph-content')
    .append('svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMinYMin meet')
    .append('g')
      .attr('class', 'states');

  let gradient = g.append('defs')
    .append('linearGradient')
      .attr('id', 'locations-map-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')
      .attr('spreadMethod', 'pad');

    g.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', 10)
        .attr('height', 50)
        .style('fill', 'url(#locations-map-gradient)');

    g.append('text')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('dx', -5)
        .attr('dy', -5)
        .attr('font-size', 10)
        .text('Users');

    let legendGroup = g.append('g');

  d3.json('/assets/data/us.json', function(error, us) {
    if (error) throw error;

    d3.json('/assets/data/countries.json', function(error, world) {
      if (error) throw error;

      let usStates = g.selectAll('path')
          .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append('path')
          .attr('d', path)
          .attr('id', function(d) {
            return d.properties.NAME;
          })
          .style('fill', function(d) {
            return heatmap(0);
          });

      g.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) {
            return a !== b;
          }))
          .attr('class', 'state-border')
          .attr('d', path);

      world = d3.map(world, function(d) {
        return d['alpha-2'];
      });

      let table = d3.select('#locations').select('.graph-tbl')
        .append('table');

      /**
      * refresh locations graph.
      * @param {number} days - Number of days.
      */
      function refresh(days) {
        d3.json(urlBase + 'locations?days=' + days, function(error, obj) {
          if (error) {
            dataError(d3.select('#locations').select('.graph-content'));
            throw error;
          }

          let data = obj.data;
          let states = nestRollup(data, 'state', 'users');
          let countries = nestRollup(data, 'country', 'users');

          let trimMax = trimmedMax(states.values());
          let realMax = d3.max(states.values());

          heatmap.domain([0, trimMax]);

          let legendData = [
            {color: colorStart, text: 0},
            {color: colorStop, text: trimMax},
          ];
          if (trimMax != realMax) {
            legendData.push({color: heatmap(realMax), text: realMax});
          }

          let gradientStops = gradient.selectAll('stop').data(legendData);

          gradientStops.transition()
              .attr('stop-color', function(d) {
                return d.color;
              })
              .attr('offset', function(d, i) {
                if(i == 0) {
                  return '0%';
                } else if(i == legendData.length - 1) {
                  return '100%';
                } else{
                  return 100 / (legendData.length - 1) * i + '%';
                }
              });

          gradientStops.enter()
            .append('stop')
              .attr('stop-opacity', 1)
              .attr('stop-color', function(d) {
                return d.color;
              })
              .attr('offset', function(d, i) {
                if(i==0) {
                  return '0%';
                } else if(i==legendData.length - 1) {
                  return '100%';
                } else{
                  return 100 / (legendData.length - 1) * i + '%';
                }
              });

          gradientStops.exit()
            .remove();

          let legendText = legendGroup.selectAll('text').data(legendData);

          legendText.transition()
              .attr('dy', function(d, i) {
                if(i==0) {
                  return 5;
                } else if(i==legendData.length - 1) {
                  return 52;
                } else{
                  return 50 / (legendData.length - 1) * i + 3;
                }
              })
              .text(function(d) {
                return d.text;
              });

          legendText.enter()
            .append('text')
              .attr('x', legendX)
              .attr('y', legendY)
              .attr('dx', 15)
              .attr('dy', function(d, i) {
                if(i==0) {
                  return 5;
                } else if(i==legendData.length - 1) {
                  return 52;
                } else{
                  return 50 / (legendData.length - 1) * i + 3;
                }
              })
              .attr('font-size', 7)
              .text(function(d) {
                return d.text;
              });

          legendText.exit()
            .remove();

          usStates.style('fill', function(d) {
            return heatmap(states.get(d.properties.NAME) || 0);
          });

          let columns = [
            {key: 'key', name: 'Country', cl: 'country'},
            {key: 'value', name: 'Users', cl: 'users'},
          ];
          let rows = countries.entries();

          rows.forEach(function(obj) {
            let country = world.get(obj.key);
            if (country) {
              obj.key = country.name;
            }else{
              obj.key = 'Unknown';
            }
          });

          table.selectAll('*').remove();
          createTable(table, columns, rows);
        });
      };
      let select = d3.select('#select-time-range');
      select.on('change.locations', function() {
        refresh(select.property('value'));
      });

      refresh(select.property('value'));
    });
  });
};
