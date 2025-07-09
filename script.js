let token = localStorage.getItem("token");

if (token === null) {
  localStorage.setItem("token", "0");
  token = "0";
}

const button = document.getElementById('action'); 
const messagesContainer = document.getElementById('messages');
const resourcesContainer = document.getElementById('resources');
let testTime = 3000; // should be 3000 for normal gameplay
let newTestTime = 1500; // should be 1500 for normal gameplay
let messageInterval = null;
let wood = 0;
let brick = 0;
let metal = 0;
let shelters = 0;

if (token == '1') {
  window.location.href = 'gather.html';
}


let messages = [
	'The flood is over',
	'All the townspeople are dead',
	'Ruined barns litter the landscape',
	'You get up and look around',
	'The Town needs You.',
];

let index = 0;

// Function for adding text to the screen - just need to update the messages list.
function newText() {
	const p = document.createElement('p');
	p.textContent = messages[index];
	messagesContainer.insertBefore(p, messagesContainer.firstChild); // insert at top

    index++;
	if (index >= messages.length) index = 0;

    const currentMessages = messagesContainer.querySelectorAll('p');
    if (currentMessages.length > 10) {
      messagesContainer.removeChild(currentMessages[currentMessages.length - 1]); // remove bottom
  }
}

// Sets the timer for showing the first 5 messages and then stopping them and showing the button.
let intervalId = window.setInterval(newText, testTime);
window.setTimeout(() => {
	button.hidden = false;
  	clearInterval(intervalId);
}, testTime * messages.length);

// Function for the first button press- basically just shows text and changes the button.
const walkAround = function() {
	button.hidden = true;
  	messagesContainer.innerHTML = '';

	messages = [
		'You walk to the town square',
		'Everything has been washed away',
		'Broken wood and rubble are everwhere',
		'This is where You will rebuild.'
	]

	index = 0;
	let intervalId = window.setInterval(newText, testTime);  // IMPORTANT CODE - IT'S HOW THE TEXT DOESN'T GO FOREVER!
	window.setTimeout(() => {
		clearInterval(intervalId);
		button.hidden = false;
		button.textContent = 'Build a shelter';
    createWoodButton(); // HERE
	}, testTime * messages.length);
	button.removeEventListener('click', walkAround);
};

button.addEventListener('click', walkAround);

// Functions for adding materials. // MAKE SURE TO COPY AND PASTE THIS FOR THE OTHER FILE
let addWood = function(quantity) { 
  let woodDiv = document.getElementById('resource-wood');
  wood += quantity;
  if (woodDiv) {
    woodDiv.textContent = 'Wood: ' + wood;
  } else {
    woodDiv = document.createElement('div');
    woodDiv.className = 'resource-square';
    woodDiv.id = 'resource-wood';
    woodDiv.textContent = 'Wood: ' + wood;
    resourcesContainer.appendChild(woodDiv);
    button.removeEventListener('click', addWood);
  }
  messages = [
    'You gathered 20 wood',
    'This will help you build things'
  ];
  if (messageInterval) clearInterval(messageInterval);
  index = 0;
  messageInterval = setInterval(() => {
    newText();
    if (index === 0) { // index resets to 0 after last message
      clearInterval(messageInterval);
      messageInterval = null;
    }
  }, testTime);
};
let toCancelWood = function(event) {
  const btn = event.currentTarget;

  // Add cooldown class to disable and show animation
  btn.classList.add('cooldown');

  // OPTIONAL: Wrap the button text in a <span> so it stays on top of the overlay
  if (!btn.querySelector('span')) {
    const text = btn.textContent;
    btn.textContent = '';
    const span = document.createElement('span');
    span.textContent = text;
    btn.appendChild(span);
  }

  // Add wood after cooldown duration
  window.setTimeout(() => {
    addWood(20);
    btn.classList.remove('cooldown');
  }, testTime * 1.6);  // Adjust cooldown time here
};

let addBrick = function(quantity) {  // ADD THE MESSAGES TO THE BRICK AND METAL ALSO
  let brickDiv = document.getElementById('resource-brick');
  brick += quantity;
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
let toCancelBrick = function(event) {
  const botn = event.currentTarget;

  // Add cooldown class to disable and show animation
  botn.classList.add('cooldown');

  // OPTIONAL: Wrap the button text in a <span> so it stays on top of the overlay
  if (!botn.querySelector('span')) {
    const text = botn.textContent;
    botn.textContent = '';
    const span = document.createElement('span');
    span.textContent = text;
    botn.appendChild(span);
  }

  // Add wood after cooldown duration
  window.setTimeout(() => {
    addWood(20);
    botn.classList.remove('cooldown');
  }, testTime * 1.6);  // Adjust cooldown time here
};
let addMetal = function(quantity) {
  let metalDiv = document.getElementById('resource-metal');
  metal += quantity;
  if (metalDiv) {
    metalDiv.textContent = 'Metal: ' + metal;
  } else {
    metalDiv = document.createElement('div');
    metalDiv.className = 'resource-square';
    metalDiv.id = 'resource-metal';
    metalDiv.textContent = 'Metal: ' + metal;
    resourcesContainer.appendChild(metalDiv);
  }
};
let toCancelMetal = function(event) {
	addMetal(5);
	event.currentTarget.removeEventListener('click', toCancelMetal);
};
let addShelter = function(quantity) {
  let shelterDiv = document.getElementById('resource-shelter');
  shelters += quantity;
  if (shelterDiv) {
    shelterDiv.textContent = 'Shelters: ' + shelters;
  } else {
    shelterDiv = document.createElement('div');
    shelterDiv.className = 'resource-square';
    shelterDiv.id = 'resource-shelter';
    shelterDiv.textContent = 'Shelters: ' + shelters;
    resourcesContainer.appendChild(shelterDiv);
  }
};




// Function for creating a new button underneath the first one.
function createWoodButton() {
  // Create a new button element
  const woodButton = document.createElement('button');
  woodButton.id = 'wood-action';
  woodButton.textContent = 'Gather wood';
  woodButton.className = button.className; // Copy styles from the first button

  // Insert directly under the first button in #button-area
  const buttonArea = document.getElementById('button-area');
  buttonArea.insertBefore(woodButton, button.nextSibling);

  // add an event listener here
  woodButton.addEventListener('click', toCancelWood);
};


let buildShelter = function() {
  if (wood < 40) {
    messages = ["You'll need at least 40 wood for a shelter"];
  } else {
    wood -= 40;
    if (shelters === 0) {
      messages = [
        "You built Your first shelter",
        "It will keep You safe for a while"
      ];
    } else {
      messages = [
        "You built another shelter",
        '2 shelters should be enough'
      ];
    }
    addShelter(1);
    updateResource('wood', wood);
  }
  if (messageInterval) clearInterval(messageInterval);
  index = 0;
  for (let i = 0; i < messages.length; i++) {
    newText();
}
  if (shelters >= 2) {
    document.getElementById('wood-action').addEventListener('click', () => {
      window.location.href = 'gather.html';
    })
  }
}
// It takes about 35 seconds to get here DO NOT DO THIS AGAIN IT'S VERY JANK - JUST REMOVE THE BUTTON FROM THE DOM AFTER.
window.setTimeout(() => {
  button.addEventListener('click', buildShelter);
}, testTime * 12);

// IMPORTANT FUNCTION TO UPDATE THE UI.
function updateResource(name, quantity) {
  const resourceDiv = document.getElementById(`resource-${name}`);
  if (resourceDiv) {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    resourceDiv.textContent = `${displayName}: ${quantity}`;
  }
};

// This code is a mess- time to change paths - to gather.html
