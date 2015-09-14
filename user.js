var UserCtrl = function UserCtrl($scope, $timeout, $http) {

    /**
     * USERS
     */
    $scope.addUser = function (token) {
        if(token!=""){
            $scope.$parent.users.push({'token': token, 'type': 'github', 'user': {}, 'repos': []});
            $scope.loadUserData();
            $scope.loadUserRepos();
            localStorage.setItem("fongas.users", JSON.stringify($scope.$parent.users));
        }
    };

    $scope.editUser = function editUser(user) {
        $scope.currentUser = user;
    };

    $scope.deleteUser = function (user) {
        var res = false;
        res = $.grep($scope.$parent.users, function (n, i) {
            if (n == user) {
                $scope.$parent.users.splice(i, 1);
                return true;
            }
        });
        if(res){
            $scope.currentUser = undefined;
        }
        localStorage.setItem("fongas.users", JSON.stringify($scope.users));
    };

    $scope.refreshRepositories = function () {
        console.log("START");
        console.log($scope.users);
        console.log($scope.$parent.users);
        $scope.loadUserData();
        $scope.loadUserRepos();
        console.log($scope.$parent.repos)
    };

    /**
     * REPOSITORIES
     */
    $scope.addRepository = function (repo, user) {


        var newRepo = {
            "id": repo.id,
            "name": repo.name,
            "url": repo.full_name,
            "token": user.token,
            "lastupdate": "",
            'type': user.type,
            "issues": []
        };

        if (!$scope.isRepoWatchEnabled(newRepo)) {
            $scope.$parent.repos.push(newRepo);
            $scope.github.name = "";
            $scope.github.url = "";
            $scope.github.token = "";
            localStorage.setItem("fongas.repos", JSON.stringify($scope.$parent.repos));
        }
    };

    $scope.deleteRepository = function (repo) {
        var x = $.grep($scope.$parent.repos, function (n, i) {
            return n.id != repo.id;
        });
        $scope.repos = x;
        localStorage.setItem("fongas.repos", JSON.stringify($scope.$parent.repos));
    };

    $scope.isRepoWatchEnabled = function isRepoWatchEnabled(repo) {
        var x = $.grep($scope.repos, function (n, i) {
            return n.id == repo.id;
        });
        if (x.length > 0) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * INIT
     */
    $scope.init = function () {
        // read users from local storage
        var users = localStorage.getItem("fongas.users");
        if (users !== null) {
            $scope.$parent.users = JSON.parse(users);
            //$scope.users = JSON.parse(users);
        } else {
            localStorage.setItem("fongas.users", JSON.stringify($scope.$parent.users));
        }

        // enrich the user object with user data and repos from github etc.
        $scope.loadUserData();
        $scope.loadUserRepos();

        // read repos from session storage
        var repo = localStorage.getItem("fongas.repos");
        if (repo !== null) {
            $scope.$parent.repos = JSON.parse(repo);
        } else {
            localStorage.setItem("fongas.repos", JSON.stringify($scope.$parent.repos));
        }
    };
    $scope.init();
};


UserCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('UserCtrl', UserCtrl);


