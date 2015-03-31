"use strict";

var metadataControllers = angular.module('metadataControllers', ['metadataServices']);

metadataControllers.controller('OperationsCtrl', ['$scope', '$http', '$rootScope', '$log', 'MessageService',

  function($scope, $http, $rootScope, $log, MessageService) {

    var self = this;

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

    self.autoSubmit = function() {
        // TODO: form validation

        $rootScope.submitEvent = {
                operation: $scope.operation.id,
                entity: $scope.entity,
                version: $scope.version
                };

        $log.debug("Auto submit: "+JSON.stringify($rootScope.submitEvent));
    }

    $scope.$watch('operation', function() {
        self.autoSubmit();
    });

    $scope.$watch('entity', function() {
        self.autoSubmit();
    });

    $scope.$watch('version', function() {
        self.autoSubmit();
    });

  }]);

metadataControllers.controller('JsonEditorCtrl', ['$scope', '$http', '$rootScope', '$log', 'MessageService',

  function($scope, $http, $rootScope, $log, MessageService) {

    var self = this;

    $scope.editorVisible = false;

    $rootScope.$watch('submitEvent', function(submitEvent, oldValue) {
        if (!$rootScope.submitEvent)
            return;

        $scope.editorVisible = true;

        switch ($rootScope.submitEvent.operation) {
            case 'view':
                $("#editButtons").hide();
                self.viewEntity();
                break;
            case 'new':
                $("#editButtons").show();
                break;
            case 'edit':
                $("#editButtons").show();
                break;
            case 'version':
                $("#editButtons").show();
                break;
            default:
                ;
        }
    });

    $scope.reset = function() {
        self.viewEntity();
    };

    $scope.save = function() {
        switch ($rootScope.submitEvent.operation) {
            case 'new':
                self.createNewEntity();
                break;
            case 'edit':
                self.editEntity();
                break;
            case 'version':
                self.createNewVersion();
            default:
                ;
        }
    };

    self.viewEntity = function() {
        $http({method: 'GET', url: "rest-request/"+$rootScope.submitEvent.entity+"/"+$rootScope.submitEvent.version}).
        then(function(response) {
            // TODO: handle error

            var metadata = response.data;

            $("#json").val(JSON.stringify(metadata));
            $("#editor").jsonEditor(metadata, { change: updateJSON, propertyclick: showPath, isEditable: $rootScope.submitEvent.operation != 'view' });

        });
    };

    self.createNewEntity = function() {
        var json = JSON.parse($("#json").val());

        var entityName = json.schema.name;
        var entityVersion = json.schema.version.value;

        $http({method: 'PUT', url: "rest-request/"+entityName+"/"+entityVersion, data: json}).
        then(function(response) {
            // TODO: handle error

            MessageService.showSuccessMessage("Successfully created a new entity");
            $log.debug("Successfully created a new entity");
        });
    };

    self.editEntity = function() {
        var json = JSON.parse($("#json").val());

        var entityName = json.entityInfo.name;

        $http({method: 'PUT', url: "rest-request/"+entityName, data: json}).
        then(function(response) {
            // TODO: handle error

            MessageService.showSuccessMessage("Successfully edited entityInfo");
            $log.debug("Successfully edited entityInfo");
        });
    };

    self.createNewVersion = function() {
        var json = JSON.parse($("#json").val());

        var entityName = json.schema.name;
        var entityVersion = json.schema.version.value;

        $http({method: 'PUT', url: "rest-request/"+entityName+"/schema="+entityVersion, data: json}).
        then(function(response) {
            // TODO: handle error

            MessageService.showSuccessMessage("Successfully created new version");
            $log.debug("Successfully created new version");
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