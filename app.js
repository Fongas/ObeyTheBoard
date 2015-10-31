$ = jQuery;

/**
 * Created by torstenzwoch on 30.05.14.
 */
/* AngularJS - change standard placeholder */
var module = angular.module('github', ['ngSanitize', 'LocalStorageModule', 'nl2br', 'angularLocalStorage', 'angular-sortable-view', 'ngRoute', 'ngAnimate', 'isteven-multi-select', 'ui.bootstrap', 'chart.js', 'angular-growl','jsonFormatter','platypus.jsonviewer']);//, 'firebase'
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
    }).when('/localstorage', {
        templateUrl: 'localstorage.html',
        controller: 'LocalStorageCtrl'
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

module.filter('differenceToPercent', function () {
    return function (input) {
        var result = (((100 / input.usedTime) * input.budgetTime) - 100) * -1;

        if (result <= 0) {
            return "<span class='success'>" + result.toFixed(2) + "%</span>";
        }

        return "<span class='danger'>" + result.toFixed(2) + "%</span>";
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

var MainCtrl = function MainCtrl($scope, $timeout, $http, $location, growl, $rootScope) { //, $firebaseArray
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
    $scope.assignees.push({'id': 'all', 'login': 'kein Filter'});
    $scope.assignee = undefined;
    $scope.showSettings = false;
    $scope.showSelect = true;
    $scope.timeline = {"dates": [], "open": [], "closed": []};
    $scope.connectionFailedAlreadyShown = false;
    $scope.lastSyncDate = null;
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

    $scope.defaultIssue = {
        "title": "",
        "body": "",
        "assignee": "",
        "milestone": 1,
        "labels": []
    };

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


$scope.fongas = null;
    ////var ref = new Firebase("https://fongas.firebaseio.com/messages");
    // download the data into a local object
    ////$scope.messages = $firebaseArray(ref);
    // synchronize the object with a three-way data binding
    // click on `index.html` above to see it used in the DOM!
    //syncObject.$bindTo($scope, "fongas");

    ////$scope.addMessage = function() {
    ////    $scope.messages.$add({
    ////        text: "test"
    ////    });
    ////};

    $scope.chart = {};
    $scope.chart.doughnut = {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke: false,

        //String - The colour of each segment stroke
        segmentStrokeColor: "#fff",

        //Number - The width of each segment stroke
        segmentStrokeWidth: 1,

        //Number - The percentage of the chart that we cut out of the middle
        percentageInnerCutout: 80, // This is 0 for Pie charts

        //Number - Amount of animation steps
        animationSteps: 100,

        //String - Animation easing effect
        animationEasing: "easeOutBounce",

        //Boolean - Whether we animate the rotation of the Doughnut
        animateRotate: true,

        //Boolean - Whether we animate scaling the Doughnut from the centre
        animateScale: true,

        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"

    };

    $scope.go = function (path) {
        $location.path(path);
    };

    $scope.$watch('boards', function (newValue, oldValue) {
        if ($scope.boards !== undefined) {
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
            localStorage.setItem("fongas.boards.lastModify", JSON.stringify(new moment()));
        }
    });

    $scope.$watch('selectedTags', function (newValue, oldValue) {
        //console.log($scope.selectedTags);
    });

    $rootScope.getBudgetTime = function (item) {
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

    $rootScope.getUsedTime = function (item) {
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

    $rootScope.clearBudgetTime = function (item) {
        var regLine = new RegExp("\n", "g");
        var regClock = new RegExp(":clock1:", "g");
        var lineArray = item.body.split(regLine);
        var result = "";

        $.each(lineArray, function (index, value) {
            if (lineArray[index].search(regClock) == -1) {
                result += lineArray[index] + "\n";
            }
        });
        return result;
    };

    $rootScope.clearUsedTime = function (item) {
        var regLine = new RegExp("\n", "g");
        var regUsed = new RegExp(":\+1:", "g");
        var lineArray = item.body.split(regLine);
        var result = "";

        $.each(lineArray, function (index, value) {
            console.warn(lineArray[index]);
            if (lineArray[index].search(/:\+1:/) == -1) {
                result += lineArray[index] + "\n";
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

                    localStorage.setItem("fongas.tags.lastSync", JSON.stringify(new moment()));

                    $timeout(function () {
                        $scope.loadIssues();
                    }, 100);
                });
            }).fail(function () {
                if (!$scope.connectionFailedAlreadyShown) {
                    $scope.connectionFailedAlreadyShown = true;
                    growl.error("<i class='fa fa-signal'></i>&nbsp;&nbsp;&nbsp;Keine Internetverbindung", {disableIcons: true});
                }
            });
        });


    };

    $scope.getTicketStatus = function ($item, $column) {
        var ok = true;
        var hint = {};
        var errorColor = "#e11d21";
        $item.hint = {"type": "", "color": "none", "text": ""};

        var labelError = false;
        $.each($item.labels, function (index, value) {
            // State stimmt nicht. Somit wurde zwar das Label in Github gesetzt aber der Status nicht
            var tags = $.grep($column.tags, function (n, i) {
                return (n.url == $item.labels[index].url && n.state != $item.state);
            });

            if (tags.length > 0) {
                labelError = true;
            }
        });

        // hierbei wurde das Ticket auf erledigt gesetzt, aber es wurde vergessen die Zeit einzutragen
        if ($item.budgetTime > 0 && $item.usedTime == 0 && $item.state == "closed" && labelError) {
            ok = false;
            hint.type = "timeFailed";
            hint.color = errorColor;
            hint.text = "Zeit und Status fehlerhaft";
        } else if (labelError) {
            ok = false;
            hint.type = "timeFailed";
            hint.color = errorColor;
            hint.text = "Status fehlerhaft";
        } else if ($item.budgetTime > 0 && $item.usedTime == 0 && $item.state == "closed") {
            ok = false;
            hint.type = "timeFailed";
            hint.color = errorColor;
            hint.text = "Zeit fehlerhaft";
        }

        $item.hint = hint;

        return $item;
    };

    $scope.createStructureForOpenTicketsPerBoardAndColumn = function ($assignee) {
        $assignee.openTicketsPerBoardAndColumn = [];
        $assignee.boardColumnNames = [];
        $assignee.boardColumnColors = [];
        for (var i = 0; i < $scope.boards.length; ++i) {
            $assignee.openTicketsPerBoardAndColumn[i] = [];
            $assignee.boardColumnNames[i] = [];
            $assignee.boardColumnColors[i] = [];
        }
        ;
        $.each($assignee.openTicketsPerBoardAndColumn, function (boardIndex, boardvalue) {
            $assignee.openTicketsPerBoardAndColumn[boardIndex] = [];
            $assignee.boardColumnNames[boardIndex] = [];
            $assignee.boardColumnColors[boardIndex] = [];
            for (var i = 0; i < $scope.boards[boardIndex].columns.length; ++i) {
                $assignee.openTicketsPerBoardAndColumn[boardIndex].push(0);
                $assignee.boardColumnNames[boardIndex].push($scope.boards[boardIndex].columns[i].name);
                $assignee.boardColumnColors[boardIndex].push($scope.boards[boardIndex].columns[i].color);
            }
            ;
        });
        return $assignee;
    };

    $scope.sort_by = function (field, reverse, primer) {

        var key = primer ?
            function (x) {
                return primer(x[field])
            } :
            function (x) {
                return x[field]
            };

        reverse = !reverse ? 1 : -1;

        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    };

    //ISSUES
    $scope.loadIssues = function () {
        var random = Math.random();
        var savedAssignee = JSON.parse(localStorage.getItem("fongas.assignee"));
        $.each($scope.assignees, function (indexAssignee, valueAssignee) {
            $scope.assignees[indexAssignee].budgetTime = 0;
            $scope.assignees[indexAssignee].usedTime = 0;
            $scope.assignees[indexAssignee].openTime = 0;
            $scope.assignees[indexAssignee].openTickets = 0;
            $scope.assignees[indexAssignee].openTicketsWithoutBudget = 0;
            $scope.assignees[indexAssignee].openTicketsWithBudget = 0;
        });
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
                                            var budgetTime = $scope.paseTime($scope.getBudgetTime(response[index]));
                                            var usedTime = $scope.paseTime($scope.getUsedTime(response[index]));
                                            response[index].budgetTime = budgetTime;
                                            response[index].usedTime = usedTime;

                                            response[index] = $scope.getTicketStatus(response[index], $scope.boards[indexBoard].columns[indexColumn]);

                                            // Ticket to column
                                            if (savedAssignee == null || savedAssignee == undefined || savedAssignee.id == 'all' || (response[index].assignee != null && response[index].assignee.id == savedAssignee.id)) {
                                                if (budgetTime > 0 && usedTime > 0) {
                                                    $scope.boards[indexBoard].columns[indexColumn].budgetTime += budgetTime;
                                                    $scope.boards[indexBoard].columns[indexColumn].usedTime += usedTime;
                                                }
                                                if (budgetTime > 0 && usedTime == 0) {
                                                    $scope.boards[indexBoard].columns[indexColumn].openTime += budgetTime;
                                                }

                                                $scope.boards[indexBoard].columns[indexColumn].issues.push(response[index]);
                                            }

                                            // Collect all different assignees
                                            var assignee = $.grep($scope.assignees, function (n, i) {
                                                return ( response[index].assignee !== null && n !== null && n.id == response[index].assignee.id);
                                            });

                                            if (assignee.length == 0 && response[index].assignee != null) {
                                                response[index].assignee.budgetTime = 0;
                                                response[index].assignee.usedTime = 0;
                                                response[index].assignee.openTime = 0;
                                                response[index].assignee.openTickets = 0;
                                                response[index].assignee.openTicketsWithoutBudget = 0;
                                                response[index].assignee.openTicketsWithBudget = 0;
                                                //response[index].assignee.openTicketsPerColumn = new Array($scope.boards.length);
                                                /*
                                                 response[index].assignee.openTicketsPerBoardAndColumn = [];
                                                 for (var i = 0; i < $scope.boards.length; ++i) {
                                                 response[index].assignee.openTicketsPerBoardAndColumn[i] = []
                                                 };
                                                 $.each(response[index].assignee.openTicketsPerBoardAndColumn, function (boardIndex, boardvalue) {
                                                 response[index].assignee.openTicketsPerBoardAndColumn[boardIndex] = [];
                                                 for (var i = 0; i < $scope.boards[boardIndex].columns.length; ++i) {
                                                 response[index].assignee.openTicketsPerBoardAndColumn[boardIndex].push(0)
                                                 };
                                                 });*/
                                                response[index].assignee = $scope.createStructureForOpenTicketsPerBoardAndColumn(response[index].assignee);
                                                $scope.assignees.push(response[index].assignee);
                                            }

                                            //push statistic informations to the assignee object
                                            $.each($scope.assignees, function (indexAssignee, valueAssignee) {
                                                if (response[index].assignee !== null && $scope.assignees[indexAssignee].id == response[index].assignee.id || $scope.assignees[indexAssignee].id == "all") {
                                                    if (budgetTime > 0 && usedTime > 0) {
                                                        $scope.assignees[indexAssignee].budgetTime += budgetTime;
                                                        $scope.assignees[indexAssignee].usedTime += usedTime;
                                                    } else if (budgetTime > 0 && usedTime == 0) {
                                                        $scope.assignees[indexAssignee].openTime += budgetTime;
                                                        $scope.assignees[indexAssignee].openTickets += 1;
                                                        $scope.assignees[indexAssignee].openTicketsWithBudget += 1;

                                                    } else if (budgetTime == 0 && usedTime == 0 && response[index].state == "open") { //not planned
                                                        $scope.assignees[indexAssignee].openTickets += 1;
                                                        $scope.assignees[indexAssignee].openTicketsWithoutBudget += 1;
                                                    }
                                                    //$scope.assignees[indexAssignee].openTicketsPerColumn[indexColumn] += 1;
                                                    /*if($scope.assignees[indexAssignee].openTicketsPerBoardAndColumn == undefined){
                                                     $scope.assignees[indexAssignee].openTicketsPerBoardAndColumn = [];
                                                     for(var i=0; i<10; ++i) {$scope.assignees[indexAssignee].openTicketsPerBoardAndColumn.push(0)};
                                                     }*/
                                                    if ($scope.assignees[indexAssignee].openTicketsPerBoardAndColumn == undefined) {
                                                        $scope.assignees[indexAssignee] = $scope.createStructureForOpenTicketsPerBoardAndColumn($scope.assignees[indexAssignee]);
                                                    }

                                                    $scope.assignees[indexAssignee].openTicketsPerBoardAndColumn[indexBoard][indexColumn] += 1;
                                                    if (response[index].milestone != undefined && response[index].milestone != null) {
                                                        if ($scope.timeline.dates[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] == undefined) {
                                                            $scope.timeline.dates[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] = 0;
                                                            $scope.timeline.open[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] = 0;
                                                            $scope.timeline.closed[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] = 0;
                                                        }
                                                        $scope.timeline.dates[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] += 1;
                                                        if (response[index].state == "open") {
                                                            $scope.timeline.open[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] += 1;
                                                        } else {
                                                            $scope.timeline.closed[moment(new Date(response[index].milestone.due_on)).format("YYYY-MM-DD")] += 1;
                                                        }
                                                    }
                                                    /*$scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
                                                     $scope.series = ['Series A', 'Series B'];
                                                     $scope.data = [
                                                     [65, 59, 80, 81, 56, 55, 40],
                                                     [28, 48, 40, 19, 86, 27, 90]
                                                     ];*/
                                                }
                                            });
                                        }
                                    }
                                });
                                $scope.showSelect = true;
                            });
                        });
                    });


                    localStorage.setItem("fongas.issues.lastSync", JSON.stringify(new moment()));
                    $scope.timeline.all = [];


                    var dates = [];
                    var datesStrings = [];
                    for (key in $scope.timeline.dates) {
                        dates.push(key);
                        moment().locale('de_de');
                        var de = moment(new Date(key)).locale('de');
                        var date = de.format("DD.MM.YYYY");
                        datesStrings.push(date);
                    }


                    datesStrings.sort(function (a, b) {
                        var keyA = new Date(moment(a, "YYYY-MM-DD")._d),
                            keyB = new Date(moment(b, "YYYY-MM-DD")._d);
                        // Compare the 2 dates
                        if (keyA < keyB || !keyA.isDate) return -1;
                        if (keyA > keyB) return 1;
                        return 0;
                    });

                    $scope.timeline.labels = datesStrings;

                    var open = [];
                    var closed = [];
                    var all = [];
                    for (key in datesStrings) {
                        var date = moment(key, "DD.MM.YYYY").format("YYYY-MM-DD");
                        open.push($scope.timeline.open[date]);
                        closed.push($scope.timeline.closed[date]);
                        all.push($scope.timeline.dates[date]);
                    }
                    //console.warn(dates);
                    //console.warn(datesStrings);

                    $scope.timeline.all[0] = all;
                    $scope.timeline.all[1] = open;
                    $scope.timeline.all[2] = closed;

                    /*
                     for (key in $scope.timeline.open) {
                     open.push($scope.timeline.open[key]);
                     }
                     $scope.timeline.all[1] = open;


                     for (key in $scope.timeline.closed) {
                     closed.push($scope.timeline.closed[key]);
                     }
                     $scope.timeline.all[2] = closed;
                     */
                    $scope.timeline.series = ['All', 'open', 'closed'];
                    //console.log($scope.timeline);


//                    $.each(datesStrings, function (index, value) {

                    //                  })
                });

                // replace the selected assignee with the new from object from github
                if (savedAssignee !== undefined && savedAssignee !== "undefined" && savedAssignee !== null) {
                    var assignee = $.grep($scope.assignees, function (n, i) {
                        return (n.id == savedAssignee.id);
                    });

                    if (assignee.length > 0) {
                        $scope.assignee = assignee[0];
                    }
                }


            });
        });
        var scope = angular.element($('#BoardCtrl')).scope();
        scope.boards = $scope.boards;
        scope.assignees = $scope.assignees;
    };

    $scope.loadUserData = function () {
        //console.log("loadUserData");
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
        localStorage.setItem("fongas.assignee.lastSync", JSON.stringify(new moment()));
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
                    localStorage.setItem("fongas.users.lastSync", JSON.stringify(new moment()));
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
MainCtrl.$inject = ['$scope', '$timeout', '$http', '$location', 'growl','$rootScope']; //,'$firebaseArray'
module.controller('MainCtrl', MainCtrl);