"use strict";

var metadataControllers = angular.module('metadataControllers', ['metadataServices']);

metadataControllers.controller('OperationsCtrl', ['$scope', '$http', '$rootScope', '$log', 'MessageService', 'LightblueService',

  function($scope, $http, $rootScope, $log, MessageService, LightblueService) {

    var self = this;

    $scope.operations = [
        {'id':'view', 'label':'View Entity'},
        {'id':'edit', 'label':'Edit Entity'},
        {'id':'new', 'label':'New Entity'},
        {'id':'version', 'label':'New Version'}/*,
        {'id':'roles', 'label':'View Roles'},
        {'id':'summary', 'label':'View Summary'}*/
        // TODO: implement roles and summary views
    ];

    $scope.onEntitySelected = function() {
        self.loadVersions();
    };

    self.loadEntities = function() {
        return LightblueService.call({method: 'GET', url: "rest-request/"}).
            then(function(response) {
                $scope.entities = response.data.entities;
                delete $scope.entity;
                delete $scope.version;
                delete $scope.versions;
            });
    };

    self.loadEntities();

    self.loadVersions = function() {
        return LightblueService.call({method: 'GET', url: "rest-request/"+$scope.entity}).
            then(function(response) {
                $scope.versions = response.data;
            });
    };

    self.autoSubmit = function() {
        // TODO: form validation

        $rootScope.submitEvent = {
                operation: $scope.operation.id,
                entity: $scope.entity,
                version: $scope.version
                };

        $log.debug("Auto submit: "+JSON.stringify($rootScope.submitEvent));
    };

    $rootScope.$watch('forceReload', function(forceReload, previousForceReload) {
       if (forceReload == true && previousForceReload != true) {
           $rootScope.forceReload = false;

           $log.debug("Reloading entities");
           self.loadEntities();
       }
    });

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

metadataControllers.controller('JsonEditorCtrl', ['$scope', '$http', '$rootScope', '$log', 'MessageService', 'LightblueService',

  function($scope, $http, $rootScope, $log, MessageService, LightblueService) {

    var self = this;

    $scope.editorVisible = true;

    $rootScope.$watch('submitEvent', function(submitEvent, oldValue) {
        if (!$rootScope.submitEvent)
            return;

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

        if ($rootScope.submitEvent && $rootScope.submitEvent.entity && $rootScope.submitEvent.version) {

            LightblueService.call({method: 'GET', url: "rest-request/"+$rootScope.submitEvent.entity+"/"+$rootScope.submitEvent.version}).
            then(function(response) {
                var metadata = response.data;

                $("#json").val(JSON.stringify(metadata));
                $("#editor").jsonEditor(metadata, { change: updateJSON, propertyclick: showPath, isEditable: $rootScope.submitEvent.operation != 'view' });
            });
        }
    };

    self.createNewEntity = function() {
        try {
            var metadata = JSON.parse($("#json").val());

            var entityName = metadata.entityInfo.name;
            var entityVersion = metadata.schema.version.value;

            LightblueService.call({method: 'PUT', url: "rest-request/"+entityName+"/"+entityVersion, data: metadata}).
            then(function(response) {
                MessageService.showSuccessMessage("Successfully created a new entity");
                $log.debug("Successfully created a new entity");
                // Reload data in OperationsCtrl
                $rootScope.forceReload = true;
            });
        } catch (e) {
            MessageService.showErrorMessage("Could not create lightblue request: "+e);
        }
    };

    self.editEntity = function() {
        try {
            var metadata = JSON.parse($("#json").val());

            var entityName = metadata.entityInfo.name;
            var entityInfo = metadata.entityInfo;

            LightblueService.call({method: 'PUT', url: "rest-request/"+entityName, data: entityInfo}).
            then(function(response) {
                MessageService.showSuccessMessage("Successfully edited entityInfo");
                $log.debug("Successfully edited entityInfo");
            });
        } catch (e) {
            MessageService.showErrorMessage("Could not create lightblue request: "+e);
        }
    };

    self.createNewVersion = function() {
        try {
            var metadata = JSON.parse($("#json").val());

            var entityName = metadata.schema.name;
            var entityVersion = metadata.schema.version.value;
            var schema = metadata.schema;

            LightblueService.call({method: 'PUT', url: "rest-request/"+entityName+"/schema="+entityVersion, data: schema}).
            then(function(response) {
                MessageService.showSuccessMessage("Successfully created new version");
                $log.debug("Successfully created new version");

                // Reload data in OperationsCtrl
                $rootScope.forceReload = true;
            });
        } catch (e) {
            MessageService.showErrorMessage("Could not create lightblue request: "+e);
        }
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