// camera.js - Redesigned version
(() => {
  // DOM Elements
  const fileInput = document.getElementById('photoInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const ev100El = document.getElementById('ev100');
  const controls = document.getElementById('controls');
  const apertureDisplay = document.getElementById('apertureDisplay');
  const shutterDisplay = document.getElementById('shutterDisplay');
  const apertureContainer = document.getElementById('apertureContainer');
  const shutterContainer = document.getElementById('shutterContainer');
  
  // State
  let currentEV = null;
  let currentAperture = null;
  let currentShutter = null;

  // Standard stops
  const apertureOptions = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32, 45, 64];
  const shutterOptions = [
    { label: '2k', value: 1/2000 },
    { label: '1k', value: 1/1000 },
    { label: '500',  value: 1/500  },
    { label: '250',  value: 1/250  },
    { label: '125',  value: 1/125  },
    { label: '60',   value: 1/60   },
    { label: '30',   value: 1/30   },
    { label: '15',   value: 1/15   },
    { label: '8',    value: 1/8    },
    { label: '4',    value: 1/4    },
    { label: '2',    value: 1/2    },
    { label: '1',      value: 1      },
  ];

  // Helpers
  const fmt = n => Number((Math.round(n * 100) / 100).toFixed(2));
  
  const findNearest = (arr, v, key = x => x) =>
    arr.reduce((best, cur) =>
      Math.abs(key(cur) - v) < Math.abs(key(best) - v) ? cur : best
    );

  // Convert EXIF rationals to number
  function rationalToNumber(r) {
    if (typeof r === 'number') return r;
    if (Array.isArray(r) && r.length === 2) return r[0] / r[1];
    if (r && r.numerator && r.denominator)
      return r.numerator / r.denominator;
    return NaN;
  }

  // Compute EV100 = log2(N² / t)
  function computeEV100(N, t) {
    return Math.log2((N * N) / t);
  }
  
  // Create visual sliders for aperture and shutter
  function createSliders() {
    // Clear containers
    apertureContainer.innerHTML = '';
    shutterContainer.innerHTML = '';
    
    // Create aperture slider
    const visibleApertures = getVisibleRange(apertureOptions, currentAperture);
    const apLeftBtn = document.createElement('button');
    apLeftBtn.className = 'slider-btn';
    apLeftBtn.textContent = '<';
    apLeftBtn.addEventListener('click', () => {
      const idx = apertureOptions.indexOf(currentAperture);
      if (idx > 0) updateAperture(apertureOptions[idx - 1]);
    });
    
    const apRightBtn = document.createElement('button');
    apRightBtn.className = 'slider-btn';
    apRightBtn.textContent = '>';
    apRightBtn.addEventListener('click', () => {
      const idx = apertureOptions.indexOf(currentAperture);
      if (idx < apertureOptions.length - 1) updateAperture(apertureOptions[idx + 1]);
    });
    
    const apSlider = document.createElement('div');
    apSlider.className = 'slider-values';
    
    visibleApertures.forEach(ap => {
      const valEl = document.createElement('div');
      valEl.className = `slider-value ${ap === currentAperture ? 'selected' : ''}`;
      valEl.textContent = ap;
      valEl.addEventListener('click', () => updateAperture(ap));
      apSlider.appendChild(valEl);
    });
    
    apertureContainer.appendChild(apLeftBtn);
    apertureContainer.appendChild(apSlider);
    apertureContainer.appendChild(apRightBtn);
    
    // Create shutter slider
    const visibleShutters = getVisibleRange(shutterOptions, currentShutter, o => o.value);
    const shLeftBtn = document.createElement('button');
    shLeftBtn.className = 'slider-btn';
    shLeftBtn.textContent = '<';
    shLeftBtn.addEventListener('click', () => {
      const idx = shutterOptions.findIndex(s => s.value === currentShutter.value);
      if (idx < shutterOptions.length - 1) updateShutter(shutterOptions[idx + 1]);
    });
    
    const shRightBtn = document.createElement('button');
    shRightBtn.className = 'slider-btn';
    shRightBtn.textContent = '>';
    shRightBtn.addEventListener('click', () => {
      const idx = shutterOptions.findIndex(s => s.value === currentShutter.value);
      if (idx > 0) updateShutter(shutterOptions[idx - 1]);
    });
    
    const shSlider = document.createElement('div');
    shSlider.className = 'slider-values';
    
    visibleShutters.forEach(sh => {
      const valEl = document.createElement('div');
      valEl.className = `slider-value ${sh.value === currentShutter.value ? 'selected' : ''}`;
      valEl.textContent = sh.label;
      valEl.addEventListener('click', () => updateShutter(sh));
      shSlider.appendChild(valEl);
    });
    
    shutterContainer.appendChild(shLeftBtn);
    shutterContainer.appendChild(shSlider);
    shutterContainer.appendChild(shRightBtn);
  }
  
  // Get a subset of values for display
  function getVisibleRange(options, selected, key = x => x, count = 5) {
    if (!selected) return options.slice(0, count);
    
    const index = typeof selected === 'object' 
      ? options.findIndex(o => key(o) === key(selected))
      : options.indexOf(selected);
    
    if (index === -1) return options.slice(0, count);
    
    const half = Math.floor(count / 2);
    let start = Math.max(0, index - half);
    const end = Math.min(options.length, start + count);
    
    if (end === options.length) {
      start = Math.max(0, end - count);
    }
    
    return options.slice(start, end);
  }
  
  // Update aperture and recalculate related values
  function updateAperture(aperture) {
    currentAperture = aperture;
    apertureDisplay.textContent = aperture;
    
    // Calculate new shutter speed based on EV
    const tNeeded = (aperture * aperture) / Math.pow(2, currentEV);
    currentShutter = findNearest(shutterOptions, tNeeded, o => o.value);
    shutterDisplay.textContent = currentShutter.label;
    
    // Refresh UI
    createSliders();
  }
  
  // Update shutter and recalculate related values
  function updateShutter(shutter) {
    currentShutter = shutter;
    shutterDisplay.textContent = shutter.label;
    
    // Calculate new aperture based on EV
    const Nneeded = Math.sqrt(shutter.value * Math.pow(2, currentEV));
    currentAperture = findNearest(apertureOptions, Nneeded);
    apertureDisplay.textContent = currentAperture;
    
    // Refresh UI
    createSliders();
  }

  // When a photo is selected
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    previewImage.src = url;
    previewContainer.style.display = 'block';

    // Read EXIF
    EXIF.getData(file, function () {
      const fRaw = EXIF.getTag(this, 'FNumber');
      const expRaw = EXIF.getTag(this, 'ExposureTime');

      const aperture = rationalToNumber(fRaw);
      const shutter = rationalToNumber(expRaw);

      // Calculate EV100
      const ev100 = computeEV100(aperture, shutter);
      currentEV = ev100;
      ev100El.textContent = fmt(ev100);

      // Set initial values
      currentAperture = findNearest(apertureOptions, aperture);
      currentShutter = findNearest(shutterOptions, shutter, o => o.value);
      
      apertureDisplay.textContent = currentAperture;
      shutterDisplay.textContent = currentShutter.label;

      // Show controls
      controls.style.display = 'block';
      
      // Create interactive sliders
      createSliders();
    });
  });
})();
