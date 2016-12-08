#!/usr/bin/env node
'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _pcap = require('pcap');

var _pcap2 = _interopRequireDefault(_pcap);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _MacAddresses = require('./MacAddresses');

var _MacAddresses2 = _interopRequireDefault(_MacAddresses);

var _NetworkInterfaces = require('./NetworkInterfaces');

var _NetworkInterfaces2 = _interopRequireDefault(_NetworkInterfaces);

var _Packets = require('./Packets');

var _Packets2 = _interopRequireDefault(_Packets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (require.main === module) {
  let parser = _yargs2.default.usage('Usage: $0 <command> [options]').command('scan', 'Scan for DHCP requests and ARP probes').example('$0 scan -i wlan0', 'Scan for DHCP requests and ARP probes on the given network interface').help().alias('h', 'help').version().option('i', {
    alias: 'interface',
    nargs: 1,
    default: _NetworkInterfaces2.default.getDefault(),
    describe: 'The network interface on which to listen',
    global: true
  });
  let { argv } = parser;
  let commands = new _set2.default(argv._);
  if (!commands.size) {
    parser.showHelp();
  } else if (commands.has('scan')) {
    let interfaceName = argv.interface;
    let pcapSession = _Packets2.default.createCaptureSession(interfaceName);
    pcapSession.addListener('packet', rawPacket => {
      let packet = _pcap2.default.decode(rawPacket);
      // console.log('Buffer:', packet.payload.payload.payload.data.toString('hex'));
      let sourceMacAddress = _MacAddresses2.default.getEthernetSource(packet);
      console.log('Detected a DHCP request or ARP probe from %s', sourceMacAddress);
    });
    console.log('Scanning for DHCP requests and ARP probes on %s...', interfaceName);
  }
}