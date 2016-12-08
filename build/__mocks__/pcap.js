'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
let pcap = require.requireActual('pcap');

let pcapMock = jest.genMockFromModule('pcap');
pcapMock.decode = pcap.decode;

exports.default = pcapMock;
module.exports = exports['default'];