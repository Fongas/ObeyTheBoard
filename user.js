var UserCtrl = function UserCtrl($scope, $timeout, $http) {
    $scope.addUser = function (token) {
        $scope.users.push({'token': token, 'type': 'github', 'user': {}, 'repos': []});
        $scope.loadUserData();
        $scope.loadUserRepos();
        localStorage.setItem("fongas.users", JSON.stringify($scope.users));
    };

    $scope.addRepository = function (name, url, token, type, id) {
        var newRepo = {
            "id": id,
            "name": name,
            "url": url,
            "token": token,
            "lastupdate": "",
            'type': type,
            "issues": []
        };

        if (!$scope.isRepoWatchEnabled(newRepo)) {
            $scope.repos.push(newRepo);
            $scope.github.name = "";
            $scope.github.url = "";
            $scope.github.token = "";
            localStorage.setItem("github.repos", JSON.stringify($scope.repos));
        }
    };

    $scope.deleteRepository = function (repo) {
        var x = $.grep($scope.repos, function (n, i) {
            if (n.id == repo.id) {
                $scope.repos.splice(i, 1);
                return true;
            }
        });

        localStorage.setItem("github.repos", JSON.stringify($scope.repos));
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
};


UserCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('UserCtrl', UserCtrl);


