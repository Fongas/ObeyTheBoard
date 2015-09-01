$ = jQuery;

/**
 * Created by torstenzwoch on 30.05.14.
 */
/* AngularJS - change standard placeholder */
var module = angular.module('github', ['ngSanitize', 'LocalStorageModule', 'nl2br', 'angularLocalStorage', 'angular-sortable-view','ngRoute','ngAnimate']);
module.config(['$interpolateProvider', '$compileProvider', 'localStorageServiceProvider', function ($interpolateProvider, $compileProvider, localStorageServiceProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');

    module.directive = function (name, factory) {
        $compileProvider.directive(name, factory);
        return ( this );
    };

    // configuration of the session storage
    localStorageServiceProvider
        .setPrefix('fongas')
        .setStorageType('sessionStorage')
        .setNotify(true, true);
}]);

module.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'board.html',
        controller: 'BoardCtrl'
    }).when('/user', {
        templateUrl: 'user.html',
        controller: 'UserCtrl'
    }).otherwise({redirectTo: '/'});
}]);
angular.module('github').config(function ($controllerProvider) {
    $controllerProvider.allowGlobals();
    module.controllerProvider = $controllerProvider;
});

var MainCtrl = function MainCtrl($scope, $timeout, $http, $location) {
    $scope.repositories = [];
    $scope.users = [];

    $scope.github = {};
    $scope.githubtmp = {};
    $scope.id = "";
    $scope.github.url = "";
    $scope.github.token = "";
    $scope.editMode = false;
    $scope.showRepo = false;
    $scope.showAllUserRepos = false;
    $scope.bg = ["bg1.jpg", "bg2.jpg", "bg3.jpg", "bg4.jpg", "bg5.jpg"];
    $scope.currentBg = "bg1.jpg";
    $scope.tags = [];

    // Repos to watch of the current user
    $scope.repos = [];

    // board structure template
    $scope.boardsTemplate = {
        'name': 'Kanban Board',
        'columns': [
            {
                'name': 'Backlog',
                'issues': []
            },
            {
                'name': 'Next',
                'issues': []
            },
            {
                'name': 'Doing',
                'issues': []
            },
            {
                'name': 'Done',
                'issues': []
            }
        ]
    };

    $scope.go = function (path) {
        $location.path(path);
    };

    // load data from VersionControl (github)
    $scope.loadIssues = function (repos) {
        if(repos !== undefined){
            $scope.repos = repos;
        }
        $.each($scope.repos, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.repos[repoIndex].token + ':x-oauth-basic@api.github.com/repos/' + $scope.repos[repoIndex].url + '/labels?state=all&filter=all',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.repos[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    $.each(response, function (index, value) {
                        value.repo = $scope.repos[repoIndex].name;
                        $scope.tags.push(value);
                    });

                    console.log($scope.tags);
                });
            });

            //ISSUES
            $.ajax({
                url: 'https://' + $scope.repos[repoIndex].token + ':x-oauth-basic@api.github.com/repos/' + $scope.repos[repoIndex].url + '/issues?state=all&filter=all',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.repos[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    /* EINORDNEN DER TICKETS IN DIE COLUMNS ANHAND DER HINTERLEGTEN TAGS PRO COLUMN*/

                    /*
                    $.each(response, function (index, value) {
                        //prüfen ob die ID in den Spalten vohanden ist
                        var issueAlreadyPlanned = false;
                        $.each($scope.boards.columns, function (index2, value2) {
                            response[index]['id']
                            var resIndex = $scope.findIndexByKeyValue($scope.boards.columns[index2].issues, "id", response[index]['id']);
                            if (resIndex !== null) {
                                angular.extend($scope.boards.columns[index2].issues[resIndex], response[index]);
                                response.splice(index, 1);
                                issueAlreadyPlanned = true;
                            }
                        });
                        if (!issueAlreadyPlanned) {
                            var tmp = new Array();
                            tmp.push(response[index]);
                            $scope.repos[repoIndex].issues.push(response[index]);
                        }
                    });
                    */
                });
            });
        });

    };

    $scope.loadUserData = function () {
        $.each($scope.users, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.users[repoIndex].token + ':x-oauth-basic@api.github.com/user',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.users[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    $scope.users[repoIndex].user = response;
                });
            });
        });
    };

    $scope.loadUserRepos = function () {
        $.each($scope.users, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.users[repoIndex].token + ':x-oauth-basic@api.github.com/user/repos',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.users[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.users[repoIndex].repos = response;
                console.error(response);
            });
        });
    };
};
MainCtrl.$inject = ['$scope', '$timeout', '$http','$location'];
module.controller('MainCtrl', MainCtrl);