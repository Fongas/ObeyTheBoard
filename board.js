var BoardCtrl = function BoardCtrl($scope, $timeout, $http) {

    $scope.settingsOn = false;

    $scope.localLang = {
        selectAll: "Tick all",
        selectNone: "Tick none",
        reset: "Undo all",
        search: "Suche...",
        nothingSelected: "Filter hinzufügen"         //default-label is deprecated and replaced with this.
    };


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
            $scope.boards[boardIndex].columns[colIndex].tags = $scope.boards[boardIndex].columns[colIndex].selectedTags;
            $scope.boards[boardIndex].columns[colIndex].states = $scope.boards[boardIndex].columns[colIndex].selectedStates;
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }
    };


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

    $scope.getRepoName = function ($item, $part, $index) {
        var name = $item.url.split("/");
        return name[5];
    };

    $scope.$watch('boards[0].columns', function (newValue, oldValue) {

    });

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
        $scope.settingsOn = true;
    };
    $scope.hideSettings = function () {
        $scope.settingsOn = false;
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


