'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  getDefault() {
    let interfaces = _os2.default.networkInterfaces();
    let names = (0, _keys2.default)(interfaces);
    for (let name of names) {
      if (interfaces[name].every(iface => !iface.internal)) {
        return name;
      }
    }
    return null;
  }
};
module.exports = exports['default'];