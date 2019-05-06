const sub = document.getElementById("submit");
const form = document.getElementById("channels");
const c = document.getElementById("canvas");
const ctx = c.getContext('2d');
const paletteCanvas = document.getElementById('pal');
const ctxPal = paletteCanvas.getContext('2d');
const textOut = document.getElementById('textOut');
const changePic = document.getElementById('changePic');
let outPal;
textOut.style.color = 'red';
let img = new Image();
let pictureBool = 0;
let imgOne = './Poppy.jpg';
let imgTwo = './Saturn.jpg';
img.onload = init; img.crossOrigin = "";
img.src = imgOne;

function init() {
    setup(this);
}

function setup(img) {
    
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);;
}

//handle submit keypress
form.onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
	e.preventDefault();
	setup(img);
	let channels  = form.value;
	if(powerOfTwo(channels)) {
	    
	    outPal = medianCutPalette(channels);
	    textOut.style.color = 'blue';
	    textOut.innerHTML = JSON.stringify(outPal);
	    
	} else {
	    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
	    textOut.innerHTML = "Must be power of 2";
	}
	return false;
    };
};


changePic.addEventListener("click", function(event) {
    event.preventDefault();
    console.log(img.src);
    if(!pictureBool) {
console.log("fired");
	img.src = imgTwo;
	pictureBool = 1;
	ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
    } else {
	img.src = imgOne;
	pictureBool = 0;
	ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
    }
    setup(img);
    
    
});


//handle clicks
sub.addEventListener("click", function(event) {
    event.preventDefault();
    setup(img);
    let  channels = form.value;
    if(powerOfTwo(channels)) {
	
	outPal = medianCutPalette(channels);
	textOut.style.color = 'blue';
	textOut.innerHTML = JSON.stringify(outPal);
    } else {
	ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
	textOut.innerHTML = "Must be power of 2";
    }
    
});


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
    console.log(trg);
    ctx.putImageData(trg, 0, 0);
    return trg;
}


function getDistance(a, b) {
    let dist = Math.sqrt(Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) + Math.pow(a[2]-b[2], 2));
    return dist;
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


// main driver
function medianCutPalette (num) {

    // set up initial image source and target container
    let idataSrc = ctx.getImageData(0,0, c.width, c.height),
	idataTrg = ctx.createImageData(c.width, c.height);
    let maxRange = getMaxRange(idataSrc);
    
    let pal = getPal(idataSrc, maxRange, num);
    createPal(paletteCanvas, pal, ctxPal);
    compressColors(pal, idataSrc, idataTrg);
    return pal;
};

//get the palette values
function getPal(src, max, num) {
    
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
    uniqueColorsArr.sort(function(a, b) {return +a[max] - +b[max];});
    
    let bucketsArr = [];

    cut(uniqueColorsArr, bucketsArr, uniqueColorsArr, num);
    let palette = getColorAverages(bucketsArr);
    
    return palette;
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
function cut (arr, bucketsArr, master, buckets){
    if(buckets === 1) {
	bucketsArr.push(arr);
	return;
    } else {
	buckets /= 2;
	let middle = Math.floor(arr.length/2);
	let firstHalf = arr.slice(0, middle-1);
	let secondHalf = arr.slice(middle);
	cut(firstHalf, bucketsArr, master, buckets);
	cut(secondHalf, bucketsArr, master, buckets);
    }
}


// find the color with the largest range

function getMaxRange (src) {
    let dataSrc = src.data;
    let len = dataSrc.length;
    let rMin = 255;
    let rMax = 0;
    let gMin = 255;
    let gMax = 0;
    let bMin = 255;
    let bMax = 0;
    for (let i = 0; i < len; i += 4) {
	if(dataSrc[0] < rMin) {
	    rMin = dataSrc[0];
	}
	if(dataSrc[0] > rMax) {
	    rMax = dataSrc[0];
	}
	if(dataSrc[1] < gMin) {
	    gMin = dataSrc[1];
	}
	if(dataSrc[1] > gMax) {
	    gMax = dataSrc[1];
	}
	if(dataSrc[2] < bMin) {
	    bMin = dataSrc[2];
	}
	if(dataSrc[2] > bMax) {
	    bMax = dataSrc[2];
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









