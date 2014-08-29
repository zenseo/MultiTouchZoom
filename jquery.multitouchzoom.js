// jQuery multitouchzoom 1.0.0
// ------------------------------------------------------------------------
//
// Developed and maintained by Nelson Kuang
// Inspired by and referenced from Igor Ramadas's WipeTouch.

//
// USAGE
// ------------------------------------------------------------------------
//
// $(selector).multitouchzoom(config);
//
// The multitouchzoom events should expect 2 fingers(a finger and b finger) touch on the screen at the same time;
//
//
// EXAMPLE
//		$(document).multitouchzoom({
//			zoomIn: function() { alert("zoomIn "); },
//			zoomOut: function() { alert("zoomOut "); }
//		});
//
//
// More details at https://github.com/nelsonkuang/MultiTouchZoom
//
//


(function ($) {
    $.fn.multitouchzoom = function (settings) {
        // ------------------------------------------------------------------------
        // PLUGIN SETTINGS
        // ------------------------------------------------------------------------

        var config = {

            // Variables and options
            moveX: 40, 	// minimum amount of horizontal pixels to trigger a wipe event
            moveY: 40, 	// minimum amount of vertical pixels to trigger a wipe event
            preventDefault: true, // if true, prevents default events (click for example)

            // Multi Touch Zoom events
            zoomIn: false, // called on zoom in gesture
            zoomOut: false, // called on zoom out gesture
            multiTouchMove: false, // triggered whenever touchMove acts

        };

        if (settings) {
            $.extend(config, settings);
        }

        this.each(function () {
            // ------------------------------------------------------------------------
            // INTERNAL VARIABLES
            // ------------------------------------------------------------------------
            var startDate = false; 			// used to calculate timing and aprox. acceleration
            var touchedElement = false; 	// element which user has touched
            var clickEvent = false; 		// holds the click event of the target, when used hasn't clicked

            var aStartX; 					// where finger "a" touch has started, left
            var aStartY; 					// where finger "a" touch has started, top
            var aCurX; 						// keeps finger "a" touch X position while moving on the screen
            var aCurY; 						// keeps finger "a" touch Y position while moving on the screen
            var aIsMoving = false; 			// is user's finger "a" touching and moving?

            var bStartX; 					// where finger "b" touch has started, left
            var bStartY; 					// where finger "b" touch has started, top
            var bCurX; 						// keeps finger "b" touch X position while moving on the screen
            var bCurY; 						// keeps finger "b" touch Y position while moving on the screen
            var bIsMoving = false; 			// is user's finger "b" touching and moving?


            // ------------------------------------------------------------------------
            // Multi Touch Eevents
            // ------------------------------------------------------------------------

            // Called when user multi-touches the screen.
            function onMultiTouchStart(e) {
                var aStart = e.originalEvent.touches[0] && e.originalEvent.touches.length > 1;
                var bStart = e.originalEvent.touches[1];
                if (!aIsMoving && !bIsMoving && aStart && bStart) {
                    if (config.preventDefault) {
                        e.preventDefault();
                    }

                    aStartX = e.originalEvent.touches[0].pageX;
                    aStartY = e.originalEvent.touches[0].pageY;
                    bStartX = e.originalEvent.touches[1].pageX;
                    bStartY = e.originalEvent.touches[1].pageY;

                    $(this).bind("touchmove", onMultiTouchMove);

                    // Set the start date and current X/Y for finger "a" & finger "b".
                    startDate = new Date().getTime();
                    aCurX = aStartX;
                    aCurY = aStartY;
                    bCurX = bStartX;
                    bCurY = bStartY;
                    aIsMoving = true;
                    bIsMoving = true;

                    touchedElement = $(e.target);
                }
            }

            // Called when user untouches the screen.
            function onTouchEnd(e) {
                if (config.preventDefault) {
                    e.preventDefault();
                }

                // When touch events are not present, use mouse events.
                $(this).unbind("touchmove", onMultiTouchMove);


                // If is moving then calculate the touch results, otherwise reset it.
                if (aIsMoving || bIsMoving) {
                    touchCalculate(e);
                }
                else {
                    resetTouch();
                }
            }

            // Called when user is touching and moving on the screen.
            function onMultiTouchMove(e) {
                if (config.preventDefault) {
                    e.preventDefault();
                }

                if (aIsMoving || bIsMoving) {
                    aCurX = e.originalEvent.touches[0].pageX;
                    aCurY = e.originalEvent.touches[0].pageY;
                    bCurX = e.originalEvent.touches[1].pageX;
                    bCurY = e.originalEvent.touches[1].pageY;
                    // If there's a MultiTouchMove event, call it passing
                    // current X and Y position (curX and curY).
                    if (config.multiTouchMove) {
                        triggerEvent(config.multiTouchMove, {
                            aCurX: aCurX,
                            aCurY: aCurY,
                            bCurX: bCurX,
                            bCurY: bCurY
                        });
                    }
                }
            }

            // ------------------------------------------------------------------------
            // CALCULATE TOUCH AND TRIGGER
            // ------------------------------------------------------------------------

            function touchCalculate(e) {
                var endDate = new Date().getTime(); 	// current date to calculate timing
                var ms = startDate - endDate; 			// duration of touch in milliseconds

                var ax = aCurX; 							// current left position of finger 'a'
                var ay = aCurY; 							// current top position of finger 'a'
                var bx = bCurX; 							// current left position of finger 'b'
                var by = bCurY; 							// current top position of finger 'b'
                var dax = ax - aStartX; 					// diff of current left to starting left of finger 'a'
                var day = ay - aStartY; 					// diff of current top to starting top of finger 'a'
                var dbx = bx - bStartX; 					// diff of current left to starting left of finger 'b'
                var dby = by - bStartY; 					// diff of current top to starting top of finger 'b'
                var aax = Math.abs(dax); 					// amount of horizontal movement of finger 'a'
                var aay = Math.abs(day); 					// amount of vertical movement of finger 'a'
                var abx = Math.abs(dbx); 					// amount of horizontal movement of finger 'b'
                var aby = Math.abs(dby); 					// amount of vertical movement of finger 'b'

                //diff of current starting distance to starting distance between the 2 points
                var diff = Math.sqrt((aStartX - bStartX) * (aStartX - bStartX) + (aStartY - bStartY) * (aStartY - bStartY)) - Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
                
                // If moved less than 15 pixels, touch duration is less than 100ms,
                // then trigger a click event and stop processing.
                if (aax < 15 && aay < 15 && abx < 15 && aby < 15 && ms < 100) {
                    clickEvent = false;

                    if (config.preventDefault) {
                        resetTouch();

                        touchedElement.trigger("click");
                        return;
                    }
                }

                // Is it zooming in or out?
                var isZoomIn = diff > 0;
                var isZoomOut = diff < 0;

                // Calculate speed from 1 to 5, 1 being slower and 5 faster.
                var as = ((aax + aay) * 60) / ((ms) / 6 * (ms));
                var bs = ((abx + aby) * 60) / ((ms) / 6 * (ms));

                if (as < 1) as = 1;
                if (as > 5) as = 5;

                if (bs < 1) bs = 1;
                if (bs > 5) bs = 5;

                var result = {
                    aSpeed: parseInt(as),
                    bSpeed: parseInt(bs),
                    aX: aax,
                    aY: aay,
                    bX: abx,
                    bY: aby,
                    source: touchedElement
                };

                if (aax >= config.moveX || abx >= config.moveX||aay>= config.moveY||aby>=config.moveY) {
                    // If it is zooming in, trigger zoomIn events.
                    if (isZoomIn) {
                        triggerEvent(config.zoomIn, result);
                    }
                        // Otherwise trigger zoomOut events.
                    else if (isZoomOut) {
                        triggerEvent(config.zoomOut, result);
                    }
                }
                resetTouch();
            }

            // Resets the cached variables.
            function resetTouch() {
                aStartX = false;
                aStartY = false;
                bStartX = false;
                bStartY = false;
                startDate = false;
                aIsMoving = false;
                bIsMoving = false;

                // If there's a click event, bind after a few miliseconds.
                if (clickEvent) {
                    window.setTimeout(function () {
                        touchedElement.bind("click", clickEvent);
                        clickEvent = false;
                    }, 50);
                }
            }

            // Trigger a event passing a result object with
            // aSpeed & bSpeed from 1 to 5, aX / aY & bX / bY movement amount in pixels,
            // and the source element.
            function triggerEvent(zoomEvent, result) {
                if (zoomEvent) {
                    zoomEvent(result);
                }
            }

            // ------------------------------------------------------------------------
            // ADD MULTITOUCHSTART AND TOUCHEND EVENT LISTENERS
            // ------------------------------------------------------------------------

            if ("ontouchstart" in document.documentElement) {

                $(this).bind("touchstart", onMultiTouchStart);
                $(this).bind("touchend", onTouchEnd);
            }
        });

        return this;
    };
})(jQuery);
