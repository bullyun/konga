/**
 * This file contains all necessary Angular controller definitions for 'frontend.login-history' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
  'use strict';

  angular.module('frontend.routes').controller('RouteDetailsController', [
    '$scope',
    '$rootScope',
    '$log',
    '$state',
    'RoutesService',
    'MessageService',
    'SettingsService',
    '_route',
    function controller(
      $scope,
      $rootScope,
      $log,
      $state,
      RoutesService,
      MessageService,
      SettingsService,
      _route
    ) {
      var availableFormattedVersion = RoutesService.getLastAvailableFormattedVersion(
        $rootScope.Gateway.version
      );
      const routeState = $scope.route || _route;
      const routeHeaders = routeState.headers;

      function isEmptyObject(val) {
        return (
          Object.prototype.toString.call(val) === '[object Object]' &&
          !Object.keys(val).length
        );
      }

      // 在传输一个空的 [] 时，将返回一个 {}，此为 kong 的 BUG，故以下手动更新为 Array 类型。
      // 由 /api/controllers/KongProxyController.js 的 84, 88, 125, 157 可见
      // 并未对 kong 的响应做过处理，那么以上 BUG 即是 Kong 服务器上的 Bug
      Object.keys(routeHeaders).forEach(headerKey => {
        if (isEmptyObject(routeHeaders[headerKey])) {
          routeHeaders[headerKey] = [];
        }
      });

      $scope.route = Object.assign(routeState, {
        headers: routeState.headers ? JSON.stringify(routeState.headers) : ''
      });
      $scope.settings = SettingsService.getSettings();
      $scope.partial =
        'js/app/routes/partials/form-route-' +
        availableFormattedVersion +
        '.html?r=' +
        Date.now();

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
        $scope.loading = true;

        new Promise(resolve => {
          const route = $scope.route;
          const payload = Object.assign({}, $scope.route, {
            hosts: route.hosts || [],
            paths: route.paths || [],
            methods: route.methods || [],
            protocols: route.protocols || [],
            headers:
              JSON.parse((route.headers || '{}').replace(/'/g, '"')) || {}
          });
          // if(!$scope.route.snis) $scope.route.snis = [];
          // if(!$scope.route.sources) $scope.route.sources = [];
          // if(!$scope.route.destinations) $scope.route.destinations = [];

          console.log('Submitting route', payload);

          resolve(
            RoutesService.update(payload.id, _.omit(payload, ['id', 'data']))
          );
        })
          .then(function(res) {
            $log.debug('Update Route: ', res);
            $scope.loading = false;
            MessageService.success('Route updated successfully!');
          })
          .catch(function(err) {
            console.log('err', err);
            $scope.loading = false;
            var errors = {};
            Object.keys(err.data.body).forEach(function(key) {
              MessageService.error(key + ' : ' + err.data.body[key]);
            });
            $scope.errors = errors;
          });
      };
    }
  ]);
})();
