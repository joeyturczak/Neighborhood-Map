var map;

var initialPlaces = [];

var viewModel;

function gm_authFailure() {
  console.log('authFailure');
}

//https://stackoverflow.com/questions/14687237/google-maps-api-async-loading
setTimeout(function() {
  if(!window.google || !window.google.maps) {
    //handle script not loaded
    console.log('authFailure');
    alert('There was a problem loading the map. Please check your connection and try again.');
  }
}, 4000);

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0538414, lng: -118.28356183},
    zoom: 13,
    mapTypeControl: false
  });

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

  //https://stackoverflow.com/questions/10126812/knockout-js-get-dom-object-associated-with-data

  ko.bindingHandlers.el = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      var value = valueAccessor();
      //assign value to observable (we specified in html)
      value(element);
    }
  };

  ko.bindingHandlers.$el = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      var value = valueAccessor();
      //here we first create a jQuery object by using $(myelem)
      //before updating observable value
      value($(element).first());
    }
  };

  this.placeList = ko.observableArray([]);

  initialPlaces.forEach(function(place) {
    self.placeList.push(new Place(place));
  });

  this.currentPlace = ko.observable({});

  this.changePlace = function(place) {
    Markers.selectMarker(place);
  }

  this.getPlaceById = function(placeId) {
    for(var i = 0; i < self.filteredPlaces().length; i++) {
      if(self.filteredPlaces()[i].id() == placeId) {
        return self.filteredPlaces()[i];
      }
    }
  }

  this.toggleFocus = function(place) {
    self.currentPlace(place);
    var $enabled = $('.mdc-permanent-drawer--selected');
    $enabled.each(function() {
      $(this).toggleClass('mdc-permanent-drawer--selected');
    });
    var element;
    console.log(place);
    for(var i = 0; i < self.filteredPlaces().length; i++) {
      if(self.filteredPlaces()[i] == place) {
        element = self.filteredPlaces()[i].el();
        console.log(element);
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

  //http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html

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

  // Inspired by
  // https://stackoverflow.com/questions/30168480/ko-utils-stringstartswith-not-working

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

  self.el = ko.observable();
  self.$el = ko.observable();

  this.name = ko.observable(place.name);
  this.id = ko.observable(place.id);
  this.lat = ko.observable(place.geometry.location.lat());
  this.lng = ko.observable(place.geometry.location.lng());
  // console.log(this.lat());
  // console.log(place.name);

  Markers.addMarker(place);
}

var Markers = {
  markers: [],
  infoWindow: {},
  defaultIcon: {},
  highlightedIcon: {},
  init: function() {
    Markers.defaultIcon = Markers.makeMarkerIcon('ff9800');
    Markers.highlightedIcon = Markers.makeMarkerIcon('448aff');
  },
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
    // marker.addListener('mouseover', function() {
    //   this.setIcon(Markers.highlightedIcon);
    // });
    // marker.addListener('mouseout', function() {
    //   this.setIcon(Markers.defaultIcon);
    // });
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
    if(Markers.infoWindow.marker == marker) {
      Markers.infoWindow.close();
      marker.setIcon(Markers.defaultIcon);
    }
    marker.setMap(null);
  },
  showInfoWindow: function(marker, placeId) {
    // console.log(viewModel.getPlaceById(placeId));
    Markers.getFoursquareData(viewModel.getPlaceById(placeId));
    Markers.infoWindow.marker = marker;
    Markers.infoWindow.setContent('<article class="infowindow"><div class="mdc-typography--title infowindow-title">' + marker.title + '</div><div class="mdc-typography--subheading1">Tips from Foursquare:<ul id="tips"></div></div></article>');
    Markers.infoWindow.open(map, marker);
    Markers.infoWindow.addListener('closeclick', function() {
      marker.setIcon(Markers.defaultIcon);
      viewModel.toggleFocus(null);
    });
    Markers.toggleHighlight(marker);
    console.log(marker);
    viewModel.toggleFocus(viewModel.getPlaceById(placeId));
  },
  selectMarker: function(place) {
    var marker = Markers.getMarker(place.id());
    Markers.showInfoWindow(marker, place.id());
  },
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
  toggleHighlight: function(marker) {
    for(var i = 0; i < Markers.markers.length; i++) {
      Markers.markers[i].setIcon(Markers.defaultIcon);
    }
    marker.setIcon(Markers.highlightedIcon);
  },
  getFoursquareData: function(place) {
    var client_id = '5JWL2A0UG5CEPEIOJMOO3WEFBSMHXYQEHZJ0TDCHBJUHWB4A';
    var client_secret = 'WORV3DYKGTA13JERVWNWJSXSFWTPKMW0GSUNUGBYENASPGM0';

    $.ajax({
      url: 'https://api.foursquare.com/v2/venues/search',
      dataType: 'json',
      data: 'v=20161016&limit=1&ll='+place.lat()+','+place.lng()+'&query='+place.name()+'&client_id='+client_id+'&client_secret='+client_secret+'',
      async: true,
      success: function(data) {
        // getVenues(data);
        // showVenues(data);
        var venue_id = data.response.venues['0'].id;
        $('.infowindow-title').html('<a href="http://foursquare.com/v/' + venue_id + '">' + place.name() + '</a>');
        $.ajax({
          url: 'https://api.foursquare.com/v2/venues/'+venue_id+'/tips',
          dataType: 'json',
          data: 'v=20161016&limit=3&client_id='+client_id+'&client_secret='+client_secret+'',
          async: true,
          success: function(data) {
            // Save 3 tips and display them in infoWindow
            showVenues(data);
            var tips = [];
            var count = data.response.tips.count > 3 ? 3 : data.response.tips.count;
            if(count) {
              for (var i = 0; i < count; i++) {
                tips.push(data.response.tips.items[i]);
              }
            }
            addTipsToInfoWindow(tips);
          },
          error: function() {
            console.log('tipsError');
            foursquareError();
          }
        });
      },
      error: function() {
        console.log('ajaxError');
        foursquareError();
      }
    });

    function showVenues(data) {
      console.log(data);
    }

    function foursquareError() {
      $('#tips').html('Failed to connect to Foursquare');
    }

    function addTipsToInfoWindow(tips) {
      console.log(tips);
      var $tipElem = $('#tips');
      if(tips.length > 0) {
        for(var i = 0; i < tips.length; i++) {
          $tipElem.append('<li class="mdc-typography--body2">' + tips[i].text) + '</li>';
        }
      } else {
        $tipElem.html("No tips to display");
      }
      $tipElem.after('<img class="foursquare-logo" src="img/powered-by-foursquare.png" alt="Foursquare logo">')
    }
  }
}

//https://codepen.io/alexgill/pen/NqjMma
window.onresize = function() {
  var currCenter = map.getCenter();
  google.maps.event.trigger(map, 'resize');
  map.setCenter(currCenter);
  console.log('resize');
};

//ko.applyBindings(new ViewModel());
