/**
* Init devices graph.
*/
// eslint-disable-next-line
function devicesGraph() {
  const deviceFactors = {
    desktop: ['macos', 'windows', 'linux'],
    mobile: ['iphone', 'android'],
  };

  const systemFactors = {
    windows: ['windows'],
    apple: ['iphone', 'macos'],
    linux: ['linux'],
    android: ['android'],
  };

  const fa = d3.map([
    {name: 'windows', t: '\uf17a', cl: 'fa-windows'},
    {name: 'apple', t: '\uf179', cl: 'fa-apple'},
    {name: 'linux', t: '\uf17c', cl: 'fa-linux'},
    {name: 'android', t: '\uf17b', cl: 'fa-android'},
    {name: 'desktop', t: '\uf109', cl: 'fa-laptop'},
    {name: 'mobile', t: '\uf10b', cl: 'fa-mobile'},
    {name: 'unknown', t: '\uf128', cl: 'fa-question'},
  ], function(d) {
    return d.name;
  });

  const totalWidth = 400;
  const totalHeight = 50;
  const margin = {top: 10, right: 20, bottom: 10, left: 20};
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  let color = d3.scaleOrdinal()
    .range(d3.schemeCategory10);

  let x = d3.scaleLinear().range([0, width]);

  let svg = d3.select('#platforms').select('.graph-content')
    .append('svg')
      .attr('viewBox', '-20 -10 ' + totalWidth + ' ' + totalHeight)
      .attr('preserveAspectRatio', 'xMinYMin meet');

  let ul = d3.select('#platforms').select('.graph-metrics').append('ul');

  /**
  * refresh devices graph.
  * @param {number} days - Number of days.
  */
  function refresh(days) {
    d3.json(urlBase + 'platforms?days=' + days, function(error, obj) {
      if (error) {
        dataError(d3.select('#devices').select('.graph-content'));
        throw error;
      }

      let data = obj.data;
      let cols = obj.columns;
      let iplatform = cols.indexOf('platform');
      let iusers = cols.indexOf('users');
      let isystem = cols.length;
      let idevice = cols.length + 1;

      addFactors(obj.data, iplatform, systemFactors, isystem);
      addFactors(obj.data, iplatform, deviceFactors, idevice);
      let systems = nestRollup(data, isystem, iusers).entries();
      let devices = nestRollup(data, idevice, iusers).entries();

      systems.sort(d3.descending);

      x.domain([0, d3.sum(devices, function(d) {
        return d.value;
      })]);

      let xOffset = 0;
      for(i=0; i<devices.length; i++) {
        devices[i]['x'] = xOffset;
        xOffset += devices[i]['value'];
      }

      let g = svg.selectAll('g').data(devices);

      g.exit().remove();

      let gEnter = g.enter()
        .append('g');

      gEnter.append('rect')
          .attr('fill', function(d) {
            return color(d.key);
          })
          .attr('class', function(d) {
            return d.key;
          })
          .attr('x', function(d) {
            return x(d.x);
          })
          .attr('height', height)
          .attr('width', function(d) {
            return x(d.value);
          });

      gEnter.append('text')
          .attr('x', function(d) {
            return x(d.x) + x(d.value)/2;
          })
          .attr('y', height/2)
          .text(function(d) {
            return fa.get(d.key).t;
          });

      g = gEnter.merge(g);

      g.select('rect')
          .attr('x', function(d) {
            return x(d.x);
          })
          .attr('width', function(d) {
            return x(d.value);
          });

      g.select('text')
          .attr('x', function(d) {
            return x(d.x) + x(d.value)/2;
          });

      let li = ul.selectAll('li').data(systems);

      li.exit().remove();

      let liEnter = li.enter()
        .append('li');

      liEnter.append('i')
          .attr('class', function(d) {
            return 'fa ' + fa.get(d.key).cl;
          });

      liEnter.append('p')
          .text(function(d) {
            return d.value;
          });

      li = liEnter.merge(li);

      li.select('i')
          .attr('class', function(d) {
            return 'fa ' + fa.get(d.key).cl;
          });

      li.select('p')
          .text(function(d) {
            return d.value;
          });
    });
  };

  let select = d3.select('#select-time-range');
  select.on('change.devices', function() {
    refresh(select.property('value'));
  });

  refresh(select.property('value'));
};
