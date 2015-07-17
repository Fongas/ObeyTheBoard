$ = jQuery;

/**
 * Created by torstenzwoch on 30.05.14.
 */
/* AngularJS - change standard placeholder */
var module = angular.module('github', ['ngSanitize', 'LocalStorageModule', 'nl2br', 'angularLocalStorage', 'angular-sortable-view']);
module.config(['$interpolateProvider', '$compileProvider', 'localStorageServiceProvider', function ($interpolateProvider, $compileProvider, localStorageServiceProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');

    module.directive = function (name, factory) {
        $compileProvider.directive(name, factory);
        return ( this );
    };

    localStorageServiceProvider
        .setPrefix('fongas')
        .setStorageType('sessionStorage')
        .setNotify(true, true);
}]);

angular.module('github').config(function ($controllerProvider) {
    $controllerProvider.allowGlobals();
    module.controllerProvider = $controllerProvider;
});

// NEW FUNCTIONS FOR WORKFLOWS
var GithubProjectIssuesCtrl = function GithubProjectIssuesCtrl($scope, $timeout, $http) {
    $scope.repositories = [];
    $scope.github = {};
    $scope.githubtmp = {};
    $scope.id = "";
    $scope.github.url = "";
    $scope.github.token = "";
    $scope.editMode = false;
    $scope.showRepo = false;

// Sammlung der Logins
    $scope.repos = [

    ];
// Struktur
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

                        //console.log("xxx");
                        $.each(response, function (index, value) {
                            //prüfen ob die ID schon vorhanden ist
                            //console.log(value);
                            var resIndex = $scope.findIndexByKeyValue($scope.githubtmp2.issues, "id", response[index]['id']);
                            var resIndex2 = $scope.findIndexByKeyValue($scope.githubtmp2.issues, "id", response[index]['id']);
                            if (resIndex === null && resIndex2 === null) {
                                $scope.githubtmp.issues.push(response[index]);
                                //console.log(response[index]);
                            }
                        });
                        //$scope.githubtmp.issues = $scope.issues;
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

        /*$scope.githubArray = [
            {
            "url": "fongas/ObeyTheBoard",
            "token": "",
            "lastupdate": "",
            "activeState": "active"
        }
        ];*/
        console.log($scope.githubArray);
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


    $scope.loadIssues = function () {
        $.each($scope.repos, function (repoIndex, repoValue) {
            $.ajax({
                url: 'https://' + $scope.repos[repoIndex].token + ':x-oauth-basic@api.github.com/repos/' + $scope.repos[repoIndex].url + '/issues?state=all&filter=all',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + $scope.repos[repoIndex].token + "");
                }
            }).done(function (response) {
                //$timeout(function () {
                $scope.$apply(function () {
                    $.each(response, function (index, value) {
                        //console.log("each-outer");
                        //console.log(response);
                        //prüfen ob die ID in den Spalten vohanden ist
                        var issueAlreadyPlanned = false;
                        $.each($scope.board.columns, function (index2, value2) {
                            //console.log("checker");
                            //console.log(index);
                            //console.log(response);
                            response[index]['id']
                            var resIndex = $scope.findIndexByKeyValue($scope.board.columns[index2].issues, "id", response[index]['id']);
                            //console.log(resIndex);
                            if (resIndex !== null) {
                                //var tmp = new Array();
                                //tmp.push(response[index]);
                                angular.extend($scope.board.columns[index2].issues[resIndex], response[index]);
                                response.splice(index, 1);
                                //$scope.board.columns[index2].issues = $.merge($scope.board.columns[index2].issues, tmp);
                                issueAlreadyPlanned = true;
                                //console.log("push");
                            }
                        });
                        //console.log(issueAlreadyPlanned);
                        if (!issueAlreadyPlanned) {
                            var tmp = new Array();
                            tmp.push(response[index]);
                            //$scope.repos[repoIndex].issues = $.merge($scope.repos[repoIndex].issues, tmp);
                            $scope.repos[repoIndex].issues.push(response[index]);
                            //console.log("merge");
                        }
                    });
                });
                //}, 0);
            });
        });
    };


    $scope.check = function () {
        //console.log($scope.repos);
        //console.log($scope.board);
    };

    $scope.toggleEditable = function () {
        $scope.editMode = ($scope.editMode == true) ? false : true;
        localStorage.setItem("github.board", JSON.stringify($scope.board));
    };

    $scope.addColumn = function () {
        $scope.board.columns.push({
            'name': 'New Column',
            'issues': []
        });
        localStorage.setItem("github.board", JSON.stringify($scope.board));
        $scope.toggleEditable();
    };

    $scope.getRepoUrl = function(url){
        return url.split("/issues")[0];
    };

    $scope.addRepository = function(){
        $scope.repos.push(
            {
                "name": $scope.github.name,
                "url": $scope.github.url,
                "token": $scope.github.token,
                "lastupdate": "",
                'type': 'github',
                "issues": []
            });
        $scope.github.name = "";
        $scope.github.url = "";
        $scope.github.token = "";
        localStorage.setItem("github.repos", JSON.stringify($scope.repos));
    };

    $scope.deleteRepository = function(repo, $index){
        $scope.repos.splice($index,1);
        localStorage.setItem("github.repos", JSON.stringify($scope.repos));
    };

    $scope.toggleRepo = function(){
        $scope.showRepo = ($scope.showRepo == true) ? false : true;
    };

    $scope.init = function () {
        // repos laden
        var repo = localStorage.getItem("github.repos");
        if (repo !== null) {
            $scope.repos = JSON.parse(repo);
        }else{
            localStorage.setItem("github.repos", JSON.stringify($scope.repos));
        }

        // board laden
        var board = localStorage.getItem("github.board");
        if (board !== null) {
            $scope.board = JSON.parse(board);
        }else{
            localStorage.setItem("github.repos", JSON.stringify($scope.repos));
        }
        //console.log("repos");
        //console.log($scope.repos);
        $scope.loadIssues();
        $scope.getGitHubData();
        console.log($scope.repos);
    };
    $scope.init();
};


GithubProjectIssuesCtrl.$inject = ['$scope', '$timeout', '$http'];
module.controller('GithubProjectIssuesCtrl', GithubProjectIssuesCtrl);


