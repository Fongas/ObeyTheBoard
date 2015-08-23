var BoardCtrl = function BoardCtrl($scope, $timeout, $http) {
    $scope.repositories = [];
    $scope.github = {};
    $scope.githubtmp = {};
    $scope.id = "";
    $scope.github.url = "";
    $scope.github.token = "";
    $scope.editMode = false;
    $scope.showRepo = false;
    $scope.showAllUserRepos = false;
    $scope.users = [];
    $scope.bg= ["bg1.jpg","bg2.jpg","bg3.jpg","bg4.jpg","bg5.jpg"];
    $scope.currentBg = "bg1.jpg";

    // collection of the logins
    $scope.repos = [];

    // board structure
    $scope.board = {
        'name': 'Kanban Board',
        'columns': [
            {
                'name': 'Backlog',
                'issues': []
            },
            {
                'name': 'Next',
                'issues': []
            },
            {
                'name': 'Done',
                'issues': []
            }
        ]
    };


    $scope.findIndexByKeyValue = function findIndexByKeyValue(obj, key, value) {
        for (var i = 0; i < obj.length; i++) {
            if (obj[i][key] == value) {
                return i;
            }
        }
        return null;
    };

    $scope.save = function ($item, $partFrom, $partTo, $indexFrom, $indexTo) {
        localStorage.setItem("github.board", JSON.stringify($scope.board));
    };

    $scope.setRepoData = function (currentConfig) {
        if (currentConfig != undefined) {
            $.ajax({
                url: 'https://' + currentConfig.token + ':x-oauth-basic@api.github.com/repos/' + currentConfig.url + '/issues?state=all&filter=all&page=2',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + currentConfig.token + "");
                }
            }).done(function (response) {
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.githubtmp = {
                            'url': currentConfig.url,
                            'token': currentConfig.token,
                            'lastupdate': '',
                            'issues': [],
                        };
                        $scope.githubtmp2 = {};

                        $.each(response, function (index, value) {
                            //prüfen ob die ID schon vorhanden ist
                            var resIndex = $scope.findIndexByKeyValue($scope.githubtmp2.issues, "id", response[index]['id']);
                            var resIndex2 = $scope.findIndexByKeyValue($scope.githubtmp2.issues, "id", response[index]['id']);
                            if (resIndex === null && resIndex2 === null) {
                                $scope.githubtmp.issues.push(response[index]);
                            }
                        });
                        $scope.repositories.push($scope.githubtmp);
                        $scope.repositories.push($scope.githubtmp2);
                        $scope.repositories[0].activeState = 'active';
                        $scope.githubtmp = {};
                    });
                }, 0);
            });

            $.ajax({
                url: 'https://' + currentConfig.token + ':x-oauth-basic@api.github.com/repos/' + currentConfig.url + '/commits?sha=develop',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + currentConfig.token + "");
                }
            }).done(function (response) {
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.commits = response;
                    });
                }, 0);
            });
        } else {
            var showNewRepo = false;
            for (var x = 0; x < $scope.repositories.length; x++) {
                if ($scope.repositories[x].url != $scope.github.url) {
                    showNewRepo = true;
                }
            }
            if (showNewRepo == false) {
                $.ajax({
                    url: 'https://' + $scope.github.token + ':x-oauth-basic@api.github.com/repos/' + $scope.github.url + '/issues',
                    type: 'GET',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "token " + $scope.github.token + "");
                    }
                }).done(function (response) {
                    $timeout(function () {
                        $scope.$apply(function () {
                            $scope.issues = response;
                            $scope.githubtmp = {
                                'url': $scope.github.url,
                                'token': $scope.github.token,
                                'issues': $scope.issues
                            };
                            $scope.repositories.push($scope.githubtmp);
                            $scope.repositories[0].activeState = 'active';
                            $scope.githubtmp = {};
                        });
                    }, 0);
                });
            } else {
                alert('Das Repository ist schon vorhanden.');
            }
        }
    };

    $scope.getGitHubData = function () {
        var data = localStorage.getItem("github");
        $scope.githubArray = JSON.parse(data);
        if ($scope.githubArray != undefined) {
            for (var i = 0; i < $scope.githubArray.length; i++) {
                $scope.setRepoData($scope.githubArray[i]);
            }
        }
    };

    $scope.pushRepo = function () {
        $scope.githubtmp = {
            'url': 'test',
            'token': '',
            'issues': []
        };
        $scope.repositories.push($scope.githubtmp);
    };

    $scope.saveGitHubData = function () {
        $scope.repositoriesCopy = angular.copy($scope.repositories);
        for (var i = 0; i < $scope.repositoriesCopy.length; i++) {
            delete $scope.repositoriesCopy[i].issues;
        }
    };

    // load issues from all repos
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
                    $.each(response, function (index, value) {
                        //prüfen ob die ID in den Spalten vohanden ist
                        var issueAlreadyPlanned = false;
                        $.each($scope.board.columns, function (index2, value2) {
                            response[index]['id']
                            var resIndex = $scope.findIndexByKeyValue($scope.board.columns[index2].issues, "id", response[index]['id']);
                            if (resIndex !== null) {
                                angular.extend($scope.board.columns[index2].issues[resIndex], response[index]);
                                response.splice(index, 1);
                                issueAlreadyPlanned = true;
                            }
                        });
                        if (!issueAlreadyPlanned) {
                            var tmp = new Array();
                            tmp.push(response[index]);
                            $scope.repos[repoIndex].issues.push(response[index]);
                        }
                    });
                });
            });
        });
    };

    $scope.toggleEditable = function () {
        $scope.editMode = ($scope.editMode == true) ? false : true;
        localStorage.setItem("github.board", JSON.stringify($scope.board));
    };

    // add column to the board
    $scope.addColumn = function () {
        $scope.board.columns.push({
            'name': 'New Column',
            'issues': []
        });
        localStorage.setItem("github.board", JSON.stringify($scope.board));
        $scope.toggleEditable();
    };

    $scope.getRepoUrl = function (url) {
        return url.split("/issues")[0];
    };

    $scope.addRepository = function (name, url, token, type) {
        $scope.repos.push(
            {
                "name": name,
                "url": url,
                "token": token,
                "lastupdate": "",
                'type': type,
                "issues": []
            });
        $scope.github.name = "";
        $scope.github.url = "";
        $scope.github.token = "";
        localStorage.setItem("github.repos", JSON.stringify($scope.repos));
    };

    $scope.deleteRepository = function (repo, $index) {
        $scope.repos.splice($index, 1);
        localStorage.setItem("github.repos", JSON.stringify($scope.repos));
    };


    $scope.toggleRepo = function () {
        $scope.showRepo = ($scope.showRepo == true) ? false : true;
    };

    $scope.toggleAllUserRepos = function () {
        $scope.showAllUserRepos = ($scope.showAllUserRepos == true) ? false : true;
    };

    $scope.addUser = function (token) {
        $scope.users.push({'token': token, 'type': 'github', 'user': {}, 'repos': []});
        $scope.loadUserData();
        $scope.loadUserRepos();
        localStorage.setItem("fongas.users", JSON.stringify($scope.users));
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
                $scope.users[repoIndex].user = response;
                console.log($scope.users);
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
                console.log($scope.users);
            });
        });
    };


    $scope.init = function () {
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
        var repo = localStorage.getItem("github.repos");
        if (repo !== null) {
            $scope.repos = JSON.parse(repo);
        } else {
            localStorage.setItem("github.repos", JSON.stringify($scope.repos));
        }

        // read board with columns from local storage
        var board = localStorage.getItem("github.board");
        if (board !== null) {
            $scope.board = JSON.parse(board);
        } else {
            localStorage.setItem("github.board", JSON.stringify($scope.board));
        }

        // read all issues and update the column data
        $scope.loadIssues();
        $scope.getGitHubData();
    };
    $scope.init();
};


BoardCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('BoardCtrl', BoardCtrl);


