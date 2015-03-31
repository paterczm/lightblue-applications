"use strict";

var metadataControllers = angular.module('metadataControllers', []);

metadataControllers.controller('OperationsCtrl', ['$scope', '$window',

  function($scope, $window) {

    $scope.operations = [
        {'id':'view', 'label':'View Entity'},
        {'id':'edit', 'label':'Edit Entity'},
        {'id':'new', 'label':'New Entity'},
        {'id':'version', 'label':'New Version'},
        {'id':'roles', 'label':'View Roles'},
        {'id':'summary', 'label':'View Summary'}
    ];

  }]);