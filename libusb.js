// copyright...

// This class handles libusb requests from the nacl module, forwards them to the
// USB JavaScript API, and sends the results back to the nacl module.

var usb = chrome.usb;

function UsbHandler(naclModule) {
  this.module = naclModule;
  this.handlers = {
    'FIND_DEVICES': this.FindDevices
  };
}
UsbHandler.prototype.HandleMessage = function(msg) {
  var parts = msg.split(':');
  if (parts.length < 3) {
    console.log('Invalid message: ' + msg);
    return false;
  }
  if (parts[1] != "USB") {
    consoel.log('Not a USB message: ' + msg);
    return false;
  }
  if (!this.handlers[parts[2]]) {
    console.log('No handler for message: ' + msg);
    return false;
  }
  this.handlers[parts[2]].call(this, msg);
  return true;
};

// Individual libusb function handlers:

UsbHandler.prototype.FindDevices = function(msg) {
  // TODO(adlr): Don't hardcode this device.
  var POWERMATE_VENDOR_ID = 1193;//0x077d;
  var POWERMATE_PRODUCT_ID = 8717; //0x0410;
  var DEVICE_INFO = {
    "vendorId": POWERMATE_VENDOR_ID,
    "productId": POWERMATE_PRODUCT_ID
  };

  var self = this;
  usb.findDevices(DEVICE_INFO, function(devices) {
    var reply = '';
    if (!devices || !devices.length) {
      console.log('Device not found');
    } else {
      reply = '0';  // got 1 device
    }
    self.module.postMessage(msg + ':' + reply);
  });
}
