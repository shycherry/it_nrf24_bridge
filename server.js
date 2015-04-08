var ITNODE = require("IT_NODE"),
  NRF24 = require("nrf/index.js"),
  spiDev = "/dev/spidev0.0",
  cePin = 24, irqPin = 25,
  hashTX = {},
  pipes = [Buffer("F0F0F0F0E1","hex"), Buffer("F0F0F0F0D2", "hex")];

var _nullCb = function(){};

var nrf = NRF24.connect(spiDev, cePin, irqPin);
//nrf._debug=true;
nrf.channel(0x4C);
nrf.transmitPower('PA_MAX');
nrf.dataRate('1Mbps');
nrf.crcBytes(2);
nrf.autoRetransmit({count:15, delay:500});

nrf.printDetails();

nrf.begin(function () {
  var rx = nrf.openPipe('rx', pipes[1], {autoAck:false});
  rx.on('data', function (d) {
    console.log(d);
  });

  ITNODE.addService({
    name : "sendData",
    handler : function(args, cb){
      cb = cb | _nullCb;
      if(!args)
        return cb('ENOARGS');
      if(!args.ip)
        return cb('ENOIP');
      if(!args.data)
        return cb('ENODATA');

      console.log("request sending data: "+args.data+" to ip: "+args.ip);

      var tx = hashTX[args.ip];
      if(!tx){
        tx = nrf.openPipe('tx', Buffer(args.ip, "hex"), {autoAck:false});

        tx.on('error', function (e) {
          console.warn("Error sending reply.", e);
        });
        tx.on('ready', function(e){
          hashTX[args.ip] = tx;
          tx.write(args.data);
          return cb(null, "SDATAWROTE");
        });

      }else{
        tx.write(args.data);
        return cb(null, "SDATAWROTE");
      }
    }
  });
});
