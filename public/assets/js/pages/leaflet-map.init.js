var mymap = L.map("Leaf_default").setView([51.505, -0.09], 13),
  popup =
    (L.tileLayer(
      "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
      {
        maxZoom: 18,
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: "mapbox/streets-v11",
      }
    ).addTo(mymap),
    L.marker([51.5, -0.09])
      .addTo(mymap)
      .bindPopup("<b>Hello world!</b><br />I am a popup.")
      .openPopup(),
    L.circle([51.508, -0.11], 500, {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
    })
      .addTo(mymap)
      .bindPopup("I am a circle."),
    L.polygon([
      [51.509, -0.08],
      [51.503, -0.06],
      [51.51, -0.047],
    ])
      .addTo(mymap)
      .bindPopup("I am a polygon."),
    L.popup());
function onMapClick(e) {
  popup
    .setLatLng(e.latlng)
    .setContent("You clicked the map at " + e.latlng.toString())
    .openOn(mymap);
}
mymap.on("click", onMapClick);
var bounds3,
  rectangle3,
  osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  osm = new L.TileLayer(osmUrl, { maxZoom: 18 }),
  latLng = new L.LatLng(54.18815548107151, -7.657470703124999),
  bounds1 = new L.LatLngBounds(
    new L.LatLng(54.559322, -5.767822),
    new L.LatLng(56.1210604, -3.02124)
  ),
  bounds2 = new L.LatLngBounds(
    new L.LatLng(56.56023925701561, -2.076416015625),
    new L.LatLng(57.01158038001565, -0.9777832031250001)
  ),
  map = new L.Map("Bounds_Extend", {
    layers: [osm],
    center: bounds1.getCenter(),
    zoom: 7,
  }),
  rectangle1 = new L.Rectangle(bounds1),
  rectangle2 = new L.Rectangle(bounds2),
  marker = new L.Marker(latLng);
function boundsExtendBounds() {
  rectangle3 && (map.removeLayer(rectangle3), (rectangle3 = null)),
    (bounds3 = bounds3 && null),
    (bounds3 = new L.LatLngBounds(
      bounds1.getSouthWest(),
      bounds1.getNorthEast()
    )).extend(bounds2),
    (rectangle3 = new L.Rectangle(bounds3, {
      color: "#ff0000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0,
    })),
    map.addLayer(rectangle3);
}
function boundsExtendLatLng() {
  rectangle3 && (map.removeLayer(rectangle3), (rectangle3 = null)),
    (bounds3 = bounds3 && null),
    (bounds3 = new L.LatLngBounds(
      bounds1.getSouthWest(),
      bounds1.getNorthEast()
    )).extend(marker.getLatLng()),
    (rectangle3 = new L.Rectangle(bounds3, {
      color: "#ff0000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0,
    })),
    map.addLayer(rectangle3);
}
map.addLayer(rectangle1).addLayer(rectangle2).addLayer(marker);
for (
  var osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    osmAttrib =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }),
    poly_points = [
      [39.70348880963439, -104.98603820800781],
      [39.69926245589766, -104.95582580566406],
      [39.67918374111695, -104.94483947753906],
      [39.663856582926165, -104.95307922363281],
      [39.66279941218785, -104.98672485351562],
      [39.70348880963439, -104.98603820800781],
    ],
    path_points = [
      [39.72567292003209, -104.98672485351562],
      [39.717222671644635, -104.96612548828124],
      [39.71405356154611, -104.95513916015625],
      [39.70982785491674, -104.94758605957031],
      [39.70454535762547, -104.93247985839844],
      [39.696092520737224, -104.91874694824217],
      [39.687638648548635, -104.90432739257812],
      [39.67759833072648, -104.89471435546875],
    ],
    i = 0,
    latlngs = [],
    len = path_points.length;
  i < len;
  i++
)
  latlngs.push(new L.LatLng(path_points[i][0], path_points[i][1]));
for (
  var path = new L.Polyline(latlngs),
    i = 0,
    latlngs2 = [],
    len = poly_points.length;
  i < len;
  i++
)
  latlngs2.push(new L.LatLng(poly_points[i][0], poly_points[i][1]));
for (
  var poly = new L.Polygon(latlngs2),
    osmUrl =
      ((map = new L.Map("Vector_bounds", {
        layers: [osm],
        center: new L.LatLng(39.69596043694606, -104.95084762573242),
        zoom: 12,
      })).addLayer(path),
      map.addLayer(poly),
      path.bindPopup("Hello world"),
      "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"),
    osmAttrib =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }),
    map = L.map("Moov_Canvas", { preferCanvas: !0 })
      .setView([50.5, 30.51], 15)
      .addLayer(osm),
    markers = [],
    colors = ["red", "green", "blue", "purple", "cyan", "yellow"],
    i = 0;
  i < 20;
  i++
)
  markers.push(
    L.circleMarker([50.5, 30.51], { color: colors[i % colors.length] }).addTo(
      map
    )
  );
function update() {
  var t = new Date().getTime() / 1e3;
  markers.forEach(function (e, a) {
    var o = t * (1 + a / 10) + ((12.5 * a) / 180) * Math.PI;
    e.setLatLng([
      50.5 + (a % 2 ? 1 : -1) * Math.sin(o) * 0.005,
      30.51 + (a % 3 ? 1 : -1) * Math.cos(o) * 0.005,
    ]);
  }),
    L.Util.requestAnimFrame(update);
}
update();
var map = L.map("Array_Map", { center: [20, 20], zoom: 3, preferCanvas: !0 }),
  points =
    (L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 1,
      maxZoom: 17,
      label: "open street map",
    }).addTo(map),
    [
      [0, 0],
      [0, 42],
      [42, 42],
      [0, 0],
    ]);
L.polygon([points, []], { dashArray: "5, 5" }).addTo(map),
  L.circleMarker([42, 0], { color: "red" }).addTo(map);
(map = L.map("V_Simple")).setView([51.505, -0.09], 13);
var marker = L.marker([51.5, -0.09])
    .bindPopup("<b>Hello world!</b><br />I am a popup.")
    .addTo(map),
  circle = L.circle([51.508, -0.11], 500, { color: "#f03", opacity: 0.7 })
    .bindPopup("I am a circle.")
    .addTo(map),
  polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047],
  ])
    .bindPopup("I am a polygon.")
    .addTo(map),
  osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmAttrib =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }).addTo(map);
