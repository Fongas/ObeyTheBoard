var LocalStorageCtrl = function LocalStorageCtrl($scope, $timeout, $http, $modal) {

    $scope.localStorageOn = false;
    $scope.userDetailOn = false;
    $scope.localStorage = [];
    $scope.localStorageItem = undefined;

    /**
     * LOCAL STORAGE
     */
    $scope.showlocalStorage = function () {
        $scope.localStorageOn = true;
        $scope.userDetailOn = false;
    };

    $scope.clearLocalStorage = function () {
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'modalLocalStorage.html',
            controller: 'ModalInstanceCtrl',
            size: 200,
            resolve: {
                item: function () {
                    return undefined;
                }
            }
        });

        modalInstance.result.then(function () {
            $scope.clearCompleteLocalStorage();
        }, function () {
            // keine Aktion durchführen
        });
    };

    $scope.clearCompleteLocalStorage = function(){
        localStorage.removeItem("fongas.users");
        localStorage.removeItem("fongas.users.lastSync");
        localStorage.removeItem("fongas.repos");
        localStorage.removeItem("fongas.boards");
        localStorage.removeItem("fongas.boards.lastModify");
        localStorage.removeItem("fongas.assignee");
        localStorage.removeItem("fongas.tags.lastSync");
        localStorage.removeItem("fongas.issues.lastSync");
        $scope.loadLocalStorageData();
    };

    $scope.showLocalStorageItem = function (item) {
        $scope.localStorageItem = item;
    };

    $scope.clearLocalStorageItem = function (key) {
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'modalLocalStorageItem.html',
            controller: 'ModalInstanceCtrl',
            size: 200,
            resolve: {
                item: function () {
                    return key;
                }
            }
        });

        modalInstance.result.then(function () {
            $scope.localStorageItem = undefined;
            localStorage.removeItem(key);
            $scope.loadLocalStorageData();
        }, function () {
            // keine Aktion durchführen
        });
    };

    $scope.loadLocalStorageData = function () {
        $scope.localStorage = [];
        for (var i in localStorage) {
            var value = localStorage[i].slice(1, -1);
            value = JSON.parse(localStorage[i]);
            $scope.localStorage.push({"key": i, "value": value});
        }
    };



    /**
     * INIT
     */
    $scope.init = function () {
        $scope.loadLocalStorageData();
    };
    $scope.init();
};


LocalStorageCtrl.$inject = ['$scope', '$timeout', '$http', '$modal'];
module.controller('LocalStorageCtrl', LocalStorageCtrl);

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

module.controller('ModalInstanceCtrl', function ($scope, $modalInstance, item) {

    $scope.item = item;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

