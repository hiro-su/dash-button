'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

jest.mock('pcap');
jest.mock('../NetworkInterfaces');

describe('DashButton', () => {
  const MAC_ADDRESS = '00:11:22:33:44:55';
  const NETWORK_INTERFACE = 'en0';

  let pcap;
  let DashButton;
  let NetworkInterfaces;

  beforeEach(() => {
    pcap = require('pcap');
    DashButton = require('../DashButton');
    NetworkInterfaces = require('../NetworkInterfaces');

    pcap.createSession.mockImplementation(() => createMockPcapSession(NETWORK_INTERFACE));
    NetworkInterfaces.getDefault.mockReturnValue(NETWORK_INTERFACE);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it(`creates a pcap session the first time a listener is added`, () => {
    let button = new DashButton(MAC_ADDRESS);
    button.addListener(() => {});

    expect(pcap.createSession.mock.calls.length).toBe(1);
  });

  it(`shares pcap sessions amongst buttons`, () => {

    let button1 = new DashButton(MAC_ADDRESS);
    button1.addListener(() => {});

    let button2 = new DashButton('66:77:88:99:aa:bb');
    button2.addListener(() => {});

    expect(pcap.createSession.mock.calls.length).toBe(1);
  });

  it(`notifies the appropriate listeners for each packet`, () => {
    let mockSession = createMockPcapSession(NETWORK_INTERFACE);
    pcap.createSession.mockReturnValue(mockSession);

    let button1Listener = jest.genMockFunction();
    let button2Listener = jest.genMockFunction();

    let button1 = new DashButton(MAC_ADDRESS);
    button1.addListener(button1Listener);
    let button2 = new DashButton('66:77:88:99:aa:bb');
    button2.addListener(button2Listener);

    let packet1 = createMockArpProbe(MAC_ADDRESS);
    mockSession.emit('packet', packet1);
    expect(button1Listener.mock.calls.length).toBe(1);
    expect(button2Listener.mock.calls.length).toBe(0);

    let packet2 = createMockArpProbe('66:77:88:99:aa:bb');
    mockSession.emit('packet', packet2);
    expect(button1Listener.mock.calls.length).toBe(1);
    expect(button2Listener.mock.calls.length).toBe(1);
  });

  it(`waits for listeners for a prior packet to asynchronously complete ` + `before handling any new packets`, (0, _asyncToGenerator3.default)(function* () {
    let mockSession = createMockPcapSession();
    let listenerCompletion = null;
    let originalAddListener = mockSession.addListener;
    mockSession.addListener = function addListener(eventName, listener) {
      originalAddListener.call(this, eventName, function (...args) {
        listenerCompletion = listener.apply(this, args);
      });
    };
    pcap.createSession.mockReturnValue(mockSession);

    let button = new DashButton(MAC_ADDRESS);
    let calls = 0;
    button.addListener(function () {
      calls++;
    });

    let packet = createMockArpProbe(MAC_ADDRESS);
    mockSession.emit('packet', packet);
    expect(calls).toBe(1);
    let firstListenerCompletion = listenerCompletion;
    mockSession.emit('packet', packet);
    expect(calls).toBe(1);
    yield firstListenerCompletion;
    mockSession.emit('packet', packet);
    expect(calls).toBe(2);
  }));

  it(`waits for all listeners even if some threw an error`, (0, _asyncToGenerator3.default)(function* () {
    let mockSession = createMockPcapSession();
    pcap.createSession.mockReturnValue(mockSession);

    let button = new DashButton(MAC_ADDRESS);
    let errorCount = 0;
    button.addListener(function () {
      errorCount++;
      throw new Error('Intentional sync error');
    });
    button.addListener(function () {
      errorCount++;
      return _promise2.default.reject(new Error('Intentional async error'));
    });

    let listenerPromise;
    button.addListener(function () {
      listenerPromise = (0, _asyncToGenerator3.default)(function* () {
        // Wait for the other listeners to throw
        yield _promise2.default.resolve();
        expect(errorCount).toBe(2);
        yield _promise2.default.resolve();
        return 'success';
      })();
      return listenerPromise;
    });

    let packet = createMockArpProbe(MAC_ADDRESS);
    expect(listenerPromise).not.toBeDefined();
    mockSession.emit('packet', packet);
    expect(listenerPromise).toBeDefined();
    let result = yield listenerPromise;
    expect(result).toBe('success');
  }));

  it(`runs its async listeners concurrently`, () => {
    let mockSession = createMockPcapSession();
    pcap.createSession.mockReturnValue(mockSession);

    let button = new DashButton(MAC_ADDRESS);
    let calls = 0;
    button.addListener((0, _asyncToGenerator3.default)(function* () {
      calls++;
      yield _promise2.default.resolve();
    }));
    button.addListener((0, _asyncToGenerator3.default)(function* () {
      calls++;
      yield _promise2.default.resolve();
    }));

    let packet = createMockArpProbe(MAC_ADDRESS);
    expect(calls).toBe(0);
    mockSession.emit('packet', packet);
    expect(calls).toBe(2);
  });

  it(`removes packet listeners when a button has no more listeners`, () => {
    let mockSession = createMockPcapSession(NETWORK_INTERFACE);
    pcap.createSession.mockReturnValue(mockSession);

    let button = new DashButton(MAC_ADDRESS);
    let subscription1 = button.addListener(() => {});
    let subscription2 = button.addListener(() => {});
    expect(mockSession.listenerCount('packet')).toBe(1);

    subscription1.remove();
    expect(mockSession.listenerCount('packet')).toBe(1);
    subscription2.remove();
    expect(mockSession.listenerCount('packet')).toBe(0);
  });

  it(`doesn't throw if you remove a subscription twice`, () => {
    let mockSession = createMockPcapSession(NETWORK_INTERFACE);
    pcap.createSession.mockReturnValue(mockSession);

    let button = new DashButton(MAC_ADDRESS);
    let subscription = button.addListener(() => {});

    subscription.remove();
    expect(mockSession.listenerCount('packet')).toBe(0);
    expect(subscription.remove.bind(subscription)).not.toThrow();
  });

  it(`closes the pcap session when no more buttons are listening`, () => {
    let mockSession = createMockPcapSession(NETWORK_INTERFACE);
    pcap.createSession.mockReturnValue(mockSession);

    let button1Listener = jest.genMockFunction();
    let button2Listener = jest.genMockFunction();

    let button1 = new DashButton(MAC_ADDRESS);
    let subscription1 = button1.addListener(button1Listener);
    let button2 = new DashButton('66:77:88:99:aa:bb');
    let subscription2 = button2.addListener(button2Listener);

    subscription1.remove();
    expect(mockSession.close.mock.calls.length).toBe(0);
    subscription2.remove();
    expect(mockSession.close.mock.calls.length).toBe(1);
  });
});

function createMockPcapSession(networkInterface) {
  let session = new _events2.default.EventEmitter();
  session.close = jest.genMockFunction();
  session.device_name = networkInterface;
  return session;
}

function createMockArpProbe(sourceMacAddress) {
  let decimals = sourceMacAddress.split(':').map(hex => parseInt(hex, 16));
  (0, _assert2.default)(decimals.length === 6, 'MAC addresses must be six bytes');

  return {
    link_type: 'LINKTYPE_ETHERNET',
    header: new Buffer([249, 133, 27, 86, // Seconds
    137, 239, 1, 0, // Microseconds
    42, 0, 0, 0, // Captured length
    42, 0, 0, 0]),
    buf: new Buffer([255, 255, 255, 255, 255, 255, // Destination MAC address
    ...decimals, // Source MAC address
    8, 6, // EtherType (0x0806 = ARP)
    0, 1, // HTYPE
    8, 0, // PTYPE
    6, // HLEN
    4, // PLEN
    0, 1, // Operation
    ...decimals, // SHA
    0, 0, 0, 0, // SPA
    0, 0, 0, 0, 0, 0, // THA
    10, 0, 10, 20])
  };
}