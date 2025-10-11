// ===== CONFIGURACIÓN GENERAL =====
document.addEventListener('DOMContentLoaded', async () => {
    let audioContextStarted = false;
    
    document.body.addEventListener('click', async () => {
        if (!audioContextStarted) {
            await Tone.start();
            audioContextStarted = true;
            console.log('Audio iniciado');
        }
    });

    // ===== REPRODUCCIÓN DE MUESTRAS =====
    const samples = {};
    const sampleKeys = ['1', '2', '3', '4'];
    
    // Ruta local para cargar muestras automáticamente
    const localSamplesPath = './samples/';
    const sampleFiles = ['bass__8_.wav', 'clap__7_.wav', 'cymbal__3_.wav', 'hi_hat__17_.wav'];
    
    // Cargar muestras locales automáticamente
    sampleKeys.forEach((key, index) => {
        const sampleUrl = localSamplesPath + sampleFiles[index];
        samples[key] = new Tone.Player(sampleUrl, () => {
            console.log(`Muestra ${key} cargada: ${sampleFiles[index]}`);
        }).toDestination();
        
        samples[key].onerror = () => {
            console.log(`Error cargando muestra ${key}: ${sampleFiles[index]}`);
        };
    });

    // ===== SÍNTESIS DE AUDIO =====
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -8;
    
    const scaleNotes = {
        'Q': 'C4', 'W': 'D4', 'E': 'E4', 'R': 'F4', 
        'T': 'G4', 'Y': 'A4', 'U': 'B4'
    };

    // ===== ANÁLISIS Y VISUALIZACIÓN =====
    const waveform = new Tone.Waveform(512);
    Tone.Destination.connect(waveform);
    
    const canvas = document.getElementById('waveform');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function drawWaveform() {
        requestAnimationFrame(drawWaveform);
        
        const width = canvas.width;
        const height = canvas.height;
        const values = waveform.getValue();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f0';
        
        for (let i = 0; i < values.length; i++) {
            const x = i * width / values.length;
            const y = (1 + values[i]) * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    drawWaveform();

    // ===== CONTROL POR TECLADO =====
    document.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();
        
        // Reproducir muestras (1-4)
        if (sampleKeys.includes(key) && samples[key]) {
            samples[key].start();
            console.log(`Muestra ${key}`);
        }
        
        // Reproducir notas del sintetizador (Q-U)
        if (scaleNotes[key]) {
            synth.triggerAttackRelease(scaleNotes[key], '8n');
            console.log(`Nota: ${scaleNotes[key]}`);
        }
    });

    // ===== CONTROL MIDI =====
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
    
    function onMIDISuccess(midi) {
        console.log('MIDI conectado');
        const inputs = midi.inputs.values();
        
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.addEventListener('midimessage', onMIDIMessage);
        }
    }
    
    function onMIDIFailure() {
        console.log('MIDI no disponible');
    }
    
    function onMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        console.log('MIDI Note:', note);
        
        // Note On
        if (command === 144 && velocity > 0) {
            // Muestras: notas 36-39
            if (note >= 36 && note <= 39) {
                const sampleKey = (note - 35).toString();
                if (samples[sampleKey]) {
                    samples[sampleKey].start();
                    console.log(`MIDI Muestra ${sampleKey}`);
                }
            }
            // Sintetizador: notas de la escala de Do Mayor (C4 a B4)
            else if (note >= 60 && note <= 71) {
                // Mapeo correcto de notas MIDI a escala de Do Mayor
                const midiToScale = {
                    60: 'C4',  // Do
                    62: 'D4',  // Re
                    64: 'E4',  // Mi
                    65: 'F4',  // Fa
                    67: 'G4',  // Sol
                    69: 'A4',  // La
                    71: 'B4'   // Si
                };
                
                const noteName = midiToScale[note];
                if (noteName) {
                    synth.triggerAttack(noteName);
                    console.log(`MIDI Nota: ${noteName} (${note})`);
                }
            }
        }
        // Note Off
        else if (command === 128 || (command === 144 && velocity === 0)) {
            if (note >= 60 && note <= 71) {
                const midiToScale = {
                    60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 
                    67: 'G4', 69: 'A4', 71: 'B4'
                };
                
                const noteName = midiToScale[note];
                if (noteName) {
                    synth.triggerRelease(noteName);
                }
            }
        }
    }
});