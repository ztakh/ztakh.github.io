const sizeList = {
    "S": "小",
    "M": "中",
    "L": "大"
};
const sizeArr = Object.keys(sizeList);

let selectedSize = "M";

const savedSettings = localStorage.getItem('mapSize');
if (savedSettings) {
    const { size } = JSON.parse(savedSettings);
    selectedSize = size;
}

applySize(selectedSize);

document.addEventListener('click', function (e) {
    if (e.target.closest('#mapSelect-btn')) {
        switchSize(e);
    }
});

function switchSize() {
    const arrId = sizeArr.indexOf(selectedSize);
    let nextId = arrId + 1;

    if (nextId >= sizeArr.length) nextId = 0;

    selectedSize = sizeArr[nextId];

    applySize(selectedSize);
    localStorage.setItem('mapSize', JSON.stringify({ size: selectedSize }));
};

function applySize(size) {
    document.getElementById('mapSelect-label').textContent = sizeList[size];
    document.body.setAttribute('data-mapSize', size);
}

document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<link href='/js/mapSize/stylesheet.css' rel='stylesheet'></link>");