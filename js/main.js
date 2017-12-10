var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0538414, lng: -118.28356183},
    zoom: 13,
    mapTypeControl: false
  });
}

var dummyItems = [
  {
    name: 'Place1'
  },
  {
    name: 'Place2'
  },
  {
    name: 'Place3'
  },
  {
    name: 'Place4'
  },
  {
    name: 'Place5'
  }
]

var ViewModel = function() {
  var self = this;

  this.placeList = ko.observableArray([]);

  dummyItems.forEach(function(place) {
    self.placeList.push(new Place(place));
  });
}

var Place = function(data) {
  this.name = ko.observable(data.name);
}

ko.applyBindings(new ViewModel());
