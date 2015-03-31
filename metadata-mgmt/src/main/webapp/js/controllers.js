"use strict";

var metadataControllers = angular.module('metadataControllers', []);

metadataControllers.controller('OperationsCtrl', ['$scope', '$http', '$rootScope', '$log',

  function($scope, $http, $rootScope, $log) {

    $scope.operations = [
        {'id':'view', 'label':'View Entity'},
        {'id':'edit', 'label':'Edit Entity'},
        {'id':'new', 'label':'New Entity'},
        {'id':'version', 'label':'New Version'},
        {'id':'roles', 'label':'View Roles'},
        {'id':'summary', 'label':'View Summary'}
    ];

    $http({method: 'GET', url: "rest-request/"}).
        then(function(response) {
            // TODO: handle error
            $scope.entities = response.data.entities;
        });

    $scope.onEntitySelected = function() {
        $http({method: 'GET', url: "rest-request/"+$scope.entity}).
        then(function(response) {
            // TODO: handle error
            $scope.versions = response.data;
        });
    }

    $scope.submit = function() {
        // TODO: form validation

        $rootScope.submitEvent = {
                operation: $scope.operation.id,
                entity: $scope.entity,
                version: $scope.version
                };

        $log.debug("Submit: "+JSON.stringify($rootScope.submitEvent));
    }

  }]);

metadataControllers.controller('JsonEditorCtrl', ['$scope', '$http', '$rootScope', '$log',

  function($scope, $http, $rootScope, $log) {

    $scope.editorVisible = false;

    $rootScope.$watch('submitEvent', function(submitEvent, oldValue) {
        if (!$rootScope.submitEvent)
            return;

        $scope.editorVisible = true;

        $scope.loadJson();

        switch ($rootScope.submitEvent.operation) {
            case 'view':
                $("#editButtons").hide();
                break;
            default:
                ;
        }
    });

    $scope.loadJson = function() {
        $http({method: 'GET', url: "rest-request/"+$rootScope.submitEvent.entity+"/"+$rootScope.submitEvent.version}).
        then(function(response) {
            // TODO: handle error

            var metadata = response.data;

            $("#json").val(JSON.stringify(metadata));
            $("#editor").jsonEditor(metadata, { change: updateJSON, propertyclick: showPath, isEditable: $rootScope.submitEvent.operation != 'view' });

        });
    };

    $scope.beautify = function() {
        var jsonText = $('#json').val();
        $('#json').val(JSON.stringify(JSON.parse(jsonText), null, 4));
    };

    $scope.uglify = function() {
        var jsonText = $('#json').val();
        $('#json').val(JSON.stringify(JSON.parse(jsonText)));
    };

  }]);