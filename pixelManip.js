let picturesArr = [
  'Assets/Images/Maine5.jpg',
  'Assets/Images/Nasa1.jpg',
  'Assets/Images/Carmel1.jpg',
  'Assets/Images/Tahoe1.jpg',
  'Assets/Images/Apollo11.jpg',
  'Assets/Images/Profile_Pic.png',
  'Assets/Images/Poppy.jpg',
  'Assets/Images/Saturn.jpg',
  'Assets/Images/Maine3.jpg',
  'Assets/Images/screenshot.jpg',
  'Assets/Images/Dolomite1.jpg',
  'Assets/Images/download.jpeg',
  'Assets/Images/Maine1.jpg',
  'Assets/Images/NC1.jpg',
  'Assets/Images/Maine2.jpg',
  'Assets/Images/Utah1.jpg'
];
let pictureIndex = 0;
const picNavForward = document.getElementById('forward');
const picNavBackward = document.getElementById('back');
const clear = document.getElementById('clear');
const sub = document.getElementById('submit');
const form = document.getElementById("channels");
const quantize = document.getElementById('quantize');
const mainDriverButtons = document.getElementById('mainDriverbuttons');
const c = document.getElementById('canvas');
const ctx = c.getContext('2d');
const paletteCanvas = document.getElementById('pal');
const ctxPal = paletteCanvas.getContext('2d');
const textOut = document.getElementById('textOut');
let outPal;
const palDataButton = document.getElementById('palDataExpand');
textOut.style.color = 'red';
let img = new Image();
let pictureBool = 0;

img.onload = init; img.crossOrigin = "";
img.src = `${picturesArr[pictureIndex]}`;


function init() {
    setup(this);
}

function setup(img) {
    
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);;
    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
    quantize.style.display = "none";
    textOut.innerHTML = "";
}

//image nave
picNavForward.addEventListener("click", function(event) {
    event.preventDefault();

    if(pictureIndex === picturesArr.length-1) {
	pictureIndex = -1;
	
    }
    pictureIndex++;
    img.src = `${picturesArr[pictureIndex]}`;
    setup(img);

    
});

picNavBackward.addEventListener("click", function(event) {
    event.preventDefault();
    if(pictureIndex === 0) {
	pictureIndex = picturesArr.length;
	
    }
    pictureIndex--;
    img.src = `${picturesArr[pictureIndex]}`;
    setup(img);

    
});

clear.addEventListener("click", function(event) {
    event.preventDefault();
    img.src = `${picturesArr[pictureIndex]}`;
    setup(img);

    
});

palDataButton.addEventListener("click", function(event) {
    
    event.preventDefault();
    textOut.innerHTML = JSON.stringify(outPal);
    
    

    
});

//handle submit keypress
form.onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
	e.preventDefault();
	setup(img);
	let channels  = form.value;
	if(powerOfTwo(channels)) {
	    textOut.innerHTML = "";
	    outPal = medianCutPalette(channels);
	    quantize.style.display = "block";
	    textOut.style.color = 'blue';
	    
	    
	} else {
	    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
	    textOut.innerHTML = "Must be power of 2";
	}
	return false;
    };
};



//handle clicks
sub.addEventListener("click", function(event) {
    event.preventDefault();
    setup(img);
    let  channels = form.value;
    if(powerOfTwo(channels)) {
	textOut.innerHTML = "";
	outPal = medianCutPalette(channels);
	quantize.style.display = "block";
	    textOut.style.color = 'blue';
	    
	} else {
	    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
	    textOut.innerHTML = "Must be power of 2";
	}
	
    });

quantize.addEventListener("click", function(event) {
    event.preventDefault();
    let idataSrc = ctx.getImageData(0,0, c.width, c.height),
	idataTrg = ctx.createImageData(c.width, c.height);
    
    compressColors(outPal, idataSrc, idataTrg);
    
});


// main driver
function medianCutPalette (num) {

    // set up initial image source and target container
    let idataSrc = ctx.getImageData(0,0, c.width, c.height),
	idataTrg = ctx.createImageData(c.width, c.height);
    
    let pal = getPal(idataSrc, num);
    createPal(paletteCanvas, pal, ctxPal);
    
    return pal;
};


//get the palette values
function getPal(src, num) {
    
    let dataSrc = src.data,
	len = dataSrc.length;
    let pixelSet = [];

    for (let i = 0;i < len; i += 4) {
	let groupedPixelData = [dataSrc[i], dataSrc[i+1], dataSrc[i+2]];
	pixelSet.push(groupedPixelData);
    }

    // super inefficient way of getting rid of unique colors?
    let uniqueColorSet = [...new Set(pixelSet.map(color => color.toString()))];
    let uniqueColorsArr = uniqueColorSet.map(color => color.split(','));
    //get the initial max range color for the whole "bucket"
    let maxRangeInitial = getMaxRangeColorIndex(uniqueColorsArr);
    uniqueColorsArr.sort(function(a, b) {return +a[maxRangeInitial] - +b[maxRangeInitial];});
    
    let bucketsArr = [];
    // use cut to seperate into buckets and get max range color for each bucket, sort by that
    cut(uniqueColorsArr, bucketsArr, uniqueColorsArr, num);
    // get the color averages for each bucket
    let palette = getColorAverages(bucketsArr);
    
    return palette;
}

//palette display setup
function createPal (palletteCanvas, palette, ctxPal) {
    //arrange by sums
    palette.sort(function(a,b) {return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
    let xPlace = 0;
    let yPlace = 0;
    let row = Math.ceil(Math.sqrt(palette.length));
    palletteCanvas.height = (palette.length/row * 30) + 30;
    palletteCanvas.width  = (palette.length/row * 30) + 30;

    for(let i = 0; i < palette.length; i++) {
	if(i%row === 0 && i != 0) {
	    yPlace += 30;
	    xPlace = 0;
	}
	ctxPal.fillStyle = `rgb(${palette[i][0]}, ${palette[i][1]}, ${palette[i][2]})`;
	ctxPal.fillRect(xPlace, yPlace, 30, 30 );
	xPlace += 30;
    }
    
}




function compressColors (pal,src, trg) {
     let dataSrc = src.data;
    let dataTrg = trg.data;
    let len = dataSrc.length;
    for (let i = 0; i < len; i += 4) {
	let shortest = 255;
	let shortestIndex;
	for(let j = 0; j < pal.length; j++) {
	    let dist = getDistance(pal[j], [dataSrc[i], dataSrc[i+1], dataSrc[i+2]]);
	    if (dist < shortest) {
		shortest = dist;
		shortestIndex = j;
	    }
	}
	dataTrg[i] = pal[shortestIndex][0];
	dataTrg[i+1] = pal[shortestIndex][1];
	dataTrg[i+2] = pal[shortestIndex][2];
	dataTrg[i+3] = 255;
	
    }

    ctx.putImageData(trg, 0, 0);
    return trg;
}


function getDistance(a, b) {
    let dist = Math.sqrt(Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) + Math.pow(a[2]-b[2], 2));
    return dist;
}


function getColorAverages (bucketsArr) {
    let palette = [];
    bucketsArr.forEach(bucket => {
	let red = 0, green = 0, blue = 0;
	
	bucket.forEach(color => {
	    red += +color[0];
	    green += +color[1];
	    blue += +color[2];
	});
	let avgR = Math.floor(red/bucket.length);
	let avgG = Math.floor(green/bucket.length);
	let avgB = Math.floor(blue/bucket.length);

	let avg = [avgR, avgG, avgB];
	palette.push(avg);
    });
    return palette;
}

// make color buckets
function cut (arr, bucketsArr, master, buckets) {
    if(buckets === 1) {
	bucketsArr.push(arr);
	return;
    } else {
	buckets /= 2;
	// get max range for each bucket and sort by that
	let maxRange = getMaxRangeColorIndex(arr);
	arr.sort(function(a, b) {return +a[maxRange] - +b[maxRange];});
	let middle = Math.floor(arr.length/2);
	let firstHalf = arr.slice(0, middle-1);
	let secondHalf = arr.slice(middle);
	cut(firstHalf, bucketsArr, master, buckets);
	cut(secondHalf, bucketsArr, master, buckets);
    }
}
// takes processed color groups instead of canvas data array
function getMaxRangeColorIndex (src) {
    
    let len = src.length;
    let rMin = 255;
    let rMax = 0;
    let gMin = 255;
    let gMax = 0;
    let bMin = 255;
    let bMax = 0;
    for (let i = 0; i < len; i ++) {
	let red = +src[i][0];
	let green = +src[i][1];
	let blue = +src[i][2];

	if(red < rMin) {
	    rMin = red;
	}
	if(red > rMax) {
	    rMax = red;
	}
	if(green < gMin) {
	    gMin = green;
	}
	if(green > gMax) {
	    gMax = green;
	}
	if(blue < bMin) {
	    bMin = blue;
	}
	if(blue > bMax) {
	    bMax = blue;
	}
    }
    let rRange = rMax - rMin;
    let gRange = gMax - gMin;
    let bRange = bMax - bMin;

    let set = [[rRange, 0], [gRange, 1], [bRange, 2]];
    set.sort(function(a, b){return a[0] - b[0];});
    return set[set.length-1][1];
}

function powerOfTwo(x) {
    return (Math.log(x)/Math.log(2)) % 1 === 0;
}









