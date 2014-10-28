var Movver = (function() {

  Movver.prototype.attachedElements = [];
  Movver.prototype.touchStartOffsets = [];
  Movver.prototype.touchEndOffsets = [];
  Movver.prototype.viewableLowerBoundary = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  Movver.prototype.MAX_TOUCH_OFFSETS = 2;
  Movver.prototype.FOCUS_PERCENTAGE_THRESHOLD = 80;
  Movver.prototype.DEBUG = false;

  function Movver(opts) {
    if (opts.maxTouchOffsets) this.MAX_TOUCH_OFFSETS = opts.maxTouchOffsets;
    if (opts.focusPercentageThreshold) this.FOCUS_PERCENTAGE_THRESHOLD = opts.focusPercentageThreshold;
    if (!!opts.debug) this.DEBUG = true;
    this._addListeners();
  }

  Movver.prototype.attach = function(element, callback) {
    if (typeof element !== "object") throw new Error("Element must be an object.");
    if (typeof callback !== "function") throw new Error("Callback must be a function.");
    this.attachedElements.push([element, callback]);
  }

  // PRIVATE FUNCTIONS
  // ================= //
  Movver.prototype._arrayAverage = function(arrayOfIntegers) {
    var sum = arrayOfIntegers.reduce(function(a, b) { return a + b });
    return sum / arrayOfIntegers.length;
  }

  Movver.prototype._calculateFocusPercentage = function(element) {
    var elementBoundingClientRect = element.getBoundingClientRect();
    var elementMidPoint = (elementBoundingClientRect.top + elementBoundingClientRect.bottom) / 2
    var result = (elementMidPoint / (this.viewableLowerBoundary/2)) * 100;
    if (result > 100) result = 200-result;
    return (result < 0) ? 0 : result;
  }

  // DEBUG only functions, for highlighting what's focussed on the page.
  // =================================================================== //
  Movver.prototype._fillRect = function(element, focusPercentage) {
    var brightness = (255/100) * focusPercentage;
    element.style.backgroundColor = 'rgb(0,'+Math.round(brightness)+',0)';
  }

  Movver.prototype._setVisibleBounds = function() {
    var el = document.getElementById("thumbArea");
    el.style.top = this.viewableLowerBoundary+"px";
    el.style.height = (document.documentElement.clientHeight - this.viewableLowerBoundary) + "px";
  }

  // Document listeners
  // ================== //
  Movver.prototype._addListeners = function() {
    var self = this;

    document.addEventListener('touchstart', function(e) {
      self.touchStartOffsets.push(e.touches[0].pageY - e.view.scrollY);
      if (self.touchStartOffsets.length > self.MAX_TOUCH_OFFSETS) self.touchStartOffsets.shift();
    });

    document.addEventListener('touchend', function(e) {
      self.touchEndOffsets.push(e.changedTouches[0].pageY - e.view.scrollY);
      if (self.touchEndOffsets.length > self.MAX_TOUCH_OFFSETS) self.touchEndOffsets.shift();
      self.viewableLowerBoundary = Math.min(Math.round(self._arrayAverage(self.touchEndOffsets)), Math.round(self._arrayAverage(self.touchStartOffsets)));
      if (self.DEBUG) self._setVisibleBounds();
    });

    window.onscroll = function() {
      self.attachedElements.forEach(function(elAndCallback) {
        var el = elAndCallback[0];
        var callback = elAndCallback[1];
        var focusPercentage = self._calculateFocusPercentage(el);
        if (focusPercentage >= self.FOCUS_PERCENTAGE_THRESHOLD) {
          callback(el);
        }
        if (self.DEBUG) self._fillRect(el, focusPercentage);
      });
    }  
  }

  return Movver;
})();

window.onload = function() {
  var movver = new Movver({debug: true});
  var elementIds = ["para1", "para2", "para3", "para4", "para5", "para6", "para7", "para8", "para9", "para10"];
  elementIds.forEach(function(id) {
    movver.attach(document.getElementById(id), function(el) {
      console.log("focussed:", el);
    });
  });
}