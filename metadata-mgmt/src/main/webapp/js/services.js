 "use strict";

var metadataServices = angular.module('metadataServices', []);

// Show messages in #alert-box div. This is one of the things that are so much easier to do in jQuery.
metadataServices.service('MessageService', ['$log', function($log){

    var self = this;

    self.showErrorMessage = function(message) {
        $('#alert-box').append(self.createBoostrapAlertDiv('alert-danger', "<strong>Error!</strong> "+message));
    }

    self.showLightblueErrorMessage = function(jsonMessage) {
        $log.error(JSON.stringify(jsonMessage));
        self.showErrorMessage(jsonMessage.errorCode);
    }

    self.showSuccessMessage = function(message) {
        var div = self.createBoostrapAlertDiv('alert-success', "<strong>Success!</strong> "+message);

        $('#alert-box').append(div);

        // remove success message after 3s
        setTimeout(function() {
           div.slideUp('slow', function() { $(this).remove(); });
        }, 3000);
    }

    self.createBoostrapAlertDiv = function(clazz, htmlMessage) {
        return $(document.createElement('div'))
            .addClass('alert')
            .addClass(clazz)
            .html("<a href='#' class='close' data-dismiss='alert'>&times;</a>"+htmlMessage);
    }

}]);

// Call lightblue with error handling
// TODO: replace with https://github.com/alechenninger/lightblue.js
metadataServices.service('LightblueService', ['$http', '$q', 'MessageService', function($http, $q, MessageService){

    var self = this;

    var isLightblueError = function(response) {
        if (response.data.objectType == "error") {
            return true;
        }

        return false;
    };

    self.call = function(httpOptions) {
        return $http(httpOptions).
            then(function(response) {
                if (isLightblueError(response)) {
                    MessageService.showLightblueErrorMessage(response.data);
                    return $q.reject(response.data);
                }

                return response;
            }, function(response){
                MessageService.showErrorMessage("Http status code: "+response.status);
                $log.error('Server responded with an error: '+JSON.stringify(response));
                return $q.reject(response.data);
            });
    };

}]);