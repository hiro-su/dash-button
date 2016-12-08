'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _padStart = require('lodash/padStart');

var _padStart2 = _interopRequireDefault(_padStart);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let MacAddresses = {
  getEthernetSource(packet) {
    return MacAddresses.decimalToHex(packet.payload.shost.addr);
  },

  decimalToHex(numbers) {
    let hexStrings = numbers.map(decimal => (0, _padStart2.default)(decimal.toString(16), 2, '0'));
    return hexStrings.join(':');
  }
};
exports.default = MacAddresses;
module.exports = exports['default'];