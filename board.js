var BoardCtrl = function BoardCtrl($scope, $timeout, $http) {

    $scope.settingsOn = false;
    $scope.newIssuesOn = false;

    $scope.localLang = {
        selectAll: "Tick all",
        selectNone: "Tick none",
        reset: "Undo all",
        search: "Suche...",
        nothingSelected: "Filter hinzufügen"         //default-label is deprecated and replaced with this.
    };

    $scope.localLangRepo = {
        selectAll: "Tick all",
        selectNone: "Tick none",
        reset: "Undo all",
        search: "Suche...",
        nothingSelected: "Repository wählen"         //default-label is deprecated and replaced with this.
    };

    $scope.newIssues = [];
    $scope.newIssueRepo = [];

    $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
    $scope.series = ['Series A', 'Series B'];
    $scope.data = [
        [65, 59, 80, 81, 56, 55, 40],
        [28, 48, 40, 19, 86, 27, 90]
    ];
    $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };

    $scope.labels2 = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
    $scope.data2 = [300, 500, 100];
    /*
     $scope.modernBrowsers = [
     { icon: "<img src=[..]/opera.png.. />",               name: "Opera",              maker: "(Opera Software)",        ticked: true  },
     { icon: "<img src=[..]/internet_explorer.png.. />",   name: "Internet Explorer",  maker: "(Microsoft)",             ticked: false },
     { icon: "<img src=[..]/firefox-icon.png.. />",        name: "Firefox",            maker: "(Mozilla Foundation)",    ticked: true  },
     { icon: "<img src=[..]/safari_browser.png.. />",      name: "Safari",             maker: "(Apple)",                 ticked: false },
     { icon: "<img src=[..]/chrome.png.. />",              name: "Chrome",             maker: "(Google)",                ticked: true  }
     ];

     $scope.clickTag = function(data, columnIndex, boardIndex){
     if($scope.boards[boardIndex].columns[columnIndex].tags === undefined){
     $scope.boards[boardIndex].columns[columnIndex].tags = [];
     }

     var res = $.grep($scope.boards[boardIndex].columns[columnIndex].tags, function (n, i) {
     return (n.name == data.name && n.repo == data.repo);
     });

     if(res.length==0){
     $scope.boards[boardIndex].columns[columnIndex].tags.push(data);
     }else{

     var fileredColumn = $.grep($scope.boards[boardIndex].columns[columnIndex].tags, function (n, i) {
     return (n.name != data.name && n.repo != data.repo);
     });
     $scope.boards[boardIndex].columns[columnIndex].tags = fileredColumn;
     }
     };
     */
    $scope.saveBoards = function (boardIndex, colIndex) {
        if ($scope.boards !== undefined) {
            console.log($scope.boards);
            $scope.boards[boardIndex].columns[colIndex].tags = $scope.boards[boardIndex].columns[colIndex].selectedTags;
            $scope.boards[boardIndex].columns[colIndex].states = $scope.boards[boardIndex].columns[colIndex].selectedStates;
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }
    };

    $scope.refreshAllData = function () {
        $scope.init();
    };

    /* ADD ISSUES - saveNewIssueRepo */
    $scope.newIssueToRepo = function (repo) {
        repo.issues.push($scope.defaultIssue);
    };

    $scope.saveNewIssueRepo = function (newIssueRepo) {
        if (newIssueRepo != undefined) {
            var random = Math.random();
            var x = {"repo": newIssueRepo[0], "issues": []};
            x.issues.push(angular.copy($scope.defaultIssue));

            $.ajax({
                url: 'https://' + newIssueRepo[0].token + ':x-oauth-basic@api.github.com/repos/' + newIssueRepo[0].url + '/labels?state=all&filter=all&random=' + random,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + newIssueRepo[0].token + "");
                }
            }).done(function (response) {
                $scope.$apply(function () {
                    x.labels = response;
                    $.ajax({
                        url: 'https://' + newIssueRepo[0].token + ':x-oauth-basic@api.github.com/repos/' + newIssueRepo[0].url + '/milestones?state=all&filter=all&random=' + random,
                        type: 'GET',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("Authorization", "token " + newIssueRepo[0].token + "");
                        }
                    }).done(function (response) {
                        $scope.$apply(function () {
                            x.milestones = response;
                            $.ajax({
                                url: 'https://' + newIssueRepo[0].token + ':x-oauth-basic@api.github.com/repos/' + newIssueRepo[0].url + '/assignees?state=all&filter=all&random=' + random,
                                type: 'GET',
                                beforeSend: function (xhr) {
                                    xhr.setRequestHeader("Authorization", "token " + newIssueRepo[0].token + "");
                                }
                            }).done(function (response) {
                                $scope.$apply(function () {
                                    x.assignees = response;
                                    $scope.newIssues.push(x);
                                    $.each($scope.repos, function (repoIndex, repoValue) {
                                        if($scope.repos[repoIndex].id == newIssueRepo[0].id){
                                            $scope.repos[repoIndex].selected = false;
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    };

    $scope.postNewIssues = function (repoIndex) {

        $.each($scope.newIssues[repoIndex].issues, function (index, value) {
            var labels = [];
            $.each($scope.newIssues[repoIndex].issues[index].labels, function (indexLabels, value) {
                labels.push($scope.newIssues[repoIndex].labels[indexLabels].name);
            });

            var issue  = {
                "title": $scope.newIssues[repoIndex].issues[index].title,
                "body": $scope.newIssues[repoIndex].issues[index].body,
                "assignee": $scope.newIssues[repoIndex].issues[index].assignee[0].login,
                "milestone": $scope.newIssues[repoIndex].issues[index].milestone[0].number,
                "labels": labels
            };

            return $.ajax({
                url: 'https://' + $scope.newIssues[repoIndex].repo.token + ':x-oauth-basic@api.github.com/repos/' + $scope.newIssues[repoIndex].repo.url + '/issues',
                type: 'POST',
                data: JSON.stringify(issue),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.newIssues[repoIndex].repo.token + "");
                    xhr.setRequestHeader("Content-Type", "application/json");
                }
            }).done(function (response) {
                //delete the created from list
                return response;
            }, function () {
                return null;
            });
        });
        $scope.newIssues[repoIndex].issues = [];
    };

    $scope.deleteNewIssue = function (repoIndex, $index) {
        $scope.newIssues[repoIndex].issues.splice($index, 1);
    };

    $scope.addNewIssue = function (repoIndex) {
        $scope.newIssues[repoIndex].issues.push(angular.copy($scope.defaultIssue));
        console.log($scope.newIssues);
        console.log($scope.boards);
        console.log($scope.availableTags);
    };
    /* ADD ISSUES - END */

    $scope.sort = function ($item, $partFrom, $partTo, $indexFrom, $indexTo, $index, $indexBoard) {
        //spalten nach dem $item durchgehen
        var targetColumn = null;
        $.each($scope.boards[$indexBoard].columns, function (columnIndex, columnValue) {
            var res = $.grep($scope.boards[$indexBoard].columns[columnIndex].issues, function (n, i) {
                return (n.id == $item.id && n.url == $item.url);
            });
            if (res != undefined && res.length > 0) {
                targetColumn = columnIndex;
                return false; //break
            }
        });

        var newLabels = [];
        var state = undefined;

        // get new BOARD tag
        $.each($scope.boards[$indexBoard].columns[targetColumn].tags, function (indexTags, valueTags) {
            newLabels.push($scope.boards[$indexBoard].columns[targetColumn].tags[indexTags].name);
            if (state !== undefined && $scope.boards[$indexBoard].columns[targetColumn].tags[indexTags].state != state) {
                console.warn("Die Labels für ein und das gleiche Repo haben unterschiedliche Stati hinterlegt!");
            }
            state = $scope.boards[$indexBoard].columns[targetColumn].tags[indexTags].state;
        });

        //clean old BOARD tags and add only the other tags
        $.each($item.labels, function (indexTags, valueTags) {
            if ($item.labels[indexTags].name.indexOf("BOARD") == -1) {
                newLabels.push($item.labels[indexTags].name);
            }
        });

        var issue = {
            "title": $item.title,
            "body": $item.body,
            "assignee": $item.assignee.login,
            "milestone": $item.milestone.number,
            "state": state,
            "labels": newLabels
        };

        var issueUpdate = $scope.updateIssues($item, issue);

        issueUpdate.done(function (result) {
            $scope.$apply(function () {
                $scope.boards[$indexBoard].columns[targetColumn].issues[$indexTo] = result;
            });
        });
    };

    $scope.end = function ($item, $part, $index) {
    };

    $scope.getColor = function (color) {
        return color;
    };


    $scope.getRepoName = function ($item, $part, $index) {
        var name = $item.url.split("/");
        return name[5];
    };

    $scope.isOpen = function (item) {
        if (item.state == "open") {
            return true;
        }

        return false;
    };

    $scope.showBoard = function () {
        $scope.showSelect = true;
    };
    $scope.hideBoard = function () {
        $scope.showSelect = false;
    };

    $scope.showSettings = function () {
        $scope.hideBoard();
        $scope.newIssuesOn = false;
        $scope.settingsOn = true;
    };
    $scope.hideSettings = function () {
        $scope.showBoard();
        $scope.newIssuesOn = false;
        $scope.settingsOn = false;
    };
    $scope.showNewIssues = function () {
        $scope.hideBoard();
        $scope.settingsOn = false;
        $scope.newIssuesOn = true;
    };
    $scope.hideNewIssues = function () {
        $scope.showBoard();

        $scope.settingsOn = false;
        $scope.newIssuesOn = false;
    };

    $scope.getDatetime = new Date();

    /**
     * INIT
     */
    $scope.init = function init() {
        // read users from local storage
        var users = localStorage.getItem("fongas.users");
        if (users !== null) {
            $scope.$parent.users = JSON.parse(users);
            //$scope.users = JSON.parse(users);
        } else {
            localStorage.setItem("fongas.users", JSON.stringify($scope.users));
        }

        // enrich the user object with user data and repos from github etc.
        $scope.loadUserData();
        $scope.loadUserRepos();

        // read repos from session storage
        var repo = localStorage.getItem("fongas.repos");
        if (repo !== null) {
            $scope.$parent.repos = JSON.parse(repo);
            //$scope.repos = JSON.parse(repo);
        } else {
            localStorage.setItem("fongas.repos", JSON.stringify($scope.repos));
        }

        // read board with columns from local storage
        var boards = localStorage.getItem("fongas.boards");
        if (boards !== null) {
            boards = JSON.parse(boards);
            //CLEAN ISSUES
            $.each(boards, function (indexBoard, valueBoard) {
                $.each(boards[indexBoard].columns, function (indexColumn, valueColumn) {
                    boards[indexBoard].columns[indexColumn] = $scope.clearColumn(boards[indexBoard].columns[indexColumn])
                });
            });
            $scope.$parent.boards = boards;
        } else {
            //set board template as default
            $scope.boards = [];
            $scope.boards.push($scope.boardsTemplate);
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }

        // read all issues and update the column data
        $scope.loadTags($scope.$parent.repos, $scope.$parent.boards);
    };
    $scope.init();
};


BoardCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('BoardCtrl', BoardCtrl);


