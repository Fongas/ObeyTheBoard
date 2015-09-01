var BoardCtrl = function BoardCtrl($scope, $timeout, $http) {

    /**
     * INIT
     */
    $scope.init = function init () {
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
        $scope.loadIssues($scope.repos);
    };
    $scope.init();
};


BoardCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('BoardCtrl', BoardCtrl);


