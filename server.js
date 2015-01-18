var NRF24 = require("nrf/index.js"),
    spiDev = "/dev/spidev0.0",
    cePin = 24, irqPin = 25,            //var ce = require("./gpio").connect(cePin)
    pipes = [Buffer("F0F0F0F0E1","hex"), Buffer("F0F0F0F0D2", "hex")];

var nrf = NRF24.connect(spiDev, cePin, irqPin);

nrf.channel(0x4C);
nrf.transmitPower('PA_MAX');
nrf.dataRate('1Mbps');
nrf.crcBytes(2);
nrf.autoRetransmit({count:15, delay:500});

nrf.begin(function () {
    var rx = nrf.openPipe('rx', pipes[0]),
        tx = nrf.openPipe('tx', pipes[1]);

    nrf.printDetails();
    rx.on('data', function (d) {
        console.log(d);
        tx.write(d);
    });
    tx.on('error', function (e) {
        console.warn("Error sending reply.", e);
    });
});