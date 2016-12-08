'use strict';

var _MacAddresses = require('../MacAddresses');

var _MacAddresses2 = _interopRequireDefault(_MacAddresses);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('MacAddresses', () => {
  it(`converts arrays of decimal numbers to hex strings`, () => {
    let decimals = [115, 107, 32, 146, 92, 19];
    let hex = _MacAddresses2.default.decimalToHex(decimals);
    expect(hex).toBe('73:6b:20:92:5c:13');
  });

  it(`left-pads hex digits with zeros`, () => {
    let decimals = [0, 1, 2, 3, 4, 5];
    let hex = _MacAddresses2.default.decimalToHex(decimals);
    expect(hex).toBe('00:01:02:03:04:05');
  });
});