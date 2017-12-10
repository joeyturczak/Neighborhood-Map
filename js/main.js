var map;

var markers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0538414, lng: -118.28356183},
    zoom: 13,
    mapTypeControl: false
  });

  // Get locations and then apply bindings to the viewmodel
  var placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: 'donuts',
    location: map.getCenter(),
    radius: 500
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createPlaces(results);
      ko.applyBindings(new ViewModel());
      console.log(results);
    }
  });

  function createPlaces(places) {
    for (var i = 0; i < places.length; i++) {
      var place = places[i];
      var marker = new google.maps.Marker({
        map: map,
        title: place.name,
        position: place.geometry.location,
        id: place.id
      });
      markers.push(marker);
    }
  }
}

var dummyItems = [
  {
    title: 'Place1'
  },
  {
    title: 'Place2'
  },
  {
    title: 'Place3'
  },
  {
    title: 'Place4'
  },
  {
    title: 'Place5'
  }
]

var ViewModel = function() {
  var self = this;

  this.placeList = ko.observableArray([]);

  markers.forEach(function(place) {
    self.placeList.push(new Place(place));
  });

  this.currentPlace = ko.observable(this.placeList()[0]);

  this.changePlace = function(data, event) {
    self.currentPlace(data);
    self.toggleFocus(event.target);
    console.log(data);
  }

  this.toggleFocus = function(element) {
    var $enabled = $('.enabled');
    $enabled.each(function() {
      $(this).toggleClass('enabled');
    });
    var $element = $(element);
    if(!$element.hasClass('enabled')) {
      $element.addClass('enabled');
    } else {
      $element.removeClass('enabled');
    }
  }
}

var Place = function(data) {
  this.title = ko.observable(data.title);
}

var Marker = function(data) {

}

//ko.applyBindings(new ViewModel());
