/*global define*/
define([
        '../Core/freezeObject'
    ], function(
        freezeObject) {
    "use strict";

    /**
     * The render pass for a command.
     *
     * @private
     */
    var Pass = {
        GLOBE : 0,
        GROUND : 1,
        OPAQUE : 2,
        // Commands are executed in order by pass up to the translucent pass.
        // Translucent geometry needs special handling (sorting/OIT). Overlays
        // are also special (they're executed last, they're not sorted by frustum).
        TRANSLUCENT : 3,
        OVERLAY : 4,
        NUMBER_OF_PASSES : 5
    };

    return freezeObject(Pass);
});