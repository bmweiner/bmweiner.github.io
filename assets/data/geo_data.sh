curl 'http://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_state_20m.zip' -OJ
unzip -o cb_2015_us_state_20m.zip cb_2015_us_state_20m.shp cb_2015_us_state_20m.dbf
rm cb_2015_us_state_20m.zip
shp2json cb_2015_us_state_20m.shp | geo2topo states="-" -q 1e5 \
  | toposimplify -p 0.05 -f > us.json
