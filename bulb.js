'use strict';

let ledCharacteristic = [];
let turnedOn = false;
let colorWheel = null;
let oldColor = null;
let mouseIsDown = false;
let mic_enabled = false;

colorWheel = iro.ColorWheel("#color-wheel", {
    width: 320,
    height: 320,
    padding: 4,
    sliderMargin: 24,
    markerRadius: 8,
    color: 'rgb(255, 255, 255)',
    css: {
	".on-off": {
	    "background-color": "$color"
	},
	".on-off:hover": {
	    "background-color": "$color"
	}
    }
});

document.querySelector('.wheel').addEventListener('mousedown', function (e) {
    handleMouseDown(e);
}, false);
document.querySelector('.wheel').addEventListener('mousemove', function (e) {
    handleMouseMove(e);
}, false);
document.querySelector('.wheel').addEventListener('mouseup', function (e) {
    handleMouseUp(e);
}, false);

function handleMouseDown(e) {

    // mousedown stuff here
    mouseIsDown = true;
}

function handleMouseUp(e) {
    updateColor();

    // mouseup stuff here
    mouseIsDown = false;
}

function handleMouseMove(e) {
    if (!mouseIsDown) {
	return;
    }

    updateColor();
}

function updateColor() {
    if (oldColor != null && oldColor != "" && oldColor != colorWheel.color.rgbString) {

        if (colorWheel.color.rgb.r == colorWheel.color.rgb.g && colorWheel.color.rgb.r == colorWheel.color.rgb.b) {
	    setWhite(colorWheel.color.rgb.r);
        } else {
	    setColor(colorWheel.color.rgb.r, colorWheel.color.rgb.g, colorWheel.color.rgb.b);
        }
    }

    oldColor = colorWheel.color.rgbString;
}

function onConnected() {
    document.querySelector('.connect-button').classList.add('hidden');
    document.querySelector('.connect-another').classList.remove('hidden');
    document.querySelector('.wheel').classList.remove('hidden');
    document.querySelector('.color-buttons').classList.remove('hidden');

    document.querySelector('.mic-button').classList.remove('hidden');
    document.querySelector('.power-button').classList.remove('hidden');
    turnedOn = false;
}

function onDisconnected() {
    document.querySelector('.connect-button').classList.remove('hidden');
    document.querySelector('.connect-another').classList.add('hidden');
    document.querySelector('.wheel').classList.add('hidden');
    document.querySelector('.color-buttons').classList.add('hidden');

    document.querySelector('.mic-button').classList.add('hidden');
    document.querySelector('.power-button').classList.add('hidden');
}

function connect() {
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
	filters: [{
	    services: [0xffe5]
	}]
    })
	.then(device => {
	    console.log('> Found ' + device.name);
	    console.log('Connecting to GATT Server...');
            device.addEventListener('gattserverdisconnected', onDisconnected);
	    return device.gatt.connect();
	})
	.then(server => {
	    console.log('Getting Service 0xffe5 - Light control...');
	    return server.getPrimaryService(0xffe5);
	})
	.then(service => {
	    console.log('Getting Characteristic 0xffe9 - Light control...');
	    return service.getCharacteristic(0xffe9);
	})
	.then(characteristic => {

	    if (!ledCharacteristic.includes(characteristic)) {
		ledCharacteristic.push(characteristic);
		if (ledCharacteristic.length > 1) document.querySelector('#title').innerHTML += " x" + ledCharacteristic.length;
		console.log('All ready! ' + characteristic.service.device.name + " added");
	    }
	    onConnected();
	})
	.catch(error => {
	    console.log('Argh! ' + error);
	});
}

function turnOn() {
    let data = new Uint8Array([0xcc, 0x23, 0x33]);
    return ledCharacteristic.forEach(led => led.writeValue(data)
		                     .catch(err => console.log('Error when turning on! ', err))
		                     .then(() => {
			                 turnedOn = true;
			                 toggleButtons();
		                     }));
}

function turnOff() {
    let data = new Uint8Array([0xcc, 0x24, 0x33]);
    return ledCharacteristic.forEach(led => led.writeValue(data)
		                     .catch(err => console.log('Error when turning off! ', err))
		                     .then(() => {
			                 turnedOn = false;
			                 toggleButtons();
		                     }));
}

function turnOnOff() {
    if (turnedOn) {
	turnOff();
    } else {
	turnOn();
    }
}

function toggleButtons() {
    Array.from(document.querySelectorAll('.color-buttons button')).forEach(function (colorButton) {
	colorButton.disabled = !turnedOn;
    });
    document.querySelector('.mic-button button').disabled = !turnedOn;
    turnedOn ? document.querySelector('.wheel').classList.remove('hidden') : document.querySelector('.wheel').classList.add('hidden');
}

function setWhite(white) {
    return pushData(new Uint8Array([0x56, 0x00, 0x00, 0x00, white, 0x0f, 0xaa]));
}

function setColor(red, green, blue) {
    return pushData(new Uint8Array([0x56, red, green, blue, 0x00, 0xf0, 0xaa]));
}

function setProgram(func, delay) {
    return pushData(new Uint8Array([0xbb, func, delay, 0x44]));
}

function pushData(data) {
    var promises = [];

    ledCharacteristic.forEach(
        (led) => promises.push(
            new Promise(function(resolve, reject) {
                led.writeValue(data);
                resolve(led);
            })
        )
    );

    return Promise.all(promises).catch(err => console.log('Error when writing value! ', err));
}

function red() {
    document.querySelector('.on-off').style.backgroundColor = 'red';
    colorWheel.color.rgb = {'r': 255, 'g': 0, 'b': 0};
    return setColor(255, 0, 0)
	.then(() => console.log('Color set to Red'));
}

function green() {
    document.querySelector('.on-off').style.backgroundColor = 'green';
    colorWheel.color.rgb = {'r': 0, 'g': 255, 'b': 0};
    return setColor(0, 255, 0)
	.then(() => console.log('Color set to Green'));
}

function blue() {
    document.querySelector('.on-off').style.backgroundColor = 'blue';
    colorWheel.color.rgb = {'r': 0, 'g': 0, 'b': 255};
    return setColor(0, 0, 255)
	.then(() => console.log('Color set to Blue'));
}

function white() {
    document.querySelector('.on-off').style.backgroundColor = 'white';
    colorWheel.color.rgb = {'r': 255, 'g': 255, 'b': 255};
    return setWhite(255)
	.then(() => console.log('Color set to white'));

}

function rainbow() {
    document.querySelector('.on-off').style.backgroundColor = 'white';
    colorWheel.color.rgb = {'r': 255, 'g': 255, 'b': 255};
    return setProgram(0x25, 0x05)
        .then(() => console.log('Color set to raindow'));
}

function blink_red() {
    document.querySelector('.on-off').style.backgroundColor = 'white';
    colorWheel.color.rgb = {'r': 255, 'g': 255, 'b': 255};
    return setProgram(0x26, 0x05)
        .then(() => console.log('Color set to blink red'));
}

function toggle_listen() {
    if (mic_enabled) {
        document.querySelector('.mic-button button').style.color = 'black';
        annyang.abort()
    } else {
        document.querySelector('.mic-button button').style.color = 'red';
        annyang.start({
	    continuous: true
        });
    }
    mic_enabled = !mic_enabled;
}

// annyang.setLanguage('fr-fr')

// Voice commands
annyang.addCommands({
    'white': white,
    'red': red,
    'green': green,
    'blue': blue,
    'rainbow': rainbow,
    'turn on': turnOn,
    'turn off': turnOff
    // 'mettre une lumière :color': putColor(),
    // 'rouge': red,
    // 'vert': green,
    // 'bleu': blue,
    // 'blanc': white,
    // 'arc-en-ciel': rainbow,
    // 'allumer': turnOn,
    // 'éteindre': turnOff
});

annyang.addCallback('result', function(userSaid) {
  console.log(userSaid); // sample output: 'hello'
});

// Install service worker - for offline support
// if ('serviceWorker' in navigator) {
// 	navigator.serviceWorker.register('serviceworker.js');
// }
