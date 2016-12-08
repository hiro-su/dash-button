'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _pcap = require('pcap');

var _pcap2 = _interopRequireDefault(_pcap);

var _MacAddresses = require('./MacAddresses');

var _MacAddresses2 = _interopRequireDefault(_MacAddresses);

var _NetworkInterfaces = require('./NetworkInterfaces');

var _NetworkInterfaces2 = _interopRequireDefault(_NetworkInterfaces);

var _Packets = require('./Packets');

var _Packets2 = _interopRequireDefault(_Packets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let pcapSession;

function getPcapSession(interfaceName) {
  if (!pcapSession) {
    pcapSession = _Packets2.default.createCaptureSession(interfaceName);
  } else {
    _assert2.default.equal(interfaceName, pcapSession.device_name, 'The existing pcap session must be listening on the specified interface');
  }
  return pcapSession;
}

class DashButton {
  constructor(macAddress, options = {}) {
    this._macAddress = macAddress;
    this._networkInterface = options.networkInterface || _NetworkInterfaces2.default.getDefault();
    this._packetListener = this._handlePacket.bind(this);
    this._dashListeners = new _set2.default();
    this._isResponding = false;
  }

  addListener(listener) {
    if (!this._dashListeners.size) {
      let session = getPcapSession(this._networkInterface);
      session.addListener('packet', this._packetListener);
    }

    // We run the listeners with Promise.all, which rejects early as soon as
    // any of its promises are rejected. Since we want to wait for all of the
    // listeners to finish we need to catch any errors they may throw.
    let guardedListener = this._createGuardedListener(listener);
    this._dashListeners.add(guardedListener);

    return new Subscription(() => {
      this._dashListeners.delete(guardedListener);
      if (!this._dashListeners.size) {
        let session = getPcapSession(this._networkInterface);
        session.removeListener('packet', this._packetListener);
        if (!session.listenerCount('packet')) {
          session.close();
        }
      }
    });
  }

  _createGuardedListener(listener) {
    return (() => {
      var _ref = (0, _asyncToGenerator3.default)(function* (...args) {
        try {
          yield listener(...args);
        } catch (error) {
          return error;
        }
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })();
  }

  _handlePacket(rawPacket) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this._isResponding) {
        return;
      }

      let packet = _pcap2.default.decode(rawPacket);
      let macAddress = _MacAddresses2.default.getEthernetSource(packet);
      if (macAddress !== _this._macAddress) {
        return;
      }

      _this._isResponding = true;
      try {
        // The listeners are guarded so this should never throw, but wrap it in
        // try-catch to be defensive
        let listeners = (0, _from2.default)(_this._dashListeners);
        yield _promise2.default.all(listeners.map(function (listener) {
          return listener(packet);
        }));
      } finally {
        _this._isResponding = false;
      }
    })();
  }
}

exports.default = DashButton;
class Subscription {
  constructor(onRemove) {
    this._remove = onRemove;
  }

  remove() {
    if (!this._remove) {
      return;
    }
    this._remove();
    delete this._remove;
  }
}
module.exports = exports['default'];