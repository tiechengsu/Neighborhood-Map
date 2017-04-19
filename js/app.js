var ViewModel = function(){
    var self = this;
    var map;
    var geocoder;
    var service;
    var infoWindow;
    var autocomplete;
    var markers;

    this.address = ko.observable('New York');
    this.location = new google.maps.LatLng(40.7413549, -73.9980244);
    this.resultsList = ko.observableArray();
    this.types = ko.observable('restaurant');
    this.placesResult = ko.observable('Searching for');
    //this.contentString;

    function initMap(){
        geocoder = new google.maps.Geocoder();

        map = new google.maps.Map(document.getElementById('map'),{
            center: self.location,
            zoom: 14
        });
        service = new google.maps.places.PlacesService(map);
        infoWindow = new google.maps.InfoWindow();
        autocomplete = new google.maps.places.Autocomplete(document.getElementById('address'));
        markers = [];

        self.placesService();

    }

    //search for address from submit
    this.codeAddress = function(){
        //clear all the markers first
        self.clearOverlays();
        geocoder.geocode({'address':self.address()},function(results,status){
            if(status == 'OK'){
                self.location = results[0].geometry.location;
                map.setCenter(self.location);
                self.placesService();
            }else{
                alert('Geocode was not successful for the following reason: '+status);
            }
        });
    };

    //search for nearby places
    this.placesService = function(){
        var request = {
            location: self.location,
            radius: '2000',
            types: [self.types()]
        };

        service.nearbySearch(request, function(results, status){
            self.resultsList([]);
            if(status == google.maps.places.PlacesServiceStatus.OK){
                for(var i=0; i<results.length; i++){
                    var place = results[i];
                    self.addMarker(place);
                    self.resultsList.push(place);
                }
                self.placesResult(results.length + ' ' + self.types() + ' found near ' + self.address());
                console.log(self.resultsList());
            }
        });
    };

    //add marker to the map
    this.addMarker = function(place){
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        markers.push(marker);

        google.maps.event.addListener(marker, 'click', function(){


            service.getDetails(place, function(result,status){
                if(status !== google.maps.places.PlacesServiceStatus.OK){
                    console.error(status);
                    return;
                }
                console.log(result);
                contentString = '<div><strong>'+ result.name + '</strong><br>' +
                '<img src="'+ result.photos[0].getUrl({'maxWidth': 50, 'maxHeight': 50})+'">' +
                '<div>' + result.formatted_address + '</div>' +
                '<div>' + result.formatted_phone_number + '</div>' +
                '</div>';
                console.log("first");
                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
            });

        });
    };

    this.getDetail = function(place){

    };


    //pan to the place being clicked
    this.panTo = function(clickedPlace){
        map.panTo(clickedPlace.geometry.location);
        map.setZoom(16);
    };

    this.clearOverlays = function(){
        while(markers.length){
            markers.pop().setMap(null);
        }
    };

    initMap();
}

ko.applyBindings(new ViewModel());

