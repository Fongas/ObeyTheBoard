var BoardCtrl = function BoardCtrl($scope, $timeout, $http) {

    $scope.localLang = {
        selectAll: "Tick all",
        selectNone: "Tick none",
        reset: "Undo all",
        search: "Suche...",
        nothingSelected: "Filter hinzufügen"         //default-label is deprecated and replaced with this.
    };
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
    $scope.saveBoards = function (boardIndex,colIndex) {
        if ($scope.boards !== undefined) {
            $scope.boards[boardIndex].columns[colIndex].tags = $scope.boards[boardIndex].columns[colIndex].selectedTags;
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }
    };

    /**
     * INIT
     */
    $scope.init = function init() {
        // read users from local storage
        var users = localStorage.getItem("fongas.users");
        if (users !== null) {
            $scope.users = JSON.parse(users);
        } else {
            localStorage.setItem("fongas.users", JSON.stringify($scope.users));
        }

        // enrich the user object with user data and repos from github etc.
        $scope.loadUserData();
        $scope.loadUserRepos();

        // read repos from session storage
        var repo = localStorage.getItem("fongas.repos");
        if (repo !== null) {
            $scope.repos = JSON.parse(repo);
        } else {
            localStorage.setItem("fongas.repos", JSON.stringify($scope.repos));
        }

        // read board with columns from local storage
        var board = localStorage.getItem("fongas.boards");
        if (board !== null) {
            $scope.boards = JSON.parse(board);
        } else {
            //set board template as default
            $scope.boards = [];
            $scope.boards.push($scope.boardsTemplate);
            localStorage.setItem("fongas.boards", JSON.stringify($scope.boards));
        }

        // read all issues and update the column data
        $scope.loadIssues($scope.repos, $scope.boards);
    };
    $scope.init();
};


BoardCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('BoardCtrl', BoardCtrl);


