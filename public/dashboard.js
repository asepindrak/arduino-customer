var app = angular.module("app", []);
app.controller("ctrl", function ($scope, $http, $window) {
  $scope.setData = function () {
    $scope.date_start = "";
    $scope.date_end = "";
    $scope.review = "";
    $scope.total = 0;
    $scope.reviews = [];
    $scope.page = 1;
    $scope.limit = 10;
    $scope.totalTP = 0;
    $scope.totalP = 0;
    $scope.totalSP = 0;
    $scope.user = {};
  };
  $scope.setData();
  $scope.getLogin = function () {
    $scope.login = $window.localStorage.getItem("login");
    if ($scope.login == "1") {
      $scope.user = JSON.parse($window.localStorage.getItem("user"));
    } else {
      var landingUrl = https + "admin";
      $window.location.href = landingUrl;
    }
  };

  $scope.getLogin();

  $scope.formatDate = (date) => {
    if (date == "") {
      return "";
    }
    const d = new Date(date);
    const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
    const mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
    const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);

    return `${da}-${mo}-${ye}`;
  };
  $scope.getTotal = function () {
    $http
      .get(
        `${https}get-total?date_start=${$scope.formatDate(
          $scope.date_start
        )}&date_end=${$scope.formatDate($scope.date_end)}&review=${
          $scope.review
        }`
      )
      .then(function (response) {
        var result = response.data;
        console.log(result);
        $scope.total = result[0].total;
        console.log($scope.total);
      });
  };
  $scope.getTotal();

  $scope.getTotalData = function () {
    $scope.totalTP = 0;
    $scope.totalP = 0;
    $scope.totalSP = 0;
    $http
      .get(
        `${https}get-total-data?date_start=${$scope.formatDate(
          $scope.date_start
        )}&date_end=${$scope.formatDate($scope.date_end)}&review=${
          $scope.review
        }`
      )
      .then(function (response) {
        var result = response.data;
        $scope.totalTP = result.totalTP;
        $scope.totalP = result.totalP;
        $scope.totalSP = result.totalSP;
      });
  };

  $scope.getData = function () {
    $scope.totalTP = 0;
    $scope.totalP = 0;
    $scope.totalSP = 0;
    $http
      .get(
        `${https}get-review?page=${$scope.page}&limit=${
          $scope.limit
        }&date_start=${$scope.formatDate(
          $scope.date_start
        )}&date_end=${$scope.formatDate($scope.date_end)}&review=${
          $scope.review
        }`
      )
      .then(function (response) {
        var result = response.data;
        console.log(result);
        $scope.reviews = result;
        $scope.getTotalData();
      });
  };
  $scope.getData();

  $scope.filterData = function (event) {
    event.preventDefault();

    $scope.totalTP = 0;
    $scope.totalP = 0;
    $scope.totalSP = 0;
    $scope.page = 1;
    $scope.getTotal();
    $http
      .get(
        `${https}get-review?page=${$scope.page}&limit=${
          $scope.limit
        }&date_start=${$scope.formatDate(
          $scope.date_start
        )}&date_end=${$scope.formatDate($scope.date_end)}&review=${
          $scope.review
        }`
      )
      .then(function (response) {
        var result = response.data;
        $scope.reviews = result;

        $scope.getTotalData();
      });
  };
  $scope.next = () => {
    if ($scope.page * $scope.limit < $scope.total) {
      $scope.page += 1;
      $scope.getData();
    }
  };
  $scope.prev = () => {
    if ($scope.page > 1) {
      $scope.page -= 1;
      $scope.getData();
    }
  };

  $scope.logout = function () {
    $window.localStorage.setItem("login", "0");
    $window.localStorage.setItem("user", "");
    var landingUrl = https + "admin";
    $window.location.href = landingUrl;
  };
});
