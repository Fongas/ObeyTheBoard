$ = jQuery;

/**
 * Created by torstenzwoch on 30.05.14.
 */
/* AngularJS - change standard placeholder */
var module = angular.module('github', ['ngSanitize', 'LocalStorageModule', 'nl2br', 'angularLocalStorage', 'angular-sortable-view', 'ngRoute', 'ngAnimate', 'isteven-multi-select', 'ui.bootstrap']);
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
    $scope.selectedStates = [];
    $scope.availableRepoStates = [];
    $scope.showSelect = true;
    $scope.defaultBoardLabels = [
        {
            "name": "BOARD: BACKLOG",
            "color": "207de5"
        },
        {
            "name": "BOARD: NEXT",
            "color": "FF0000"
        },
        {
            "name": "BOARD: DOING",
            "color": "FFB200"
        },
        {
            "name": "BOARD: DONE",
            "color": "00B000"
        }
    ];

    // Repos to watch of the current user
    $scope.repos = [];
    $scope.boards = undefined;

    $scope.repoState = [
        {
            name: '<strong>Github States</strong>',
            msGroup: true
        },
        {
            name: 'closed',
            msGroup: false
        },
        {
            name: 'open',
            msGroup: false
        }
    ];

    // board structure template
    $scope.boardsTemplate = {
        'name': 'Kanban Board',
        'columns': [
            {
                'name': 'Backlog',
                'tags': [],
                'states': [],
                'issues': []
            },
            {
                'name': 'Next',
                'tags': [],
                'states': [],
                'issues': []
            },
            {
                'name': 'Doing',
                'tags': [],
                'states': [],
                'issues': []
            },
            {
                'name': 'Done',
                'tags': [],
                'states': [],
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
        var random = Math.random();
        if (repos !== undefined) {
            $scope.repos = repos;
        }
        if (boards !== undefined) {
            $scope.boards = boards;
        }
        $.each($scope.repos, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.repos[repoIndex].token + ':x-oauth-basic@api.github.com/repos/' + $scope.repos[repoIndex].url + '/labels?state=all&filter=all&random=' + random,
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


                            if ($scope.boards[index].columns[indexCol].states == undefined) {
                                $scope.boards[index].columns[indexCol].states = [];
                            }
                            $scope.selectedStates = $scope.boards[index].columns[indexCol].states;
                            var tmpAvailableRepoStates = angular.copy($scope.repoState);
                            $.each(tmpAvailableRepoStates, function (indexAvailable, valueAvailable) { // alle verfügbaren Tags durchgehen und selected setzen

                                if (tmpAvailableRepoStates[indexAvailable].msgroup != true) {
                                    var isSelectedState = $.grep($scope.selectedStates, function (n, i) {
                                        return (n.name == tmpAvailableRepoStates[indexAvailable].name);
                                    });

                                    if (isSelectedState == undefined || isSelectedState.length == 0) {
                                        tmpAvailableRepoStates[indexAvailable].selected = false;
                                    } else {
                                        tmpAvailableRepoStates[indexAvailable].selected = true;
                                    }
                                }
                            });

                            if ($scope.availableRepoStates[index] == undefined) {
                                $scope.availableRepoStates[index] = [];
                            }

                            $scope.availableRepoStates[index][indexCol] = tmpAvailableRepoStates;
                        });
                    });
                    $timeout(function () {
                        $scope.loadIssues();
                    }, 100);
                });
            });
        });

    };

    //ISSUES
    $scope.loadIssues = function () {
        var random = Math.random();
        $.each($scope.repos, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.repos[repoIndex].token + ':x-oauth-basic@api.github.com/repos/' + $scope.repos[repoIndex].url + '/issues?state=all&filter=all&random=' + random,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.repos[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    /* EINORDNEN DER TICKETS IN DIE COLUMNS ANHAND DER HINTERLEGTEN TAGS PRO COLUMN*/
                    var board = angular.copy($scope.boards);
                    console.log(response);
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
                                        console.log(response[index].state);
                                        var isIssueInList = $.grep($scope.boards[indexBoard].columns[indexColumn].issues, function (n, i) {
                                            return (n.id == response[index].id);
                                        });
                                        if (isIssueInList == 0) {
                                            $scope.boards[indexBoard].columns[indexColumn].issues.push(response[index]);
                                        }
                                    }
                                });

                                /* clean Repo from state */
                                var newList = $.grep($scope.boards[indexBoard].columns[indexColumn].issues, function (n, i) {
                                    return (n.state == $scope.boards[indexBoard].columns[indexColumn].states);
                                });
                                $scope.boards[indexBoard].columns[indexColumn].issues = newList;

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
                    $scope.showSelect = true;
                });
            });
        });
    };

    $scope.loadUserData = function () {
        var random = Math.random();
        $.each($scope.users, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.users[repoIndex].token + ':x-oauth-basic@api.github.com/user?random=' + random,
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


    $scope.loadUserRepos = function (currentUser) {
        var random = Math.random();
        $.each($scope.users, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.users[repoIndex].token + ':x-oauth-basic@api.github.com/user/repos?random=' + random,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.users[repoIndex].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    if (currentUser !== undefined) {
                        currentUser.repos = response;
                    }
                    $scope.users[repoIndex].repos = response;
                    localStorage.setItem("fongas.users", JSON.stringify($scope.users));
                });
            });
        });
    };

    $scope.updateIssues = function (oldIssue, newIssue) {
        var random = Math.random();
        var user = $.grep($scope.users, function (n, i) {
            return (n.user.id == oldIssue.user.id);
        });
        if (user != undefined && user.length > 0) {
            var url = oldIssue.url.replace("://", '://' + user[0].token + ':x-oauth-basic@');
            $.ajax({
                url: url,
                type: 'PATCH',
                data: JSON.stringify(newIssue),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + user[0].token + "");
                    xhr.setRequestHeader("Content-Type", "application/json");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    //$scope.users[repoIndex].user = response;
                });
            });
        } else {
            console.warn("Keinen Benutzer für das Update gefunden.");
        }
    };


    $scope.getLabels = function (repo, user) {
        var labelUrl = repo.labels_url.replace("{/name}", "");

        var url = labelUrl.replace("://", '://' + user.token + ':x-oauth-basic@');
        return $.ajax({
            url: url,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "token " + user.token + "");
            }
        }).done(function (response) {
            return response;
        },function () {
            return null;
        });
    };

    $scope.addLabel = function (repo, label, user) {
        var labelUrl = repo.labels_url.replace("{/name}", "");

        var url = labelUrl.replace("://", '://' + user.token + ':x-oauth-basic@');
        return $.ajax({
            url: url,
            type: 'POST',
            data: JSON.stringify(label),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "token " + user.token + "");
                xhr.setRequestHeader("Content-Type", "application/json");
            }
        }).done(function (response) {
            return response;
        },function () {
            return null;
        });
    };
};
MainCtrl.$inject = ['$scope', '$timeout', '$http', '$location'];
module.controller('MainCtrl', MainCtrl);