var myApp = angular.module('mathic',['mongolab','ui.bootstrap']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:MathCtrl, templateUrl:'partials/math'}).
      when('/:id', {controller:ResultCtrl, templateUrl:'partials/results', resolve:ResultCtrl.resolve}).
      otherwise({redirectTo:'/'});
  });

myApp.filter('msToSeconds', function() {
  return function(number) {
    var num = number / 1000
    return num.toFixed(2);
    };
});


function ResultCtrl($scope,$location, $routeParams, Result, Solution) {
  var self = this;

  Result.get({id: $routeParams.id}, function(result) {
    self.originalResult = result;
    $scope.result = new Result(self.originalResult);

    Solution.get({id: $scope.result.solutionId}, function(solution) {
      $scope.solution = new Solution(solution);
    });
  });

  $scope.playAgain = function() {
    $location.path('/');
  }

}


function MathCtrl($scope, $location,$routeParams, Result, Solution) {
  
  $scope.operator = 1;
  $scope.count = 3;
  $scope.questionNumber = 0;
  $scope.problemSet = [];
  var answerSet = [];
  var solutionSet = {};
  var resultSet={};
  var timer;
  var startTime;
  var endTime;

  $scope.newSets = function() {


    $scope.questionNumber = 1;

    for(var i=0; i < $scope.count; i++) {

      if($scope.operator == 1){

        var a = getRandomInt(1,50);
        var b = getRandomInt(1,50);
        $scope.problemSet.push([a,b]);
        answerSet.push(a+b);

      } else if ($scope.operator == 2) {

        var a = getRandomInt(20,50);
        var b = getRandomInt(1,a);
        $scope.problemSet.push([a,b]);
        answerSet.push(a-b);

      } else if ($scope.operator == 3) {

        var a = getRandomInt(2,12);
        var b = getRandomInt(2,12);
        $scope.problemSet.push([a,b]);
        answerSet.push(a*b);

      };
    };

    resultSet.corrects = 0
    timer = Date.now();
    startTime = timer;
    resultSet.operator = $scope.operator;    
    resultSet.results = [];
    resultSet.name = $scope.name;

  };

  $scope.injectAnswer = function(answer) {
    resultSet.results.push({
                          correct: answerSet[$scope.questionNumber-1]==answer,
                          time: Date.now() - timer,
                          answer: answer
                          });
    if(answerSet[$scope.questionNumber-1]==answer){
      resultSet.corrects++;
    }
    timer = Date.now();
    $scope.questionNumber++;

  };

  $scope.postAnswers = function(answer) {
    endTime = Date.now()
    resultSet.results.push({
                          correct: answerSet[$scope.questionNumber-1]==answer,
                          time: endTime - timer,
                          answer: answer
                          });
    if(answerSet[$scope.questionNumber-1]==answer){
      resultSet.corrects++;
    };

    resultSet.totalTime = endTime - startTime;
    resultSet.avgTime = resultSet.totalTime / $scope.count;


    solutionSet.operator = $scope.operator;
    solutionSet.problemSet = $scope.problemSet;
    solutionSet.answerSet = answerSet;
    
    console.log(solutionSet);

    Solution.save(solutionSet,function(solution) {
      resultSet.solutionId = solution._id.$oid;
      Result.save(resultSet, function(result) {
        $location.path('/' + result._id.$oid);
      });
    });

    console.log(resultSet);

  };

  function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}


//This is a module for cloud persistance in mongolab - https://mongolab.com
angular.module('mongolab', ['ngResource'], function($provide) {
  $provide.factory('Result', function($resource) {
      var Result = $resource('https://api.mongolab.com/api/1/databases' +
          '/3suspects/collections/results/:id',
          { apiKey: '509286cee4b010d72c561e95' }, {
            update: { method: 'PUT' }
          }
      );

      Result.prototype.update = function(cb) {
        return Result.update({id: this._id.$oid},
            angular.extend({}, this, {_id:undefined}), cb);
      };

      Result.prototype.destroy = function(cb) {
        return Result.remove({id: this._id.$oid}, cb);
      };

      return Result;
    })
  $provide.factory('Solution', function($resource) {
      var Solution = $resource('https://api.mongolab.com/api/1/databases' +
          '/3suspects/collections/solutions/:id',
          { apiKey: '509286cee4b010d72c561e95' }, {
            update: { method: 'PUT' }
          }
      );

      Solution.prototype.update = function(cb) {
        return Solution.update({id: this._id.$oid},
            angular.extend({}, this, {_id:undefined}), cb);
      };

      Solution.prototype.destroy = function(cb) {
        return Solution.remove({id: this._id.$oid}, cb);
      };

      return Solution;
    })
})
