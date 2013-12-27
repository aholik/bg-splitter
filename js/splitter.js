angular
  
  .module('bgDirectives', ['LocalStorageModule'])
  
  .directive('bgSplitter', ['localStorageService',
    function(localStorage) {

      var bgSplitter = {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
          orientation: '@',
          position: '@',
          initialPosition: '@',
          storageId: '@'
        },
        template: '<div class="split-panes {{orientation}}" ng-transclude ng></div>',
        controller: function ($scope) {
          $scope.panes = [];
          
          this.addPane = function(pane){
            if ($scope.panes.length > 1) 
              throw 'splitters can only have two panes';
            $scope.panes.push(pane);
            return $scope.panes.length;
          };
        },
        link: function(scope, element, attrs) {
          var handler = angular.element('<div class="split-handler"></div>');
          var pane1 = scope.panes[0];
          var pane2 = scope.panes[1];
          var vertical = scope.orientation == 'vertical';
          var pane1Min = pane1.minSize || 0;
          var pane2Min = pane2.minSize || 0;
          var drag = false;
          var position = 0.5;
          var storageID = scope.storageId ? "ng-splitter."+scope.storageId : false;

          if (scope.position){
            position = scope.$parent[scope.position];
          }
          else if (storageID){
            position = localStorage.get(storageID) || scope.initialPosition || 0.5;
          }
          else if (scope.initialPosition){
            position = scope.initialPosition;
          }
          
          pane1.elem.after(handler);

          function updatePosition(pos,len){
            if (pos < pane1Min) return;
            if (len - pos < pane2Min) return;

            if (vertical) {
              handler.css('top', pos + 'px');
              pane1.elem.css('height', pos + 'px');
              pane2.elem.css('top', pos + 'px');
            } 
            else {
              handler.css('left', pos + 'px');
              pane1.elem.css('width', pos + 'px');
              pane2.elem.css('left', pos + 'px');
            }

            position = pos/len;
          }

          function savePosition(pos){
            if (scope.position){
              scope.$parent.safeApply(function(){
                scope.$parent[scope.position] = pos;
              });
            }
            if (storageID){
              localStorage.add(storageID, pos);
            }
          }
          
          element.bind('mousemove', function (ev) {
            if (!drag) return;
            var bounds = element[0].getBoundingClientRect();
            var length = vertical ? (bounds.bottom - bounds.top) : (bounds.right - bounds.left);
            var pos = vertical ? (ev.clientY - bounds.top) : (ev.clientX - bounds.left);
            updatePosition(pos,length);
          });
      
          handler.bind('mousedown', function (ev) {
            ev.preventDefault();
            drag = true; 
          });
      
          angular.element(document).bind('mouseup', function (ev) {
            drag = false;
            savePosition(position);
          });

          // init
          {
            var bounds = element[0].getBoundingClientRect();
            var length = vertical ? (bounds.bottom - bounds.top) : (bounds.right - bounds.left);
            updatePosition( length*position, length );
          }
        }
      };

      return bgSplitter;
    }
  ])
    
  .directive('bgPane', function () {
    return {
      restrict: 'E',
      require: '^bgSplitter',
      replace: true,
      transclude: true,
      scope: {
        minSize: '='
      },
      template: '<div class="split-pane{{index}}" ng-transclude></div>',
      link: function(scope, element, attrs, bgSplitterCtrl) {
        scope.elem = element;
        scope.index = bgSplitterCtrl.addPane(scope);
      }
    };
  })

;
