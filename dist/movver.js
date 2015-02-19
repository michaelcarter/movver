var Movver = (function() {

  Movver.prototype.watchedElements = [];
  Movver.prototype.touchStartOffsets = [];
  Movver.prototype.touchEndOffsets = [];
  Movver.prototype.elementTimeouts = [];
  Movver.prototype.viewableLowerBoundary = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  Movver.prototype.pollScrollCount = 0;
  Movver.prototype.MAX_TOUCH_OFFSETS = 2;
  Movver.prototype.FOCUS_PERCENTAGE_THRESHOLD = 70;
  Movver.prototype.DEBUG = false;
  Movver.prototype.EVENT_TIMEOUT = 1000;
  Movver.prototype.MOBILE_THRESHOLD = 490;

  function Movver(opts) {
    if (!opts) opts = {};
    if (opts.touchAverage) this.MAX_TOUCH_OFFSETS = opts.touchAverage;
    if (opts.focusThreshold) this.FOCUS_PERCENTAGE_THRESHOLD = opts.focusThreshold;
    if (opts.eventTimeout) this.EVENT_TIMEOUT = opts.eventTimeout;
    if (opts.mobileThreshold) this.MOBILE_THRESHOLD = opts.mobileThreshold;
    if (!!opts.debug) this.DEBUG = true;

    if (this.DEBUG) {
      document.body.innerHTML += '<div id="thumbArea" style="background:rgba(255,0,0,0.5); position:fixed; width:100%; z-index:1;"></div>';
    }

    this._addListeners();
  }

  Movver.prototype.watch = function(element) {
    if (typeof element !== "object") throw new Error("Element must be an object.");
    this.watchedElements.push(element);
  }

  Movver.prototype.unwatch = function(element) {
    if (typeof element !== "object") throw new Error("Element must be an object.");
    var indexOfElement = this.watchedElements.indexOf(element);
    if (indexOfElement > -1) {
      this.watchedElements.splice(indexOfElement, 1);
      return true
    }
    return false;
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

  Movver.prototype._onMobile = function() {
    return (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / window.devicePixelRatio <= this.MOBILE_THRESHOLD)
  }

  Movver.prototype._scrollOffset = function() {
    if (self.pageYOffset) {
      return self.pageYOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {
      return document.documentElement.scrollTop;
    } else if (document.body) {
      return document.body.scrollTop;
    }
  }

  Movver.prototype._clearPollForScrolling = function() {
    this.pollScrollCount = 0;
    this.lastScrollOffset = -1;
    window.clearInterval(this.scrollPoller);
    this.scrollPoller = false;
  }

  Movver.prototype._checkForScroll = function() {
    this.pollScrollCount += 1;
    var scrollOffset = this._scrollOffset();

    if (this.lastScrollOffset === scrollOffset || this.pollScrollCount >= 50) {
      this._clearPollForScrolling();
    } else {
      this._checkWatchedElementsFocus();
      this.lastScrollOffset = scrollOffset;
      this.pollScrollCount += 1;
    }
  }

  Movver.prototype._pollForScrolling = function() {
    if (this.scrollPoller) {
      this._clearPollForScrolling();
    }
    this.scrollPoller = window.setInterval(this._checkForScroll.bind(this), 100);
  }

  Movver.prototype._checkWatchedElementsFocus = function() {
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

  // DEBUG only functions, for highlighting what's focussed on the page.
  // =================================================================== //
  Movver.prototype._fillRect = function(element, focusPercentage) {
    var brightness = (255/100) * focusPercentage;
    element.style.backgroundColor = 'rgb(0,'+Math.round(brightness)+',0)';
  }

  Movver.prototype._setVisibleBounds = function() {
    var el = document.getElementById("thumbArea");
    el.style.top = this.viewableLowerBoundary+"px";
    el.style.height = (document.documentElement.clientHeight - this.viewableLowerBoundary + 100) + "px";
  }

  // Document listeners
  // ================== //
  Movver.prototype._onTouchStart = function(e) {
    if (!this._onMobile()) return;
    this.touchStartOffsets.push(e.touches[0].pageY - e.view.scrollY);
    if (this.touchStartOffsets.length > this.MAX_TOUCH_OFFSETS) this.touchStartOffsets.shift();
    this._pollForScrolling();
  }

  Movver.prototype._onTouchEnd = function(e) {
    if (!this._onMobile()) return;
    this.touchEndOffsets.push(e.changedTouches[0].pageY - e.view.scrollY);
    if (this.touchEndOffsets.length > this.MAX_TOUCH_OFFSETS) this.touchEndOffsets.shift();
    this.viewableLowerBoundary = Math.min(Math.round(this._arrayAverage(this.touchEndOffsets)), Math.round(this._arrayAverage(this.touchStartOffsets)));
    if (this.DEBUG) this._setVisibleBounds();
  }

  Movver.prototype._addListeners = function() {
    var self = this;

    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('touchend', this._onTouchEnd.bind(this));
  }

  return Movver;
})();

if (typeof window.define === "function" && window.define.amd) {
  window.define('movver', [], function() {
    return Movver;
  });
} else {
  window.Movver = Movver;
}