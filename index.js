var objectMerge = require('object-merge');
var postcss     = require('postcss');

module.exports = postcss.plugin('postcss-crip', function (options) {

    options = options || {};

    var DEFAULTS = require('crip-css-properties');

    var PROPS = objectMerge(DEFAULTS, options);

    return function (css) {

        css.walkRules(function (rule) {
            rule.each(function(decl) {

                var prop = decl.prop;
                var value = decl.value;
                if (!PROPS.hasOwnProperty(prop)) return;

                var newValue = value;
                if ("adjustColors" in options && options.adjustColors && ["color", "background-color", "border-color", "outline-color"].includes(prop)) {
                    if (/^[#][A-Fa-f0-9]{6}[A-Fa-f0-9]{2}$/.test(value)) {
                        // Hex color value
                        newValue = value.replace(/^([#][A-Fa-f0-9]{2})(.*)$/, "#00$2");
                    }
                    else if (/^rgba?\([^\)]*\)/.test(value)) {
                        // RGB[A] color value
                        newValue = value.replace(/^(rgba?)(\([^,]*,)(.*)$/, "$1( 0, $3");
                    }
                    else if (/(\bred\b)/.test(value)) {
                        // String color value
                        newValue = value.replace(/(\bred\b)/gi, "blue");
                    }
                    else if (/^hsla?\([^\)]*\)/.test(value)) {
                        // HSL[A] color value
                        let hueValue = parseFloat(/^(hsla?\([\s]?)([^,]*)(.*)$/.exec(value)[2]);
                        newValue = value.replace(/(?<=^hsla?\()([^,]*)/, Math.min(Math.max(hueValue, 20), 340))
                    }
                }

                var properties = PROPS[prop];

                properties.forEach(function (property, index) {
                    decl.cloneBefore({
                        prop: properties[index],
                        value: newValue
                    });
                });

                decl.remove();

            });
        });

    };
});
