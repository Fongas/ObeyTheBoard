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

module.filter('minutesToHours', function () {
    return function (input) {
        var hours = parseInt(parseInt(input) / 60);
        hours = (isNaN(hours)) ? 0 : hours;
        var minutes = parseInt(input) % 60;
        minutes = (isNaN(minutes)) ? 0 : minutes;
        var result = hours + "h" + minutes + "m";
        return result;
    };
});

module.filter('boardColumnTitle', function () {
    return function (input) {
        return input.name + " (" + input.issues.length + ")";
    };
});

module.filter('boardColumnStatistic', function (minutesToHoursFilter) {
    return function (input) {
        var usedTime = minutesToHoursFilter(input.usedTime);
        var budgetTime = minutesToHoursFilter(input.budgetTime);
        var openTime = minutesToHoursFilter(input.openTime);
        return '<i class="fa fa-clock-o"></i>&nbsp;' + budgetTime + '&nbsp;|&nbsp;<i class="fa fa-thumbs-o-up"></i>&nbsp;' + usedTime + '&nbsp;(open ' + openTime + ')';
    };
});

module.filter('issueAssigneeFilter', function () {
    return function (input, assignee) {
        //input => column.issues
        var res = $.grep(input, function (n, i) {
            if (assignee == null || assignee == undefined) {
                return true;
            } else if (n.assignee != null && n.assignee.id == assignee.id) {
                return true;
            } else {
                return false;
            }
        });
        return res;
    };
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
    $scope.assignees = [];
    $scope.assignees.push({'id':'all','login':'kein Filter'});
    $scope.assignee = undefined;
    $scope.showSettings = false;
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
                'issues': [],
                'color': '#5319e7'
            },
            {
                'name': 'Next',
                'tags': [],
                'states': [],
                'issues': [],
                'color': '#e11d21'
            },
            {
                'name': 'Doing',
                'tags': [],
                'states': [],
                'issues': [],
                'color': '#fbca04'
            },
            {
                'name': 'Done',
                'tags': [],
                'states': [],
                'issues': [],
                'color': '#009800'
            }
        ]
    };

    $scope.go = function (path) {
        $location.path(path);
    };

    $scope.$watch('boards', function (newValue, oldValue) {
        if ($scope.boards !== undefined) {
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }
    });

    $scope.$watch('selectedTags', function (newValue, oldValue) {
        //console.log($scope.selectedTags);
    });

    $scope.getBudgetTime = function (item) {
        var regLine = new RegExp("\n", "g");
        var regClock = new RegExp(":clock1:", "g");
        var lineArray = item.body.split(regLine);
        var result = "";

        $.each(lineArray, function (index, value) {
            if (lineArray[index].search(regClock) != -1) {
                result = lineArray[index].replace(regClock, "").trim();
            }
        });
        return result;
    };

    $scope.getUsedTime = function (item) {
        var regLine = new RegExp("\n", "g");
        var regUsed = new RegExp(":\+1:", "g");
        var lineArray = item.body.split(regLine);
        var result = "";

        $.each(lineArray, function (index, value) {
            if (lineArray[index].search(/:\+1:/) != -1) {
                result = lineArray[index].replace(/:\+1:/, "").trim().split('-')[0];
            }
        });

        return result;
    };

    $scope.paseTime = function (time) {
        if (time == undefined || time == "") {
            return 0;
        }

        var regHours = new RegExp("h", "g");
        var regMinutes = new RegExp("m", "g");
        var result = 0;
        var tmpTime = null;

        if (time.search(regHours) != -1 && time.search(regMinutes) != -1) {
            tmpTime = time.trim().split(/h/);
            result += parseInt(tmpTime[0].trim()) * 60; //hours
            result += parseInt(tmpTime[1].trim().split(/m/)[0]); //minute
        } else if (time.search(regHours) != -1) {
            result += parseInt(time.trim().split(/h/)[0].trim()) * 60; //hours
        } else if (time.search(regMinutes) != -1) {
            result += parseInt(time.trim().split(/m/)[0].trim()); //minute
        }

        if (isNaN(result)) {
            return 0;
        }
        return result;
    };

    $scope.getCountIssues = function (boardIndex, columnIndex) {
        return $scope.boards[boardIndex].columns[columnIndex].issues.length;
    };

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
                var savedAssignee = JSON.parse(localStorage.getItem("fongas.assignee"));

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

                                        if (isIssueInList.length == 0) {
                                            // Ticket to column
                                            if (savedAssignee == null || savedAssignee == undefined || savedAssignee.id == 'all' ||(response[index].assignee != null && response[index].assignee.id == savedAssignee.id)) {
                                                var budgetTime = $scope.paseTime($scope.getBudgetTime(response[index]));
                                                var usedTime = $scope.paseTime($scope.getUsedTime(response[index]));
                                                if (budgetTime > 0 && usedTime > 0) {
                                                    $scope.boards[indexBoard].columns[indexColumn].budgetTime += budgetTime;
                                                    $scope.boards[indexBoard].columns[indexColumn].usedTime += usedTime;
                                                }
                                                if (budgetTime > 0 && usedTime == 0) {
                                                    $scope.boards[indexBoard].columns[indexColumn].openTime += budgetTime;
                                                }

                                                $scope.boards[indexBoard].columns[indexColumn].issues.push(response[index]);
                                            }

                                            //preselect assignee
                                            var assignee = $.grep($scope.assignees, function (n, i) {
                                                return ( response[index].assignee !== null && n !== null && n.id == response[index].assignee.id);
                                            });

                                            if (assignee.length == 0 && response[index].assignee != null) {
                                                $scope.assignees.push(response[index].assignee);
                                            }
                                        }
                                    }
                                });
                                $scope.showSelect = true;
                            });
                        });
                    });
                });


                if(savedAssignee !== undefined && savedAssignee !== "undefined" && savedAssignee !== null){
                    var assignee = $.grep($scope.assignees, function (n, i) {
                        return (n.id == savedAssignee.id);
                    });

                    if (assignee.length > 0) {
                        $scope.assignee = assignee[0];
                    }
                }

                var scope = angular.element($('#BoardCtrl')).scope();
                scope.boards = $scope.boards;
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

    $scope.refreshTickets = function (assignee) {
        localStorage.setItem("fongas.assignee", JSON.stringify(assignee));
        //$timeout(function () {
        //    $scope.$apply(function () {
                $scope.showSelect = false;
                $scope.assignee = assignee;
                var boards = angular.copy($scope.boards);

                //CLEAN ISSUES
                $.each(boards, function (indexBoard, valueBoard) {
                    $.each(boards[indexBoard].columns, function (indexColumn, valueColumn) {
                        //boards[indexBoard].columns[indexColumn] =  $scope.clearColumn(boards[indexBoard].columns[indexColumn])
                        boards[indexBoard].columns[indexColumn].issues = [];
                        boards[indexBoard].columns[indexColumn].budgetTime = 0;
                        boards[indexBoard].columns[indexColumn].usedTime = 0;
                        boards[indexBoard].columns[indexColumn].openTime = 0;
                    });
                });
                $scope.boards = boards;
                $scope.loadIssues();
        //    });
            $scope.showSelect = true;
        //}, 100);

    };

    $scope.clearColumn = function (column) {
        column.issues = [];
        column.budgetTime = 0;
        column.usedTime = 0;
        column.openTime = 0;
        return column;
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
            return $.ajax({
                url: url,
                type: 'PATCH',
                data: JSON.stringify(newIssue),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + user[0].token + "");
                    xhr.setRequestHeader("Content-Type", "application/json");
                }
            }).done(function (response) {
                return response;
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
        }, function () {
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
        }, function () {
            return null;
        });
    };
};
MainCtrl.$inject = ['$scope', '$timeout', '$http', '$location'];
module.controller('MainCtrl', MainCtrl);