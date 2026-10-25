const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');
const freqInput = document.getElementById('freqInput');
const ampInput = document.getElementById('ampInput');
const typeSelect = document.getElementById('typeSelect');
const freqVal = document.getElementById('freqVal');
const ampVal = document.getElementById('ampVal');
const pauseBtn = document.getElementById('pauseBtn');

let phase = 0;
let paused = false;

pauseBtn.addEventListener('click', () => {
	paused = !paused;
	pauseBtn.textContent = paused ? 'Spustit' : 'Pozastavit';
});

function sampleWave(type, t) {
	const s = Math.sin(t);
	if (type === 'square') return s >= 0 ? 1 : -1;
	if (type === 'triangle') return (2 / Math.PI) * Math.asin(s);
	return s;
}

function draw() {
	const width = canvas.width;
	const height = canvas.height;
	const freq = parseFloat(freqInput.value);
	const amp = parseFloat(ampInput.value) / 100;
	const type = typeSelect.value;

	freqVal.textContent = `${freq.toFixed(1)} Hz`;
	ampVal.textContent = `${Math.round(amp * 100)} %`;

	ctx.clearRect(0, 0, width, height);

	// Grid
	ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(0, height / 2);
	ctx.lineTo(width, height / 2);
	ctx.stroke();

	// Waveform
	ctx.strokeStyle = '#38bdf8';
	ctx.lineWidth = 2.5;
	ctx.beginPath();

	for (let x = 0; x < width; x++) {
		const t = (x / width) * freq * Math.PI * 2 + phase;
		const y = height / 2 - sampleWave(type, t) * (height * 0.42 * amp);
		if (x === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();

	if (!paused) {
		phase += 0.04 * freq;
	}
	requestAnimationFrame(draw);
}

draw();
