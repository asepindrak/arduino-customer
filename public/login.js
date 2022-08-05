var app = angular.module("app", []);
app.controller("ctrl", function ($scope, $http, $window) {
  $scope.setData = function () {
    $scope.username = "";
    $scope.password = "";
    $scope.failed = false;
  };
  $scope.setData();

  $scope.getLogin = function () {
    $scope.login = $window.localStorage.getItem("login");
    if ($scope.login == "1") {
      var landingUrl = https + "dashboard";
      $window.location.href = landingUrl;
    }
  };

  $scope.getLogin();

  $scope.login = function (event) {
    event.preventDefault();
    $http
      .get(
        `${https}auth?username=${$scope.username}&password=${$scope.password}`
      )
      .then(function (response) {
        var result = response.data;
        if (result.length > 0) {
          $window.localStorage.setItem("login", "1");
          $window.localStorage.setItem("user", JSON.stringify(result[0]));
          landingUrl = https + "dashboard";
          $window.location.href = landingUrl;
          $scope.failed = false;
        } else {
          $scope.failed = true;
        }
      });
  };
});
