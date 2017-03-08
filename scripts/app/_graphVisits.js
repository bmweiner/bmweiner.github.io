/**
* Init visits graph.
*/
// eslint-disable-next-line
function visitsGraph() {
  const totalWidth = 750;
  const totalHeight = 170;
  const margin = {top: 20, right: 30, bottom: 30, left: 30};
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  let x = d3.scaleTime().range([0, width]);
  let yViews = d3.scaleLinear().range([height, 0]);
  let yUsers = d3.scaleLinear().range([height, 0]);

  let g = d3.select('#visits').select('.graph-content')
    .append('svg')
      .attr('viewBox', '0 0 ' + totalWidth + ' ' + totalHeight)
      .attr('preserveAspectRatio', 'xMinYMin meet')
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  let axisBottom = g.append('g')
      .attr('transform', 'translate(0,' + height + ')');

  let axisLeft = g.append('g')
      .attr('class', 'views-axis');

  let axisRight = g.append('g')
      .attr('class', 'users-axis')
      .attr('transform', 'translate(' + width + ', 0)');

  let path = g.append('path').attr('class', 'views-line');

  /**
  * refresh visits graph.
  * @param {number} days - Number of days.
  */
  function refresh(days) {
    d3.json(urlBase + 'visits?days=' + days, function(error, obj) {
      if (error) {
        dataError(d3.select('#visits').select('.graph-content'));
        throw error;
      }

      let data = obj.data;
      let cols = obj.columns;
      let idate = cols.indexOf('date');
      let iusers = cols.indexOf('users');
      let iviews = cols.indexOf('views');

      let parseTime = d3.timeParse('%Y-%m-%d');
      for(i=0; i<data.length; i++) {
        let d = data[i];
        d[idate] = parseTime(d[idate]);
        d[iusers] = +d[iusers];
        d[iviews] = +d[iviews];
      }

      let dateFn = function(d) {
        return d[idate];
      };
      let usersFn = function(d) {
        return d[iusers];
      };
      let viewsFn = function(d) {
        return d[iviews];
      };

      x.domain(d3.extent(data, dateFn))
       .range([width/data.length/2, width - width/data.length/2]);
      yViews.domain([0, d3.max(data, viewsFn)]);
      yUsers.domain([0, d3.max(data, usersFn)]);

      axisBottom.transition()
        .call(d3.axisBottom(x));

      axisLeft.transition()
        .call(d3.axisLeft(yViews));

      axisRight.transition()
        .call(d3.axisRight(yUsers));

      let bars = g.selectAll('.users-bar').data(data, dateFn);

      bars.transition()
          .attr('x', function(d) {
            return x(d[idate]) - width/data.length/2;
          })
          .attr('y', function(d) {
            return yUsers(d[iusers]);
          })
          .attr('width', width/data.length - 1)
          .attr('height', function(d) {
            return height - yUsers(d[iusers]);
          });

      bars.enter().append('rect')
          .attr('class', 'users-bar')
          .attr('x', function(d) {
            return x(d[idate]) - width/data.length/2;
          })
          .attr('width', width/data.length - 1)
          .attr('y', function(d) {
            return yUsers(d[iusers]);
          })
          .attr('height', function(d) {
            return height - yUsers(d[iusers]);
          });

      bars.exit()
        .remove();

      let line = d3.line()
        .x(function(d) {
          return x(d[idate]);
        })
        .y(function(d) {
          return yViews(d[iviews]);
        });

      path.datum(data)
        .transition()
          .attr('d', line);

      let points = g.selectAll('.views-point').data(data, dateFn);

      points.transition()
        .attr('cx', function(d) {
          return x(d[idate]);
        })
        .attr('cy', function(d) {
          return yViews(d[iviews]);
        });

      points.enter()
        .append('circle')
          .attr('class', 'views-point')
          .attr('r', 2)
          .attr('cx', function(d) {
            return x(d[idate]);
          })
          .attr('cy', function(d) {
            return yViews(d[iviews]);
          });

      points.exit()
        .remove();

      // add metrics
      d3.select('#visits').select('.views-metric').select('.metric-val')
          .text(d3.sum(data, function(d) {
            return d[iviews];
          }));
      d3.select('#visits').select('.users-metric').select('.metric-val')
          .text(d3.sum(data, function(d) {
            return d[iusers];
          }));
    });
  };

  let select = d3.select('#select-time-range');
  select.on('change.visits', function() {
    refresh(select.property('value'));
  });

  refresh(select.property('value'));
};
