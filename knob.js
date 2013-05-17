HelloTutorialModule = null;  // Global application object.
statusText = 'NO-STATUS';
var usbHandler = null;

// Indicate load success.
function moduleDidLoad() {
  HelloTutorialModule = document.getElementById('hello_tutorial');
  updateStatus('SUCCESS');
  usbHandler = new UsbHandler(HelloTutorialModule);
  HelloTutorialModule.postMessage('this is a test');
}

// The 'message' event handler.  This handler is fired when the NaCl module
// posts a message to the browser by calling PPB_Messaging.PostMessage()
// (in C) or pp::Instance.PostMessage() (in C++).  This implementation
// simply displays the content of the message in an alert panel.
function handleMessage(message_event) {
  console.log('got message:' + message_event.data);
  if (usbHandler && usbHandler.HandleMessage(message_event.data)) {
    console.log('USB handled message');
    return;
  }
}

// If the page loads before the Native Client module loads, then set the
// status message indicating that the module is still loading.  Otherwise,
// do not change the status message.
function pageDidLoad() {
  console.log('adlr loaded');
  
  var listener = document.getElementById('listener');
  listener.addEventListener('load', moduleDidLoad, true);
  listener.addEventListener('message', handleMessage, true);
  
  setupKnob();
  
  if (HelloTutorialModule == null) {
    updateStatus('LOADING...');
  } else {
    // It's possible that the Native Client module onload event fired
    // before the page's onload event.  In this case, the status message
    // will reflect 'SUCCESS', but won't be displayed.  This call will
    // display the current message.
    updateStatus();
  }
}

window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    pageDidLoad();  
},false);


// Set the global status message.  If the element with id 'statusField'
// exists, then set its HTML to the status message as well.
// opt_message The message test.  If this is null or undefined, then
// attempt to set the element with id 'statusField' to the value of
// |statusText|.
function updateStatus(opt_message) {
  if (opt_message)
    statusText = opt_message;
  var statusField = document.getElementById('status_field');
  if (statusField) {
    statusField.innerHTML = statusText;
  }
}



function setupKnob() {

var POWERMATE_VENDOR_ID = 1193;//0x077d;
var POWERMATE_PRODUCT_ID = 8717; //0x0410;
var DEVICE_INFO = {"vendorId": POWERMATE_VENDOR_ID, "productId": POWERMATE_PRODUCT_ID};

var powerMateDevice;
var usb = chrome.usb;
var knob = document.getElementById('knob');
var requestButton = document.getElementById("requestPermission");

var amount = 0;


var transfer = {
  direction: 'out',
  endpoint: 3,
  data: new Uint8Array([01, 0x69, 00, 01]).buffer
};

var onEvent=function(usbEvent) {
  console.log('onEvent called');
    if (usbEvent.resultCode) {
      console.log("Error: " + usbEvent.error);
      return;
    }

    var buffer = new Int8Array(usbEvent.data);
    console.log("out: " + usbEvent.resultCode);
    console.log(usbEvent.data);
    // amount += buffer[1] * 4;
    // 
    // knob.style.webkitTransform = 'rotate(' + amount + 'deg)';

    //usb.interruptTransfer( powerMateDevice, transfer, onEvent );
    console.log("reading result");
    var inTransfer = {
      direction: 'in',
      endpoint: 2,
      length: 1
    };
    usb.bulkTransfer(powerMateDevice, inTransfer, function(info) {
      console.log('read return code: ' + info.resultCode);
      console.log(info);
      console.log("read back " + info.data.byteLength + ' bytes');
      if (info.data.byteLength >= 1) {
        console.log("byte value: " + (new Uint8Array(info.data))[0]);
      }
    });
    
    
  };

var gotPermission = function(result) {
    requestButton.style.display = 'none';
    knob.style.display = 'block';
    console.log('App was granted the "usbDevices" permission.');
    usb.findDevices( DEVICE_INFO, 
      function(devices) {
        if (!devices || !devices.length) {
          console.log('device not found');
          return;
        }
        console.log(devices[0]);
        console.log('Found device: ' + devices[0].handle);
        powerMateDevice = devices[0];
        usb.claimInterface(powerMateDevice, 0, function() {
          console.log("claimed!");
          usb.bulkTransfer(powerMateDevice, transfer, onEvent);
        });
    });
  };

var permissionObj = {permissions: [{'usbDevices': [DEVICE_INFO] }]};

requestButton.addEventListener('click', function() {
  chrome.permissions.request( permissionObj, function(result) {
    if (result) {
      gotPermission();
    } else {
      console.log('App was not granted the "usbDevices" permission.');
      console.log(chrome.runtime.lastError);
    }
  });
});

chrome.permissions.contains( permissionObj, function(result) {
        console.log('got a result');
  if (result) {
    gotPermission();
  }
});
}