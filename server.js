var ITNode = require("IT_NODE").ITNode,
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
nrf.dataRate('2Mbps');
nrf.crcBytes(2);
nrf.autoRetransmit({count:15, delay:500});

nrf.printDetails();

nrf.begin(function () {
  var rx = nrf.openPipe('rx', pipes[1], {autoAck:false});
  rx.on('data', function (d) {
    console.log(d);
  });

  var itNode = new ITNode();
  itNode.init("dbBridge").
  then(function(){
  return itNode.addService({
      name : "sendData",
      handler : function(args, itSocket){
        if(!args)
          return 'ENOARGS';
        if(!args.ip)
          return 'ENOIP';
        if(!args.data)
          return 'ENODATA';

        console.log("request sending data to ip: "+args.ip);

        var tx = hashTX[args.ip];
        if(!tx){
          tx = nrf.openPipe('tx', Buffer(args.ip, "hex"), {autoAck:false});

          tx.on('error', function (e) {
            console.warn("Error sending reply.", e);
          });
          tx.on('ready', function(e){
            hashTX[args.ip] = tx;
            tx.write(args.data);
            return "SDATAWROTE";
          });

        }else{
          tx.write(args.data);
          return "SDATAWROTE";
        }
      }
    });
  });
});
