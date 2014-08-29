This is a Multi-Touch Zoom In & Zoom Out jQuery touch plugin
, You can bind an zoomIn / zoomOut event for your dom with it.
, The multitouchzoom events should expect 2 fingers(a finger and b finger) touch on the screen at the same time;

EXAMPLE
$(selector).multitouchzoom({
zoomIn: function() { alert("zoomIn "); },
zoomOut: function() { alert("zoomOut "); }
});

