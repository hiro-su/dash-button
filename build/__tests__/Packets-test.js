'use strict';

var _pcap = require('pcap');

var _pcap2 = _interopRequireDefault(_pcap);

var _Packets = require('../Packets');

var _Packets2 = _interopRequireDefault(_Packets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

jest.mock('pcap');

describe('Packets', () => {
  it(`creates a capture session for DHCP requests and ARP probes`, () => {
    _Packets2.default.createCaptureSession('en0');
    expect(_pcap2.default.createSession.mock.calls.length).toBe(1);
    expect(_pcap2.default.createSession.mock.calls[0][0]).toBe('en0');
    expect(_pcap2.default.createSession.mock.calls[0][1]).toBe('(arp or (udp and src port 68 and dst port 67 and udp[247:4] == 0x63350103)) and src host 0.0.0.0');
  });
});