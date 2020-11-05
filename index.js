var objectMerge = require('object-merge');
var postcss     = require('postcss');

module.exports = postcss.plugin('postcss-crip', function (options) {

    options = options || {};

    var DEFAULTS = require('crip-css-properties');

    var PROPS = objectMerge(DEFAULTS, options);

    return function (css) {

        function correctColorValue(colorValue) {
            var colorProps = [
                'color',
                'background-color',
                'border-color',
                'outline-color'
            ];

            if (!colorProps.includes(prop))
            {
                // Unsupported property
                return colorValue;
            }
            if (/^[#][A-Fa-f0-9]{6}[A-Fa-f0-9]{2}$/.test(colorValue)) {
                // Hex color value
                var expr = /^([#][A-Fa-f0-9]{2})(.*)$/;
                colorValue = colorValue.replace(expr, '#00$2');
            }
            else if (/^rgba?\([^\)]*\)/.test(colorValue)) {
                // RGB[A] color value
                var expr = /^(rgba?)(\([^,]*,)(.*)$/;
                colorValue = colorValue.replace(expr, '$1( 0, $3');
            }
            else if (/(\bred\b)/.test(colorValue)) {
                // String color value
                var expr = /(\bred\b)/gi;
                colorValue = colorValue.replace(expr, 'blue');
            }
            else if (/^hsla?\([^\)]*\)/.test(colorValue)) {
                // HSL[A] color value
                var expr = /^(hsla?\([\s]?)([^,]*)(.*)$/;
                var oldHue = parseFloat(expr.exec(colorValue)[2]);
                var newHue = Math.min(Math.max(oldHue, 20), 340);
                colorValue = colorValue.replace(/(?:hsla?\()([^,]*)/, newHue);
            }
            return colorValue;
        }

        css.walkRules(function (rule) {
            rule.each(function(decl) {

                var prop = decl.prop;

                if (!PROPS.hasOwnProperty(prop)) return;

                var value = decl.value;

                if ('adjustColors' in options && options.adjustColors) {
                    value = correctColorValue(value);
                }

                var properties = PROPS[prop];

                properties.forEach(function (property, index) {
                    decl.cloneBefore({
                        prop: properties[index],
                        value: value
                    });
                });

                decl.remove();
            });
        });

    };
});
