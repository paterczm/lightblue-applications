"use strict";

var metadataControllers = angular.module('metadataControllers', ['metadataServices']);

metadataControllers.controller('OperationsCtrl', ['$scope', '$http', '$rootScope', '$log', 'MessageService', 'LightblueService',

  function($scope, $http, $rootScope, $log, MessageService, LightblueService) {

    var self = this;

    $rootScope.isAdmin = $.inArray('lb-metadata-admin', window.roles) > -1;

    $scope.operation='view';

    $scope.showVersionSelect = true;

    $scope.operations = [
        {'id':'view', 'label':'View Entity', 'admin': false},
        {'id':'edit', 'label':'Edit Entity', 'admin': true},
        {'id':'new', 'label':'New Entity', 'admin': true},
        {'id':'version', 'label':'New Version', 'admin': true}/*,
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
                $scope.entities = response.data.entities.sort();
                delete $scope.entity;
                delete $scope.version;
                delete $scope.versions;
            });
    };

    self.loadEntities();

    self.loadVersions = function() {
        return LightblueService.call({method: 'GET', url: "rest-request/"+$scope.entity}).
            then(function(response) {
                $scope.versions = response.data.sort(function(v1, v2) {
                    return v1.version.localeCompare(v2.version);
                });
            });
    };

    self.autoSubmit = function() {

        $rootScope.submitEvent = {
                operation: $scope.operation,
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

        // control visibility depending on the operation
        switch ($scope.operation) {
            case 'view':
                $("#editButtons").hide();
                $scope.showVersionSelect = true;
                $scope.operationDesc = "View entityInfo and schema. This is read only operation.";
                break;
            case 'new':
                $("#editButtons").show();
                $scope.showVersionSelect = false;
                $scope.operationDesc = "Create new entity. You need to define both entityInfo and schema.";
                break;
            case 'edit':
                $("#editButtons").show();
                $scope.showVersionSelect = false;
                $scope.operationDesc = "Edit entity. This operation allows you to modify entityInfo.";
                break;
            case 'version':
                $("#editButtons").show();
                $scope.showVersionSelect = false;
                $scope.operationDesc = "Create new version. This operation allows you to define new schema version for existing entity.";
                break;
            default:
                ;
        }

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
                self.viewEntity();
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
