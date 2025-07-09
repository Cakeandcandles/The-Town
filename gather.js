let token = localStorage.getItem("token");
let wood = Number(localStorage.getItem("wood"));
if (isNaN(wood)) {
    wood = 0;
    localStorage.setItem('wood', wood);
}
let brick = Number(localStorage.getItem("brick"));
if (isNaN(brick)) {
    brick = 0;
    localStorage.setItem('brick', brick); // REMEBER T0 UPDATE THE LOCAL STORAGE EVERY TIME SOMETHING IS COLLECTED OR ADDED
}
let huts = Number(localStorage.getItem('huts'));
if (isNaN(huts)) {
    huts = 2;
    localStorage.setItem('huts', huts);
}
let shelters = Number(localStorage.getItem('shelters'));
if (isNaN(shelters)) {
    shelters = 0;
    localStorage.setItem('shelters', shelters);
}
let farmingSpeed = 1; // This also represents the amount of people that are present- can never be 0
if (isNaN(farmingSpeed)) {
    farmingSpeed = 0;
    localStorage.setItem('farmingSpeed', farmingSpeed);
}

if (isNaN(token)) { // This page is is token 1
    window.location.href = 'main.html';
} else if (token == '2') {
    window.location.href = 'something_else.html';
}


const brickButton = document.getElementById('action');
const woodButton = document.getElementById('wood-btn');
const metalButton = document.getElementById('metal-btn');
const shelterButton = document.getElementById('shelter-btn');
const buttonArea = document.getElementById('button-area');
const resourcesContainer = document.getElementById('resources');
const messagesContainer = document.getElementById('messages');
const testTime = 3000; // was 3000!!!!
let dogs = Math.floor(Math.random() * 2); // Random assignment if dogs will break one of the huts later
let happened = true;


// FUNCTIONS ------------------------------------------------------------------------------>
const gameOver = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('wood');
    localStorage.removeItem('brick');
    localStorage.removeItem('huts');
    localStorage.removeItem('shelters');
    localStorage.removeItem('farmingSpeed');
    // Make sure to update this function as the local storage grows
    window.location.href = 'main.html';
}
const addWoodAndUpdateUI = function(quantity) {
    let woodDiv = document.getElementById('resource-wood');
    if (quantity > 0) {
        wood += (quantity * farmingSpeed);
        messages = [`You gathered ${20 * farmingSpeed} wood`];
        newText();      
    } else {
        wood += quantity;
    }
    localStorage.setItem('wood', wood);
    if (woodDiv) {
        woodDiv.textContent = 'Wood: ' + wood;
    } else {
        woodDiv = document.createElement('div');
        woodDiv.className = 'resource-square';
        woodDiv.id = 'resource-wood';
        woodDiv.textContent = 'Wood: ' + wood;
        resourcesContainer.appendChild(woodDiv);
    }
};


const addBrickAndUpdateUI = function(quantity) {
    let brickDiv = document.getElementById('resource-brick');
    if (quantity > 0) {
        brick += (quantity * farmingSpeed);
        messages = [`You gathered ${quantity * farmingSpeed} brick`];
        newText();
    } else {
        brick += quantity;
    }
    localStorage.setItem('brick', brick);
    if (brickDiv) {
        brickDiv.textContent = 'Brick: ' + brick;
    } else {
        brickDiv = document.createElement('div');
        brickDiv.className = 'resource-square';
        brickDiv.id = 'resource-brick';
        brickDiv.textContent = 'Brick: ' + brick;
        resourcesContainer.appendChild(brickDiv);
    }
};


const addMetalAndUpdateUI = function() {

};


const addShelterAndUpdateUI = function() {
    let shelterDiv = document.getElementById('resource-shelter');
    shelters += 1;
    localStorage.setItem('shelters', shelters);
    if (shelterDiv) {
        shelterDiv.textContent = 'Shelters: ' + shelters;
    } else {
        shelterDiv = document.createElement('div');
        shelterDiv.className = 'resource-square';
        shelterDiv.id = 'resource-shelter';
        shelterDiv.textContent = 'Shelters: ' + shelters;
        resourcesContainer.appendChild(shelterDiv);
    }
    messages = ['You built a shelter'];
    newText();
    if (shelters >= 3 && !happened) {
        messages = [
            'You have 3 shelters now',
            'The Square is looking much better',
            'Four more wanderers arrive'
        ];
        farmingSpeed += 4;
        localStorage.setItem('farmingSpeed', farmingSpeed);
        let shelterMsgInterval = window.setInterval(() => {
            newText();
        }, testTime);
        window.setTimeout(() => {
            clearInterval(shelterMsgInterval);
        }, testTime * messages.length);
        happened = true;
    }
};

let betterIndex = 0;
let betterTextTimeout = null;

function BetterNewText(reset = true) {
    if (reset) {
        betterIndex = 0;
        if (betterTextTimeout) {
            clearTimeout(betterTextTimeout);
        }
    }

    if (betterIndex < messages.length) {
        const p = document.createElement('p');
        p.textContent = messages[betterIndex];
        messagesContainer.insertBefore(p, messagesContainer.firstChild);

        betterIndex++;

        const currentMessages = messagesContainer.querySelectorAll('p');
        if (currentMessages.length > 10) {
            messagesContainer.removeChild(currentMessages[currentMessages.length - 1]);
        }

        betterTextTimeout = setTimeout(() => BetterNewText(false), 3000);
    }
};


let index = 0; // Very important for this function!
function newText() { // Dont use this function anymore 
	const p = document.createElement('p');
	p.textContent = messages[index];
	messagesContainer.insertBefore(p, messagesContainer.firstChild); // insert at the top

    index++;
	if (index >= messages.length) index = 0;

    const currentMessages = messagesContainer.querySelectorAll('p');
    if (currentMessages.length > 10) {
      messagesContainer.removeChild(currentMessages[currentMessages.length - 1]); // remove the bottom
  }
};

// This is what is displayed 5 seconds after the page loads
let messages = [
    'You now have 2 huts',
    'Two wanderers move into the the other hut',
    'They say they will help you rebuild'
];
window.setTimeout(() => {
    localStorage.setItem('farmingSpeed', 3);
    farmingSpeed = Number(localStorage.getItem('farmingSpeed'));
    BetterNewText();
}, testTime);

window.setTimeout(() => {
    brickButton.hidden = false;
    woodButton.hidden = false;
}, testTime * 3);


window.setTimeout(() => {
    if (farmingSpeed > 1) { // This doesnt work and i have to update the newtext function to display the messages at an interval
        messages = ['A pack of wolves killed one of the wanderers'];
        farmingSpeed -= 1;
        localStorage.setItem('farmingSpeed', farmingSpeed);
        newText();
        messages = ['This will slow down your gathering'];
        newText();
        messages = ['This town just got smaller'];
        newText();
        messages = ["You'll need more help or you won't survive"];
        newText();
    } else {
        gameOver();
    }
}, 90000); // Was 90000 and I changed it for testing

woodButton.addEventListener('click', () => {
    woodButton.classList.add('cooldown');
    window.setTimeout(() => {
        woodButton.classList.remove('cooldown');
        addWoodAndUpdateUI(20);
        if (wood >= 150 && brick >= 120) {
            messages = ['You have enough to build a proper shelter now'];
            shelterButton.hidden = false;
        }
    }, testTime * 1.6) // This is pretty much perfect timing
});

brickButton.addEventListener('click', () => {
    brickButton.classList.add('cooldown');
    window.setTimeout(() => {
        brickButton.classList.remove('cooldown');
        addBrickAndUpdateUI(20);
    }, testTime * 1.6)
});

shelterButton.addEventListener('click', () => {
    if (wood < 150 || brick < 120) {
        messages = ["You'll need 150 wood and 120 brick for a shelter"];
        newText();
    } else {
        shelterButton.classList.add('cooldown');
        window.setTimeout(() => {
            shelterButton.classList.remove('cooldown');
            addShelterAndUpdateUI();
            addBrickAndUpdateUI(-120);
            addWoodAndUpdateUI(-150);
        }, testTime * 1.6);
    }
});