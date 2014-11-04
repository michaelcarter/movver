var Movver = (function() {

  Movver.prototype.watchedElements = [];
  Movver.prototype.touchStartOffsets = [];
  Movver.prototype.touchEndOffsets = [];
  Movver.prototype.elementTimeouts = [];
  Movver.prototype.viewableLowerBoundary = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  Movver.prototype.MAX_TOUCH_OFFSETS = 3;
  Movver.prototype.FOCUS_PERCENTAGE_THRESHOLD = 70;
  Movver.prototype.DEBUG = false;
  Movver.prototype.EVENT_TIMEOUT = 500;

  function Movver(opts) {
    if (!opts) opts = {};
    if (opts.maxTouchOffsets) this.MAX_TOUCH_OFFSETS = opts.maxTouchOffsets;
    if (opts.focusPercentageThreshold) this.FOCUS_PERCENTAGE_THRESHOLD = opts.focusPercentageThreshold;
    if (opts.eventTimeout) this.EVENT_TIMEOUT = opts.eventTimeout;
    if (!!opts.debug) this.DEBUG = true;
    this._addListeners();
  }

  Movver.prototype.watch = function(element) {
    if (typeof element !== "object") throw new Error("Element must be an object.");
    this.watchedElements.push(element);
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

  Movver.prototype._findElementTimeout = function(element) {
    for (var i = 0; i < this.elementTimeouts.length; i++) {
      if (element === this.elementTimeouts[i].element) {
        return this.elementTimeouts[i];
      }
    }
    return null;
  } 

  Movver.prototype._elementTimeoutExists = function(element) {
    return !!this._findElementTimeout(element);
  }

  Movver.prototype._clearElementTimeout = function(element) {
    var elementTimeout = this._findElementTimeout(element);
    var indexOfElementTimeout = this.elementTimeouts.indexOf(elementTimeout);

    if (elementTimeout) {
      window.clearTimeout(elementTimeout.timeout);
    }

    if (indexOfElementTimeout > -1) {
      this.elementTimeouts.splice(indexOfElementTimeout,1);
    }

    return !!elementTimeout;
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
  Movver.prototype._onTouchStart = function(e) {
    this.touchStartOffsets.push(e.touches[0].pageY - e.view.scrollY);
    if (this.touchStartOffsets.length > this.MAX_TOUCH_OFFSETS) this.touchStartOffsets.shift();
  }

  Movver.prototype._onTouchEnd = function(e) {
    this.touchEndOffsets.push(e.changedTouches[0].pageY - e.view.scrollY);
    if (this.touchEndOffsets.length > this.MAX_TOUCH_OFFSETS) this.touchEndOffsets.shift();
    this.viewableLowerBoundary = Math.min(Math.round(this._arrayAverage(this.touchEndOffsets)), Math.round(this._arrayAverage(this.touchStartOffsets)));
    if (this.DEBUG) this._setVisibleBounds();
  }

  Movver.prototype._onScroll = function() {
    var self = this;

    // Trigger the event on any focussed elements.
    this.watchedElements.forEach(function(element, index) {
      var focusPercentage = self._calculateFocusPercentage(element);
      var elementTimeoutExists = self._elementTimeoutExists(element);
      if ((focusPercentage >= self.FOCUS_PERCENTAGE_THRESHOLD) && !elementTimeoutExists) {

        // Push a timeout to trigger the event onto the stack
        self.elementTimeouts.push({
          element: element,
          timeout: window.setTimeout(function() {
            element.dispatchEvent(new Event('movver'));
          }, self.EVENT_TIMEOUT)
        });
      } else if ((focusPercentage < self.FOCUS_PERCENTAGE_THRESHOLD) && elementTimeoutExists) {
        self._clearElementTimeout(element);
      }

      // Show the focus of the element visually.
      if (self.DEBUG) {
        self._fillRect(element, focusPercentage);
      }
    });
  }

  Movver.prototype._addListeners = function() {
    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('touchend', this._onTouchEnd.bind(this));
    window.onscroll = this._onScroll.bind(this);
  }

  return Movver;
})();