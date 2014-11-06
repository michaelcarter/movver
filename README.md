# Movver.js (v0.0.1)

## Introduction:
Movver exists solely to provide the **concept of a hover** on mobile devices. It does this by keeping a log of where you're tapping to scroll and then figures out what you're most likely looking at on the remaining viewable portion of the screen. It has no dependencies, and works in all major mobile browsers. Simply attach callbacks to page elements and they'll be executed as they're being looked at.

## Usage:

### 1. Include the library
`<script src="your/path/to/movver.min.js"></script>` or `bower install movver` should do the trick

### 2. Create a movver instance

```
var movver = new Movver(options);
```

`options`:

 - **"debug":** Colors monitored elements according to their focus threshold, and shows you where Movver things your thumb is blocking the screen. Defaults to `false`.
 - **"touchAverage":** The number of touches used to figure out an average for determining where your thumb is over the screen (`1-∞`). It has a sensible default, so probably best to leave alone. If you do change, I'd recommend using debug mode in conjunction to see how your changes affect behaviour.
 - **"focusThreshold":** The percentage amount a given element must be in focus before Movver triggers a `movver` event on it (`0-100`). Again, it has a sensible default.
 - **"eventTimeout":** The number of ms an element must be above the focus threshold before its `movver` event is triggered. Defaults to 1000ms.
 - **"mobileThreshold":** The screen width in pixels (factors in window.devicePixelRatio) under which the Movver library becomes active. This has no default and **is required**.

### 3. Watch elements
```
movver.watch(element);
```
`element`: Can be either a vanilla Javascript DOM element or a jQuery selected DOM element.

### 4. Listen for a movver event
```
element.addEventListener('movver', function(e) {
  console.log("Movver thinks you're looking at", e.target);
});
```

### 5. Unwatch elements

```
movver.unwatch(element);
```

`element`: Can be either a vanilla Javascript DOM element or a jQuery selected DOM element.


## Usage scenarios:
- Pre-caching of content behind tappable page elements.
- Lazy loading images.
- Revealing content as it's viewed.
- Mobile analytics (what are your users actually looking at?).


## PR Wishlist:
- Tablet format support, with tracking of individual thumbs.
- Any further improvements to accuracy, usefulness at the singular task of figuring out what users might be looking at on touch devices.