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