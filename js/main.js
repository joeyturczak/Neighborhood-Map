var map;

var initialPlaces = [];

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
      initialPlaces.push(place);
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

  initialPlaces.forEach(function(place) {
    self.placeList.push(new Place(place));
  });

  this.currentPlace = ko.observable(this.placeList()[0]);

  this.changePlace = function(data, event) {
    self.currentPlace(data);
    self.toggleFocus(event.target);
    console.log(data);
  }

  this.toggleFocus = function(element) {
    var $enabled = $('.mdc-permanent-drawer--selected');
    $enabled.each(function() {
      $(this).toggleClass('mdc-permanent-drawer--selected');
    });
    var $element = $(element);
    if(!$element.hasClass('mdc-permanent-drawer--selected')) {
      $element.addClass('mdc-permanent-drawer--selected');
    } else {
      $element.removeClass('mdc-permanent-drawer--selected');
    }
  }

  this.input = ko.observable('');

  this.filteredPlaces = ko.computed(function() {
    var filter = this.input().toLowerCase();
    if (!filter) {
      Markers.showAllMarkers();
      return this.placeList();
    } else {
      return ko.utils.arrayFilter(this.placeList(), function(place) {
        if(contains(place.name().toLowerCase(), filter)) {
          // Show marker
          Markers.showMarker(place.id());
          return true;
        } else {
          // Hide marker
          Markers.hideMarker(place.id());
          return false;
        }
        return contains(place.name().toLowerCase(), filter);
      });
    }
  }, this);

  this.toggleMarker = function(place) {

  }

  var contains = function(string, contains) {
    string = string || "";
    if (contains.length > string.length) {
      return false;
    }
    return string.indexOf(contains) !== -1;
  }
}

var Place = function(place) {
  var self = this;

  this.name = ko.observable(place.name);
  this.id = ko.observable(place.id);

  Markers.addMarker(place);
}

var Markers = {
  markers: [],
  infoWindow: {},
  addMarker: function(place) {
    var marker = new google.maps.Marker({
      map: map,
      title: place.name,
      position: place.geometry.location,
      id: place.id
    });
    if($.isEmptyObject(Markers.infoWindow)) {
      Markers.infoWindow = new google.maps.InfoWindow();
    }
    marker.addListener('click', function() {
      Markers.showInfoWindow(marker);
    });
    Markers.markers.push(marker);
  },
  getMarker: function(placeId) {
    var marker;
    for (var i = 0; i < Markers.markers.length; i++) {
      if(Markers.markers[i].id == placeId) {
        marker = Markers.markers[i];
        break;
      }
    }
    // console.log(marker);
    return marker;
  },
  showMarker: function(placeId) {
    var marker = Markers.getMarker(placeId);
    marker.setMap(map);
  },
  showAllMarkers: function() {
    for(var i = 0; i < Markers.markers.length; i++) {
      Markers.showMarker(Markers.markers[i].id);
    }
  },
  hideMarker: function(placeId) {
    var marker = Markers.getMarker(placeId);
    marker.setMap(null);
  },
  showInfoWindow: function(marker) {
    Markers.infoWindow.marker = marker;
    Markers.infoWindow.open(map, marker);
  }
}

//ko.applyBindings(new ViewModel());
