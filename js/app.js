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
    this.toggleSymbol = ko.observable('glyphicon glyphicon-collapse-up');

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

        //remove the right margin of infowindow
        //refer to http://en.marnoto.com/2014/09/5-formas-de-personalizar-infowindow.html
        google.maps.event.addListener(infoWindow,'domready',function(){
            var iwOuter = $('.gm-style-iw');
            var iwCloseBtn = iwOuter.next();

            iwCloseBtn.css({
                opacity: '1',
                left: '300px', top: '3px',
                'border-radius': '13px',
                'box-shadow': '0 0 5px #3990B9'
            });

            iwCloseBtn.mouseout(function(){
                $(this).css({opacity:'1'});
            });

            var iwBackground = iwOuter.prev();
            //remove the background shadow div
            iwBackground.children(':nth-child(2)').css({'display':'none'});
            //remove the white background div
            iwBackground.children(':nth-child(4)').css({'display':'none'});

            iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});

        });

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
            position: place.geometry.location,
            title: place.name
        });

        markers.push(marker);

        google.maps.event.addListener(marker, 'click', function(){
            service.getDetails(place, function(result,status){
                if(status !== google.maps.places.PlacesServiceStatus.OK){
                    console.error(status);
                    return;
                }
                console.log(result);
                var contentString = self.contentString(result);
                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
                self.addInfo(result);
            });

        });
    };

    this.contentString = function(result){
        var contentString = '<div class="iw-container">'+
                '<div><img src="'+ result.photos[0].getUrl({'maxWidth': 350})+'"></div>' +
                '<div class="iw-title">'+
                '<strong>'+ result.name + '</strong>'+
                '<div class="iw-rating-review-price"></div>' +
                '</div>' +
                '<div class="iw-info"><span class="icon glyphicon glyphicon-map-marker"></span>' + result.vicinity + '</div>' +
                '<div class="iw-info" id="iw-phone"><span class="icon glyphicon glyphicon-earphone"></span> ' + result.formatted_phone_number + '</div>' +
                '<div class="iw-info" id="iw-website"><a href="'+ result.website+'"><span class="icon glyphicon glyphicon-globe"></span> '+result.website+'</a></div>' +
                '</div>';
        return contentString;
    };

    this.addInfo = function(result){
        //add opening_hours
        if(result.opening_hours){
            if(result.opening_hours.open_now){
                $('<div class="iw-info"><span class="icon glyphicon glyphicon-time"></span>  Open Now</div>').insertAfter($('#iw-phone'));
            }else{
                $('<div class="iw-info"><span class="icon glyphicon glyphicon-time"></span> Close Now</div>').insertAfter($('#iw-phone'));
            }

            var weekday_text = '<div class="panel-group">'+
            '<div class="panel panel-default">'+
            '<div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapse1">open hours</a></h4></div>' +
            '<div id="collapse1" class="panel-collapse collapse">'+
            '<ul class="list-group"></ul>'+
            '</div></div></div>';

            $(weekday_text).insertBefore($('#iw-website'));
            result.opening_hours.weekday_text.forEach(function(text){
                $('.list-group').append('<li class="list-group-item">'+text+'</li>');
            });
        }
        if(result.rating){
            $(".iw-rating-review-price").append('<span> '+ result.rating +' </span>');
            var rating = parseInt(result.rating);
            for(let i=0; i<5; i++){
                if(i<rating){
                    $(".iw-rating-review-price").append('<span class="glyphicon glyphicon-star"></span>');
                }else{
                    $(".iw-rating-review-price").append('<span class="glyphicon glyphicon-star-empty"></span>');
                }
            }
        }
        //add price level
        if(result.price_level){
            $(".iw-rating-review-price").append(" ");
            var price_level = parseInt(result.price_level);
            for(let i=0; i<price_level; i++){
                $(".iw-rating-review-price").append('<span class="glyphicon glyphicon-usd"></span>');
            }
        }
    };


    //pan to the place being clicked
    this.panTo = function(clickedPlace){
        map.panTo(clickedPlace.geometry.location);
        map.setZoom(16);
        for(let i=0; i<markers.length; i++){
            if(clickedPlace.name === markers[i].title){
                service.getDetails(clickedPlace, function(result,status){
                    if(status !== google.maps.places.PlacesServiceStatus.OK){
                        console.error(status);
                        return;
                    }

                    var contentString = self.contentString(result);
                    infoWindow.setContent(contentString);
                    infoWindow.open(map, markers[i]);
                    self.addInfo(result);
                });
                break;
            }
        }
    };

    this.clearOverlays = function(){
        while(markers.length){
            markers.pop().setMap(null);
        }
    };

    this.listToggle = function(){
        if(self.toggleSymbol()==='glyphicon glyphicon-collapse-up'){
            self.toggleSymbol('glyphicon glyphicon-collapse-down');
        }else{
            self.toggleSymbol('glyphicon glyphicon-collapse-up');
        }
    }

    initMap();
}

ko.applyBindings(new ViewModel());

