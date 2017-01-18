---
---

{% include_relative _utils.js %}
{% include_relative _graphUtils.js %}
{% include_relative _graphVisits.js %}
{% include_relative _graphLocations.js %}
{% include_relative _graphDevices.js %}
{% include_relative _graphDocuments.js %}

const domain = 'bmweiner.com';

{% if jekyll.environment == "development" %}
  const urlBase = 'http://localhost:5000/data/';
{% else %}
  const urlBase = 'https://crumby-crumby.rhcloud.com/data/';
{% endif %}

visitsGraph();
locationsGraph();
devicesGraph();
documentsGraph();