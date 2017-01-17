/**
* Wrapper for d3.nest.rollup using sum.
* @param {object[]} obj
* @param {string} key - Key for nest.
* @param {string} value - Key for rollup.
* @return {d3.nest}
*/
// eslint-disable-next-line
function nestRollup(obj, key, value) {
  return d3.nest()
    .key(function(d) {
      return d[key];
    })
    .rollup(function(values) {
      return d3.sum(values, function(d) {
        return +d[value];
      });
    })
    .map(obj);
};

/**
* Join corresponding factor to array.
* @param {object[]} obj
* @param {string} on - Key of value to join on.
* @param {object} factors - Associative array of factors where the value of each
* factor (key) is an array of possible values.
* @param {string} name - Factor name.
*/
// eslint-disable-next-line
function addFactors(obj, on, factors, name) {
  for(i=0; i<obj.length; i++) {
    for (factor in factors) {
      if(factors[factor].indexOf(obj[i][on]) > -1) {
        obj[i][name] = factor;
      }
    }
    if(!obj[i][name]) {
      obj[i][name] = 'unknown';
    }
  }
};

/**
* Finds the array max, excluding outliers.
* @param {number[]} arr
* @return {number}
*/
// eslint-disable-next-line
function trimmedMax(arr) {
  arr.sort(function(a, b) {
    return a - b;
  });
  let q1 = d3.quantile(arr, 0.25);
  let q3 = d3.quantile(arr, 0.75);
  let threshold = q3 + 1.5 * (q3 - q1);
  return d3.max(arr.filter(function(d) {
    return d <= threshold;
  }));
};
