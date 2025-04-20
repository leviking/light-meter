// camera.js
(() => {
  const fileInput       = document.getElementById('photoInput');
  const previewContainer= document.getElementById('previewContainer');
  const previewImage    = document.getElementById('previewImage');
  const ev100El         = document.getElementById('ev100');
  const controls        = document.getElementById('controls');
  const apertureSelect  = document.getElementById('apertureSelect');
  const shutterSelect   = document.getElementById('shutterSelect');

  // Standard stops
  const apertureOptions = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32, 45, 64];
  const shutterOptions  = [
    { label: '1/2000', value: 1/2000 },
    { label: '1/1000', value: 1/1000 },
    { label: '1/500',  value: 1/500  },
    { label: '1/250',  value: 1/250  },
    { label: '1/125',  value: 1/125  },
    { label: '1/60',   value: 1/60   },
    { label: '1/30',   value: 1/30   },
    { label: '1/15',   value: 1/15   },
    { label: '1/8',    value: 1/8    },
    { label: '1/4',    value: 1/4    },
    { label: '1/2',    value: 1/2    },
    { label: '1',      value: 1      },
  ];

  // Fill dropdowns
  apertureOptions.forEach(N => {
    const o = document.createElement('option');
    o.value = N;
    o.textContent = N;
    apertureSelect.append(o);
  });
  shutterOptions.forEach(({label, value}) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    shutterSelect.append(o);
  });

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

  // When a photo is selected
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    previewImage.src = url;
    previewContainer.style.display = '';

    // Read EXIF
    EXIF.getData(file, function () {
      const isoRaw   = EXIF.getTag(this, 'ISOSpeedRatings');
      const fRaw     = EXIF.getTag(this, 'FNumber');
      const expRaw   = EXIF.getTag(this, 'ExposureTime');

      const aperture = rationalToNumber(fRaw);
      const shutter  = rationalToNumber(expRaw);

      // Calculate EV100
      const ev100 = computeEV100(aperture, shutter);
      ev100El.textContent = fmt(ev100);

      // Show controls
      controls.style.display = '';

      // Initialize selects to nearest values
      const nearestA = findNearest(apertureOptions, aperture);
      const nearestS = findNearest(shutterOptions, shutter, o => o.value);

      apertureSelect.value = nearestA;
      shutterSelect.value  = nearestS.value;

      // Wire up interdependent changes
      apertureSelect.onchange = () => {
        const N = parseFloat(apertureSelect.value);
        const tNeeded = (N * N) / Math.pow(2, ev100);
        const best = findNearest(shutterOptions, tNeeded, o => o.value);
        shutterSelect.value = best.value;
      };

      shutterSelect.onchange = () => {
        const t = parseFloat(shutterSelect.value);
        const Nneeded = Math.sqrt(t * Math.pow(2, ev100));
        const best = findNearest(apertureOptions, Nneeded);
        apertureSelect.value = best;
      };
    });
  });
})();

