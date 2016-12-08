'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pcap = require('pcap');

var _pcap2 = _interopRequireDefault(_pcap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Dash Buttons send DHCPREQUEST messages (new) and ARP probes (old)
const PACKET_FILTER = '(arp or (udp and src port 68 and dst port 67 and udp[247:4] == 0x63350103)) and src host 0.0.0.0';
exports.default = {
  createCaptureSession(interfaceName) {
    return _pcap2.default.createSession(interfaceName, PACKET_FILTER);
  }
};
module.exports = exports['default'];