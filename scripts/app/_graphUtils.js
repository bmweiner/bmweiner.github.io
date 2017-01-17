/**
* Removes content of tag and appends error message.
* @param {d3.select} node - Selected tag.
*/
// eslint-disable-next-line
function dataError(node) {
  node.selectAll('*').remove();
  node.append('p')
    .text('(encountered error while retrieving data)')
    .attr('class', 'graph-err-msg');
};

/**
* Creates html table with d3.
* @param {d3.select} table - Selected table tag.
* @param {object[]} columns - Column settings, one row per column.
* @param {string} columns[].key - Key in row which corresponds to column.
* @param {string} columns[].name - Column name.
* @param {string} columns[].cl - Column class.
* @param {object[]} rows - Data for each row where key corresponds to
* {@link columns[].key} and value is the cell value.
* @param {boolean} [header=true] - Append thead to table.
*/
// eslint-disable-next-line
function createTable(table, columns, rows, header) {
  header = typeof header !== 'undefined' ? header : true;

  if(header) {
    table.append('thead').append('tr')
      .selectAll('th')
      .data(columns)
      .enter().append('th')
        .text(function(column) {
          return column.name;
      });
  }

  table.append('tbody')
    .selectAll('tr')
    .data(rows)
    .enter().append('tr')
    .selectAll('td')
    .data(function(row) {
      return columns.map(function(column) {
        let cell = {};
        cell['value'] = row[column.key];
        cell['column'] = column;
        return cell;
        });
      })
    .enter().append('td')
      .html(function(cell) {
        return cell.value;
      })
      .attr('class', function(cell) {
        return cell.column.cl;
      });

    table.selectAll('tbody tr')
      .sort(function(a, b) {
        return d3.descending(a.value, b.value);
      });
};
