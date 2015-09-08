$ = jQuery;

/**
 * Created by torstenzwoch on 30.05.14.
 */
/* AngularJS - change standard placeholder */
var module = angular.module('github', ['ngSanitize', 'LocalStorageModule', 'nl2br', 'angularLocalStorage', 'angular-sortable-view', 'ngRoute', 'ngAnimate', 'isteven-multi-select']);
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

module.config(['$routeProvider', function ($routeProvider) {
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
    $scope.availableTags = [];
    $scope.selectedTags = [];
    $scope.showSelect = true;

    // Repos to watch of the current user
    $scope.repos = [];
    $scope.boards = undefined;

    // board structure template
    $scope.boardsTemplate = {
        'name': 'Kanban Board',
        'columns': [
            {
                'name': 'Backlog',
                'tags': [],
                'issues': []
            },
            {
                'name': 'Next',
                'tags': [],
                'issues': []
            },
            {
                'name': 'Doing',
                'tags': [],
                'issues': []
            },
            {
                'name': 'Done',
                'tags': [],
                'issues': []
            }
        ]
    };

    $scope.go = function (path) {
        $location.path(path);
    };

    $scope.$watch('boards', function (newValue, oldValue) {
        console.error($scope.boards);
        if ($scope.boards !== undefined) {
            console.log($scope.boards);
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }
    });

    $scope.$watch('selectedTags', function (newValue, oldValue) {
        console.log($scope.selectedTags);
    });

    // load data from VersionControl (github)
    $scope.loadTags = function (repos, boards) {
        if (repos !== undefined) {
            $scope.repos = repos;
        }
        if (boards !== undefined) {
            $scope.boards = boards;
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
                    var startGroup = {
                        name: '<strong>' + $scope.repos[repoIndex].name + '</strong>',
                        msGroup: true
                    };
                    //check if repo are already in list
                    var res = $.grep($scope.tags, function (n, i) {
                        return n.name == startGroup.name;
                    });
                    if (res.length == 0) {
                        $scope.tags.push(startGroup);
                        $.each(response, function (index, value) {
                            value.repo = $scope.repos[repoIndex].name;
                            $scope.tags.push(value);
                        });
                        var endGroup = {
                            msGroup: false
                        };
                        $scope.tags.push(endGroup);
                    }
                });


                $scope.$apply(function () {
                    $scope.showSelect = false;
                    $.each($scope.boards, function (index, value) {
                        $.each($scope.boards[index].columns, function (indexCol, valueCol) {
                            $scope.selectedTags = $scope.boards[index].columns[indexCol].tags;

                            var tmpAvailableTags = angular.copy($scope.tags);
                            $.each(tmpAvailableTags, function (indexAvailable, valueAvailable) { // alle verfügbaren Tags durchgehen und selected setzen

                                if (tmpAvailableTags[indexAvailable].msgroup != true) {
                                    var isSelected = $.grep($scope.selectedTags, function (n, i) {
                                        return (n.name == tmpAvailableTags[indexAvailable].name && n.repo == tmpAvailableTags[indexAvailable].repo);
                                    });

                                    if (isSelected.length == 0) {
                                        tmpAvailableTags[indexAvailable].selected = false;
                                    } else {
                                        tmpAvailableTags[indexAvailable].selected = true;
                                    }
                                }
                            });
                            if ($scope.availableTags[index] == undefined) {
                                $scope.availableTags[index] = [];
                            }
                            $scope.availableTags[index][indexCol] = tmpAvailableTags;
                        });
                    });
                    $timeout(function () {
                        $scope.loadIssues();
                        $scope.showSelect = true;
                    }, 100);
                });
            });
        });

    };

    //ISSUES
    $scope.loadIssues = function () {
        $.each($scope.repos, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.repos[repoIndex].token + ':x-oauth-basic@api.github.com/repos/' + $scope.repos[repoIndex].url + '/issues?state=all&filter=all',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.repos[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    /* EINORDNEN DER TICKETS IN DIE COLUMNS ANHAND DER HINTERLEGTEN TAGS PRO COLUMN*/
                    var board = angular.copy($scope.boards);
                    // EACH TICKET
                    $.each(response, function (index, value) {
                        //CHECK EACH BOARD
                        $.each($scope.boards, function (indexBoard, valueBoard) {
                            //CHECK IF TICKET MUST PUSH TO COLUMN
                            $.each($scope.boards[indexBoard].columns, function (indexColumn, valueColumn) {
                                //EACH TAG IN COLUMN
                                $.each($scope.boards[indexBoard].columns[indexColumn].tags, function (indexTags, valueTags) {
                                    var isSelected = $.grep(response[index].labels, function (n, i) {
                                        return (n.name == $scope.boards[indexBoard].columns[indexColumn].tags[indexTags].name && n.url == $scope.boards[indexBoard].columns[indexColumn].tags[indexTags].url);
                                    });

                                    if (isSelected.length > 0) {
                                        var isIssueInList = $.grep($scope.boards[indexBoard].columns[indexColumn].issues, function (n, i) {
                                            return (n.id == response[index].id);
                                        });
                                        if (isIssueInList == 0){
                                            $scope.boards[indexBoard].columns[indexColumn].issues.push(response[index]);
                                        }
                                    }
                                });
                            });
                        });

                        //prüfen ob die ID in den Spalten vohanden ist
                        /*var issueAlreadyPlanned = false;
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
                         }*/
                    });
                    //$scope.boards = board;
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
            });
        });
    };
};
MainCtrl.$inject = ['$scope', '$timeout', '$http', '$location'];
module.controller('MainCtrl', MainCtrl);