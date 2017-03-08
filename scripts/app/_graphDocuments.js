/**
* Init documents graph.
*/
// eslint-disable-next-line
function documentsGraph() {
  let table = d3.select('#documents').select('.graph-tbl')
    .append('table');

  /**
  * refresh documents graph.
  * @param {number} days - Number of days.
  */
  let refresh = function(days) {
    d3.json(urlBase + 'documents?days=' + days, function(error, obj) {
      if (error) {
        dataError(d3.select('#devices').select('.graph-tbl'));
        throw error;
      }

      let data = obj.data;
      let cols = obj.columns;
      let iuri = cols.indexOf('uri');
      let iviews = cols.indexOf('views');

      let pages = nestRollup(data, iuri, iviews).entries();

      pages = pages.filter(function(e) {
        return e.key.startsWith(domain);
      })
      .slice(0, 10);  // top 10 only

      for(i=0; i<pages.length; i++) {
        let uri = pages[i].key;
        pages[i]['html'] = '<a href=\'http://' + uri + '\'>' +
          uri.slice(uri.indexOf(domain) + domain.length) + '</a>';
      }

      let columns = [
        {key: 'html', name: 'Page', cl: 'document-page'},
        {key: 'value', name: 'Views', cl: 'document-views'},
      ];
      let rows = pages;

      table.selectAll('*').remove();
      createTable(table, columns, rows);
    });
  };

  let select = d3.select('#select-time-range');
  select.on('change.documents', function() {
    refresh(select.property('value'));
  });

  refresh(select.property('value'));
};
