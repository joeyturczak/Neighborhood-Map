var map;

var initialPlaces = [];

var viewModel;

function mapsError() {
  alert('There was a problem loading the page. Please check your connection and try again.');
  $('#progress-bar').hide();
}

// Initialize a map and add markers to places we are interested in.
// Much of the google maps api code is borrowed from Udacity's Google Maps APIs course
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0538414, lng: -118.28356183},
    zoom: 13,
    mapTypeControl: false
  });

  // Initialize Markers object
  Markers.init();

  // Get locations and then apply bindings to the viewmodel
  var placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: 'donuts',
    location: map.getCenter(),
    radius: 500
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createPlaces(results);
      viewModel = new ViewModel();
      ko.applyBindings(viewModel);
      // Display the list of places
      $('.mdc-permanent-drawer').show();
      // Hide the progress bar
      $('#progress-bar').hide();
    }
  });

  // Add places to viewmodel
  function createPlaces(places) {
    for (var i = 0; i < places.length; i++) {
      var place = places[i];
      initialPlaces.push(place);
    }
  }
}

var ViewModel = function() {
  var self = this;

  // Create bindingHandlers to keep track of list item elements
  // https://stackoverflow.com/questions/10126812/knockout-js-get-dom-object-associated-with-data
  ko.bindingHandlers.el = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      var value = valueAccessor();
      value(element);
    }
  };
  // jQuery object version
  ko.bindingHandlers.$el = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      var value = valueAccessor();
      value($(element).first());
    }
  };

  // Create ko.observable for each place.
  this.placeList = ko.observableArray([]);

  initialPlaces.forEach(function(place) {
    self.placeList.push(new Place(place));
  });

  // Keep track of the selected place.
  this.currentPlace = ko.observable({});

  // List item callback to change current place and update the selected marker.
  this.changePlace = function(place) {
    Markers.selectMarker(place);
  }

  // Returns place object with provided placeId.
  this.getPlaceById = function(placeId) {
    for(var i = 0; i < self.filteredPlaces().length; i++) {
      if(self.filteredPlaces()[i].id() == placeId) {
        return self.filteredPlaces()[i];
      }
    }
  }

  // Toggle selected list item
  this.toggleFocus = function(place) {
    self.currentPlace(place);
    var $enabled = $('.mdc-permanent-drawer--selected');
    $enabled.each(function() {
      $(this).toggleClass('mdc-permanent-drawer--selected');
    });
    var element;
    for(var i = 0; i < self.filteredPlaces().length; i++) {
      if(self.filteredPlaces()[i] == place) {
        element = self.filteredPlaces()[i].el();
      }
    }
    var $element = $(element);
    if(!$element.hasClass('mdc-permanent-drawer--selected')) {
      $element.addClass('mdc-permanent-drawer--selected');
    } else {
      $element.removeClass('mdc-permanent-drawer--selected');
    }
  }

  this.input = ko.observable('');

  // Filter places list by filter input
  // http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
  this.filteredPlaces = ko.computed(function() {
    var filter = this.input().toLowerCase();
    // If there is no input, then show all markers
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

  // Returns true if "string" contains "contains"
  // Inspired by https://stackoverflow.com/questions/30168480/ko-utils-stringstartswith-not-working
  var contains = function(string, contains) {
    string = string || "";
    if (contains.length > string.length) {
      return false;
    }
    return string.indexOf(contains) !== -1;
  }
}

// Stores place data from google places api
var Place = function(place) {
  var self = this;

  self.el = ko.observable();
  self.$el = ko.observable();

  this.name = ko.observable(place.name);
  this.id = ko.observable(place.id);
  this.lat = ko.observable(place.geometry.location.lat());
  this.lng = ko.observable(place.geometry.location.lng());

  // Create a marker for the place
  Markers.addMarker(place);
}

// Markers object
var Markers = {
  markers: [],
  infoWindow: {},
  defaultIcon: {},
  highlightedIcon: {},
  init: function() {
    Markers.defaultIcon = Markers.makeMarkerIcon('ff9800');
    Markers.highlightedIcon = Markers.makeMarkerIcon('448aff');
  },
  // Add a marker to the map
  addMarker: function(place) {
    var marker = new google.maps.Marker({
      map: map,
      title: place.name,
      icon: Markers.defaultIcon,
      animation: google.maps.Animation.DROP,
      position: place.geometry.location,
      id: place.id
    });
    if($.isEmptyObject(Markers.infoWindow)) {
      Markers.infoWindow = new google.maps.InfoWindow();
    }
    marker.addListener('click', function() {
      Markers.showInfoWindow(marker, place.id);
    });
    Markers.markers.push(marker);
  },
  // Returns marker with provided placeId
  getMarker: function(placeId) {
    var marker;
    for (var i = 0; i < Markers.markers.length; i++) {
      if(Markers.markers[i].id == placeId) {
        marker = Markers.markers[i];
        break;
      }
    }
    return marker;
  },
  // Displays marker with provided placeId
  showMarker: function(placeId) {
    var marker = Markers.getMarker(placeId);
    marker.setVisible(true);
  },
  // Displays all markers
  showAllMarkers: function() {
    for(var i = 0; i < Markers.markers.length; i++) {
      Markers.showMarker(Markers.markers[i].id);
    }
  },
  // Hides marker with provided placeId
  hideMarker: function(placeId) {
    var marker = Markers.getMarker(placeId);
    if(Markers.infoWindow.marker == marker) {
      Markers.infoWindow.close();
      marker.setIcon(Markers.defaultIcon);
    }
    marker.setVisible(false);
  },
  // Display infoWindow on selected marker
  showInfoWindow: function(marker, placeId) {
    map.panTo(marker.getPosition());
    Markers.getFoursquareData(viewModel.getPlaceById(placeId));
    Markers.infoWindow.marker = marker;
    Markers.setInfoWindowContent('<div class="mdc-typography--title infowindow-title">' +
                                 marker.title + '</div>');
    Markers.infoWindow.open(map, marker);
    Markers.infoWindow.addListener('closeclick', function() {
      marker.setIcon(Markers.defaultIcon);
      viewModel.toggleFocus(null);
    });
    Markers.toggleHighlight(marker);
    viewModel.toggleFocus(viewModel.getPlaceById(placeId));
  },
  setInfoWindowContent: function(contentStr) {
    Markers.infoWindow.setContent('<article class="infowindow">' +
                                  contentStr + '</article>');
  },
  // Select "place" marker
  selectMarker: function(place) {
    var marker = Markers.getMarker(place.id());
    Markers.showInfoWindow(marker, place.id());
  },
  // Create marker icon
  makeMarkerIcon: function(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
      null,
      null,
      null,
      new google.maps.Size(28, 50)
    );
    return markerImage;
  },
  // Highlight selected marker
  toggleHighlight: function(marker) {
    for(var i = 0; i < Markers.markers.length; i++) {
      Markers.markers[i].setIcon(Markers.defaultIcon);
    }
    marker.setIcon(Markers.highlightedIcon);
  },
  // Get tips from Foursquare
  getFoursquareData: function(place) {
    var client_id = '5JWL2A0UG5CEPEIOJMOO3WEFBSMHXYQEHZJ0TDCHBJUHWB4A';
    var client_secret = 'WORV3DYKGTA13JERVWNWJSXSFWTPKMW0GSUNUGBYENASPGM0';

    // Get venue id
    $.ajax({
      url: 'https://api.foursquare.com/v2/venues/search',
      dataType: 'json',
      data: 'v=20161016&limit=1&ll=' + place.lat() + ',' + place.lng() + '&query=' +
            place.name() + '&client_id=' + client_id + '&client_secret=' + client_secret + '',
      async: true,
      success: function(data) {
        var venue_id = data.response.venues['0'].id;
        $.ajax({
          url: 'https://api.foursquare.com/v2/venues/' + venue_id + '/tips',
          dataType: 'json',
          data: 'v=20161016&limit=3&client_id=' + client_id + '&client_secret=' + client_secret + '',
          async: true,
          success: function(data) {
            // Save 3 tips and display them in infoWindow
            var tips = [];
            var count = data.response.tips.count > 3 ? 3 : data.response.tips.count;
            if(count) {
              for (var i = 0; i < count; i++) {
                tips.push(data.response.tips.items[i]);
              }
            }
            addTipsToInfoWindow(venue_id, tips);
          },
          error: function() {
            foursquareError();
          }
        });
      },
      error: function() {
        foursquareError();
      }
    });

    // Display error when Foursquare connection fails
    function foursquareError() {
      var contentStr = '<div class="mdc-typography--title infowindow-title">' +
                       place.name() + '</div><div class="mdc-typography--body2">' +
                       'Cannot connect to Foursquare</div>';
      Markers.setInfoWindowContent(contentStr);
    }

    // Display tips from Foursquare in infowinow
    function addTipsToInfoWindow(venueId, tips) {
      var contentStr = '';
      contentStr += '<div class="mdc-typography--title infowindow-title">' +
                    '<a href="http://foursquare.com/v/' + venueId + '">' +
                    place.name() + '</a></div>' +
                    'Tips from Foursquare:<ul id="tips">';
      if(tips.length > 0) {
        for(var i = 0; i < tips.length; i++) {
          contentStr += '<li class="mdc-typography--body2">' + tips[i].text + '</li>';
        }

      } else {
        contentStr += '<li class="mdc-typography--body2">No tips to display</li>';
      }
      contentStr += '</ul><img class="foursquare-logo" src="img/powered-by-foursquare.png" alt="Foursquare logo">';
      Markers.setInfoWindowContent(contentStr);
    }
  }
}

// Re-center the map if screen is resized
// https://codepen.io/alexgill/pen/NqjMma
window.onresize = function() {
  var currCenter = map.getCenter();
  google.maps.event.trigger(map, 'resize');
  map.setCenter(currCenter);
};
