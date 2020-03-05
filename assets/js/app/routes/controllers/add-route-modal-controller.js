/**
 * This file contains all necessary Angular controller definitions for 'frontend.login-history' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
  'use strict';

  angular.module('frontend.routes').controller('AddRouteModalController', [
    '_',
    '$scope',
    '$rootScope',
    '$log',
    '$state',
    'RoutesService',
    'SettingsService',
    '$uibModalInstance',
    'MessageService',
    '_service',
    function controller(
      _,
      $scope,
      $rootScope,
      $log,
      $state,
      RoutesService,
      SettingsService,
      $uibModalInstance,
      MessageService,
      _service
    ) {
      var availableFormattedVersion = RoutesService.getLastAvailableFormattedVersion(
        $rootScope.Gateway.version
      );
      $scope.service = _service;
      $scope.route = angular.copy(
        RoutesService.getProperties($rootScope.Gateway.version)
      );

      // Assign service id
      $scope.route.service = {
        id: _service.id
      };

      $scope.partial =
        'js/app/routes/partials/form-route-' +
        availableFormattedVersion +
        '.html?r=' +
        Date.now();

      console.log('$scope.route', $scope.route, _service.id);

      $scope.close = function() {
        $uibModalInstance.dismiss();
      };

      $scope.onTagInputKeyPress = function($event) {
        if ($event.keyCode === 13) {
          if (!$scope.route.tags) $scope.route.tags = [];
          $scope.route.tags = $scope.route.tags.concat(
            $event.currentTarget.value
          );
          $event.currentTarget.value = null;
        }
      };

      $scope.submit = function() {
        const route = Object.assign({}, $scope.route);
        $scope.errorMessage = '';

        new Promise(resolve => {
          resolve(
            RoutesService.add(
              Object.assign(route, {
                headers: JSON.parse((route.headers || '{}').replace(/'/g, '"'))
              })
            )
          );
        })
          .then(function(res) {
            $rootScope.$broadcast('route.created');
            MessageService.success('Route created!');
            $uibModalInstance.dismiss(res);
          })
          .then(() => {
            const route = $scope.route;
            Object.keys(route).forEach(key => {
              if (Array.isArray(route[key])) {
                route[key] = [];
              }
              if (typeof route[key] === 'string') {
                route[key] = '';
              }
            });
          })
          .catch(function(err) {
            $log.error('Create new route error:', err);
            MessageService.error(
              'Submission failed. ' +
                _.get(err, 'data.body.message', err.message || err)
            );
            $scope.errors = {};
            const errorBody = _.get(err, 'data.body');
            if (errorBody) {
              if (errorBody.fields) {
                for (let key in errorBody.fields) {
                  $scope.errors[key] = errorBody.fields[key];
                }
              }
              $scope.errorMessage = errorBody.message || '';
            } else {
              $scope.errorMessage = 'An unknown error has occured';
            }
          });
      };
    }
  ]);
})();
