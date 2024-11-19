const gameDiv = document.getElementById('game');

// Game state variables
let gameState = {
    playerName: '',
    hasLight: false,
    cluesFound: [],
    trustedShadows: 0,
    avoidedShadows: 0,
    inventory: [],
    pathTaken: '',
    interactions: 0, // Count interactions to adjust difficulty or events
    visitedScenes: {
        aisle: false,
        orbRoom: false,
        mirrors: false,
        sanctuary: false,
        journalFound: false,
        shadowEncountered: false,
    },
};

// Clue descriptions for dynamic ending messages
const clueDescriptions = {
    'ancientKey': 'the ancient key',
    'glowingOrb': 'the glowing orb',
    'forbiddenKnowledge': 'forbidden knowledge',
    'personalArtifacts': 'personal artifacts',
    'mirrorRoom': 'the reflections in the mirror room',
    'mirrorMemory': 'a memory from the mirror',
    'personalJournal': 'your personal journal',
    'memoryRestoration': 'restored memories',
    'sanctuary': 'the sanctuary',
};

let volumeControl;
let volumeControlTimeout;

let endingMessageDisplayed = false;
let awaitingRestartChoice = false;
let gameFullyOver = false;

// Messages queue for typewriter effect
let messages = [];
let typing = false;
let currentMessageDiv = null; // Keep track of the current message
let waitingForSpace = false; // Flag to check if waiting for spacebar

// Audio elements
let ambientAudio;
let negativeAudio;

// Volume control element
let volumeRange;

// Flag to check if the game has ended
let isGameOver = false;

// Start the game when the page loads
window.onload = function() {
    // Initialize DOM elements here
    ambientAudio = document.getElementById('ambientAudio');
    negativeAudio = document.getElementById('negativeAudio');
    volumeRange = document.getElementById('volumeRange');
    volumeControl = document.getElementById('volume-control');

    // Volume control event listener
    volumeRange.addEventListener('input', function() {
        ambientAudio.volume = parseFloat(volumeRange.value);
        resetVolumeControlTimer(); // Reset timer on input
    });

    // Mouseover and mouseout events to show/hide volume control
    volumeControl.addEventListener('mouseover', function() {
        showVolumeControl();
        clearTimeout(volumeControlTimeout); // Stop the timer while hovering
    });

    volumeControl.addEventListener('mouseout', function() {
        resetVolumeControlTimer();
    });

    // Start the inactivity timer
    resetVolumeControlTimer();

    askName();
};

// Start the game
function startGame() {
    messages.push(`You awaken to the soft rustling of pages and the faint scent of aged paper. As your eyes adjust to the dim light, towering bookshelves come into focus, stretching infinitely in every direction. A profound silence envelops you, broken only by the distant echo of a closing book.

You have no recollection of how you arrived here. Your name is ${gameState.playerName}, but beyond that, your memories are shrouded in fog.

Do you choose to 'explore' the library or 'call out' for someone?`);
    typeNextMessage(handleInitialChoice);
}

function typeNextMessage(callback) {
    if (messages.length === 0) {
        typing = false;

        if (gameFullyOver) {
            // The game is fully over, do not proceed further
            return;
        }

        if (isGameOver) {
            if (!endingMessageDisplayed) {
                displayEndingMessage();
                return;
            } else if (!awaitingRestartChoice) {
                awaitingRestartChoice = true;
                getUserInput(handleRestartChoice);
                return;
            } else {
                // Game is over, ending message displayed, awaiting restart choice is true
                // Do nothing
                return;
            }
        }

        showPressSpacePrompt();
        waitForSpace(() => {
            hidePressSpacePrompt();
            if (callback) {
                callback();
            } else {
                typeNextMessage();
            }
        });
        return;
    }

    typing = true;

    // Remove previous messageDiv if it exists
    if (currentMessageDiv) {
        currentMessageDiv.remove();
    }

    const fullMessage = messages.shift();
    let index = 0;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('typewriter');
    gameDiv.appendChild(messageDiv);

    currentMessageDiv = messageDiv; // Update the current messageDiv

    const cursor = document.createElement('span');
    cursor.classList.add('cursor');
    messageDiv.appendChild(cursor);

    function type() {
        if (index < fullMessage.length) {
            cursor.insertAdjacentText('beforebegin', fullMessage.charAt(index));
            index++;
            setTimeout(type, 50); // Adjust typing speed as desired
        } else {
            cursor.remove();
            typing = false;
            // Proceed based on the game state
            showPressSpacePrompt();
            waitForSpace(() => {
                hidePressSpacePrompt();
                if (callback) {
                    callback();
                } else {
                    typeNextMessage();
                }
            });
        }
    }
    type();
}



// Function to show prompt to press spacebar
function showPressSpacePrompt() {
    if (!document.getElementById('spacebar-prompt')) {
        const prompt = document.createElement('div');
        prompt.id = 'spacebar-prompt';
        prompt.textContent = '[Press Spacebar to continue]';
        prompt.style.fontSize = '16px';
        prompt.style.marginTop = '10px';
        gameDiv.appendChild(prompt);
    }
}

// Function to hide the spacebar prompt
function hidePressSpacePrompt() {
    const prompt = document.getElementById('spacebar-prompt');
    if (prompt) {
        prompt.remove();
    }
}

// Function to wait for spacebar press
function waitForSpace(callback) {
    waitingForSpace = true;
    document.addEventListener('keydown', function onKeyPress(e) {
        if (e.code === 'Space' && waitingForSpace) {
            waitingForSpace = false;
            document.removeEventListener('keydown', onKeyPress);
            callback();
        }
    });
}

// Function to get user input
function getUserInput(callback) {
    // Remove any existing inputs within the game area
    const existingInputs = gameDiv.querySelectorAll('input[type="text"]');
    existingInputs.forEach(input => input.remove());

    // Create new input for user
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    gameDiv.appendChild(document.createElement('br'));
    gameDiv.appendChild(input);
    input.focus();

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const userInput = input.value.trim().toLowerCase();
            input.remove();
            callback(userInput);
        }
    });
}

// Initial name input with typewriter effect
function askName() {
    const initialMessage = "What is your name?";
    let index = 0;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('typewriter');
    gameDiv.appendChild(messageDiv);

    currentMessageDiv = messageDiv; // Keep track of the current messageDiv

    const cursor = document.createElement('span');
    cursor.classList.add('cursor');
    messageDiv.appendChild(cursor);

    function type() {
        if (index < initialMessage.length) {
            cursor.insertAdjacentText('beforebegin', initialMessage.charAt(index));
            index++;
            setTimeout(type, 100); // Adjusted typing speed to be slower
        } else {
            cursor.remove();
            getNameInput();
        }
    }
    type();
}

function getNameInput() {
    // Remove any existing inputs within the game area
    const existingInputs = gameDiv.querySelectorAll('input[type="text"]');
    existingInputs.forEach(input => input.remove());

    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    gameDiv.appendChild(document.createElement('br'));
    gameDiv.appendChild(input);
    input.focus();

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const playerName = input.value.trim();
            if (playerName) {
                gameState.playerName = playerName;
                input.remove();
                currentMessageDiv.remove(); // Remove the "What is your name?" text
                // Start ambient music now
                ambientAudio.volume = parseFloat(volumeRange.value);
                ambientAudio.play().catch(error => {
                    console.error('Audio playback failed.', error);
                });
                startGame();
            } else {
                messages.push("Please enter a valid name.");
                typeNextMessage(() => getNameInput());
            }
        }
    });
}

// Function to show volume control
function showVolumeControl() {
    volumeControl.classList.remove('hidden');
}

// Function to hide volume control
function hideVolumeControl() {
    volumeControl.classList.add('hidden');
}

// Function to reset the inactivity timer
function resetVolumeControlTimer() {
    // Show the volume control when user interacts
    showVolumeControl();

    // Clear any existing timer
    clearTimeout(volumeControlTimeout);

    // Set a new timer to hide the volume control after 5 seconds
    volumeControlTimeout = setTimeout(function() {
        hideVolumeControl();
    }, 5000); // 5000 milliseconds = 5 seconds
}

// Play negative sound effect
function playNegativeSound() {
    negativeAudio.volume = 0.7;
    negativeAudio.play();
}
// Handle the initial choice
function handleInitialChoice() {
    getUserInput((choice) => {
        if (choice.includes('explore')) {
            gameState.visitedScenes.aisle = true;
            messages.push(`You decide to explore. As you walk deeper into the labyrinth of shelves, the books seem to whisper, their voices just beyond comprehension. The dim light casts long shadows, and you can't shake the feeling of being watched.`);
            gameState.pathTaken = 'explore';
            typeNextMessage(discoverFirstClue);
        } else if (choice.includes('call')) {
            messages.push(`You call out into the vastness, your voice echoing endlessly. For a moment, there's only silence. Then, a faint whisper responds, "We've been waiting for you..." A chill runs down your spine.`);
            gameState.pathTaken = 'call';
            typeNextMessage(encounterShadowLibrarian);
        } else {
            messages.push(`Uncertain, you hesitate. Do you 'explore' the library or 'call out' for someone?`);
            typeNextMessage(handleInitialChoice);
        }
    });
}

// Discover the first clue (exploration path)
function discoverFirstClue() {
    messages.push(`As you navigate the winding aisles, a glint catches your eye. A key lies on the floor, ornate and ancient.

Do you 'pick up' the key or 'ignore' it?`);
    typeNextMessage(() => {
        getUserInput(handleKeyChoice);
    });
}

// Modified to prevent dead end when ignoring the key
function handleKeyChoice(choice) {
    if (choice.includes('pick up')) {
        messages.push(`You pick up the key, feeling its cold weight in your hand. It seems to hum with a faint energy.`);
        gameState.inventory.push('ancientKey');
        gameState.cluesFound.push('ancientKey');
        typeNextMessage(() => {
            messages.push(`You notice a door at the end of the aisle, one that wasn't there before. It's slightly ajar, darkness spilling out.

Do you 'enter' the door or 'continue' down the aisle?`);
            typeNextMessage(() => {
                getUserInput(handleAisleDoorChoice);
            });
        });
    } else if (choice.includes('ignore')) {
        messages.push(`You decide to leave the key. As you walk away, you hear a soft click behind you, but see nothing when you turn.`);
        typeNextMessage(() => {
            messages.push(`The aisle stretches endlessly. Shadows seem to move just out of sight.

Do you 'investigate' the shadows, 'return' to the key, or 'keep moving'?`);
            typeNextMessage(() => {
                getUserInput(handleExtendedChoice);
            });
        });
    } else {
        messages.push(`The key lies on the floor. Do you 'pick up' the key or 'ignore' it?`);
        typeNextMessage(() => {
            getUserInput(handleKeyChoice);
        });
    }
}

function handleExtendedChoice(choice) {
    if (choice.includes('return')) {
        messages.push(`You return to where the key was lying. The ornate key still rests on the floor.

Do you 'pick up' the key or 'ignore' it?`);
        typeNextMessage(() => {
            getUserInput(handleKeyChoice);
        });
    } else if (choice.includes('investigate') || choice.includes('keep')) {
        handleShadowInvestigation(choice);
    } else {
        messages.push(`Do you 'investigate' the shadows, 'return' to the key, or 'keep moving'?`);
        typeNextMessage(() => {
            getUserInput(handleExtendedChoice);
        });
    }
}
function handleAisleDoorChoice(choice) {
    if (choice.includes('enter')) {
        gameState.visitedScenes.orbRoom = true;
        messages.push(`You push the door open and step into a circular room filled with floating books. In the center, a pedestal holds a glowing orb.`);
        gameState.cluesFound.push('glowingOrb');
        typeNextMessage(() => {
            messages.push(`A voice echoes: "The knowledge you seek comes with a price."

Do you 'take' the orb or 'leave' it?`);
            typeNextMessage(() => {
                getUserInput(handleOrbChoice);
            });
        });
    } else if (choice.includes('continue')) {
        messages.push(`You continue down the aisle, the atmosphere growing heavier. The whispers of the books grow louder.`);
        typeNextMessage(() => {
            messages.push(`Suddenly, a shadow blocks your path, its eyes gleaming.

Do you 'confront' the shadow or 'retreat'?`);
            typeNextMessage(() => {
                getUserInput(handleShadowConfrontation);
            });
        });
    } else {
        messages.push(`Do you 'enter' the door or 'continue' down the aisle?`);
        typeNextMessage(() => {
            getUserInput(handleAisleDoorChoice);
        });
    }
}

// Modified to prevent softlock in the orb room
function handleOrbChoice(choice) {
    if (choice.includes('take')) {
        messages.push(`As you grasp the orb, a surge of memories floods your mind—some joyful, others painful. The weight of knowledge is overwhelming.`);
        gameState.cluesFound.push('forbiddenKnowledge');
        typeNextMessage(() => {
            messages.push(`The room begins to dissolve, and you find yourself back in the library, but everything feels different.

Do you wish to 'explore' further or 'rest' here?`);
            typeNextMessage(() => {
                getUserInput(handlePostOrbChoice);
            });
        });
    } else if (choice.includes('leave')) {
        messages.push(`You decide it's best not to disturb the orb. As you turn to leave, the floating books rearrange themselves, forming a pathway.`);
        typeNextMessage(() => {
            messages.push(`Do you 'follow' the book path, 'return' to the orb, or 'exit' to the main aisle?`);
            typeNextMessage(() => {
                getUserInput(handleBookPathChoice);
            });
        });
    } else {
        messages.push(`The voice echoes: "Choose wisely." Do you 'take' the orb or 'leave' it?`);
        typeNextMessage(() => {
            getUserInput(handleOrbChoice);
        });
    }
}

// New function to handle post-orb choices
function handlePostOrbChoice(choice) {
    if (choice.includes('explore')) {
        messages.push(`With new understanding, you venture deeper into the library's mysteries.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('rest')) {
        handleAlternativeEndingChoice(choice);
    } else {
        messages.push(`Do you wish to 'explore' further or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handlePostOrbChoice);
        });
    }
}

// Modified to prevent dead end in book path
function handleBookPathChoice(choice) {
    if (choice.includes('follow')) {
        messages.push(`You follow the path of books, which leads you to a hidden chamber filled with artifacts from your past.`);
        gameState.cluesFound.push('personalArtifacts');
        typeNextMessage(() => {
            messages.push(`You feel a deep connection to this place, as if it's a part of you.

Do you wish to 'examine' the artifacts, 'leave' the chamber, or 'rest' here?`);
            typeNextMessage(() => {
                getUserInput(handleArtifactChoice);
            });
        });
    } else if (choice.includes('return')) {
        messages.push(`You return to examine the orb more closely.`);
        typeNextMessage(() => {
            getUserInput(handleOrbChoice);
        });
    } else if (choice.includes('exit')) {
        messages.push(`You make your way back to the main aisle of the library.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else {
        messages.push(`Do you 'follow' the book path, 'return' to the orb, or 'exit' to the main aisle?`);
        typeNextMessage(() => {
            getUserInput(handleBookPathChoice);
        });
    }
}

// New function to handle artifact room choices
function handleArtifactChoice(choice) {
    if (choice.includes('examine')) {
        messages.push(`As you examine the artifacts, memories begin to surface. Each object tells a story from your past.`);
        gameState.cluesFound.push('memoryRestoration');
        typeNextMessage(checkForEnding);
    } else if (choice.includes('leave')) {
        messages.push(`You decide to leave the chamber and return to exploring the library.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('rest')) {
        handleAlternativeEndingChoice(choice);
    } else {
        messages.push(`Do you wish to 'examine' the artifacts, 'leave' the chamber, or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handleArtifactChoice);
        });
    }
}

// Modified to prevent dead end in shadow encounter
function handleShadowConfrontation(choice) {
    if (choice.includes('confront')) {
        messages.push(`You gather your courage and step toward the shadow. "What do you want?" you demand. The shadow smiles, "Only to help you remember."`);
        gameState.trustedShadows++;
        typeNextMessage(() => {
            messages.push(`The shadow gestures, and a doorway appears. "Through there lies your truth."`);
            typeNextMessage(() => {
                messages.push(`Do you 'enter' the doorway, 'question' the shadow further, or 'retreat'?`);
                typeNextMessage(() => {
                    getUserInput(handleExpandedDoorwayChoice);
                });
            });
        });
    } else if (choice.includes('retreat')) {
        messages.push(`You step back, but the shadow doesn't pursue. It remains, waiting patiently.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'reconsider' your choice, 'explore' elsewhere, or 'rest' here?`);
            typeNextMessage(() => {
                getUserInput(handleRetreatChoice);
            });
        });
    } else {
        messages.push(`Do you 'confront' the shadow or 'retreat'?`);
        typeNextMessage(() => {
            getUserInput(handleShadowConfrontation);
        });
    }
}

// New function to handle expanded doorway choices
function handleExpandedDoorwayChoice(choice) {
    if (choice.includes('enter')) {
        handleDoorwayChoice('enter');
    } else if (choice.includes('question')) {
        messages.push(`The shadow's form shifts as it speaks: "I am what remains of your memories, seeking to guide you back to wholeness."`);
        typeNextMessage(() => {
            messages.push(`Do you now wish to 'enter' the doorway or 'retreat'?`);
            typeNextMessage(() => {
                getUserInput(handleDoorwayChoice);
            });
        });
    } else if (choice.includes('retreat')) {
        handleDoorwayChoice('stay');
    } else {
        messages.push(`Do you 'enter' the doorway, 'question' the shadow further, or 'retreat'?`);
        typeNextMessage(() => {
            getUserInput(handleExpandedDoorwayChoice);
        });
    }
}

// New function to handle retreat choices
function handleRetreatChoice(choice) {
    if (choice.includes('reconsider')) {
        messages.push(`You turn back to face the shadow once more.`);
        typeNextMessage(() => {
            handleShadowConfrontation('confront');
        });
    } else if (choice.includes('explore')) {
        messages.push(`You choose to explore other parts of the library.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('rest')) {
        handleAlternativeEndingChoice(choice);
    } else {
        messages.push(`Do you wish to 'reconsider' your choice, 'explore' elsewhere, or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handleRetreatChoice);
        });
    }
}

function handleDoorwayChoice(choice) {
    if (choice.includes('enter')) {
        gameState.visitedScenes.mirrors = true;
        messages.push(`You step through the doorway and find yourself in a room filled with mirrors reflecting different moments of your life.`);
        gameState.cluesFound.push('mirrorRoom');
        typeNextMessage(() => {
            messages.push(`As you gaze into the mirrors, you begin to understand the fragments of your past.`);
            typeNextMessage(checkForEnding);
        });
    } else if (choice.includes('stay')) {
        messages.push(`You decide not to enter. The doorway closes, and the shadow sighs, "Perhaps another time."`);
        typeNextMessage(() => {
            messages.push(`The shadow fades away, leaving you alone.`);
            typeNextMessage(() => {
                messages.push(`Do you wish to 'explore' further or 'rest' here?`);
                typeNextMessage(() => {
                    getUserInput(handleAlternativeEndingChoice);
                });
            });
        });
    } else {
        messages.push(`Do you 'enter' the doorway or 'stay' where you are?`);
        typeNextMessage(() => {
            getUserInput(handleDoorwayChoice);
        });
    }
}

// Modified to prevent shadow investigation dead ends
function handleShadowInvestigation(choice) {
    if (choice.includes('investigate')) {
        messages.push(`You follow the moving shadows, which lead you to a hidden alcove. Inside, you find a journal with your name on it.`);
        gameState.cluesFound.push('personalJournal');
        gameState.visitedScenes.journalFound = true;
        typeNextMessage(() => {
            messages.push(`Do you 'read' the journal, 'explore' the alcove further, or 'return' to the main library?`);
            typeNextMessage(() => {
                getUserInput(handleAlcoveChoice);
            });
        });
    } else if (choice.includes('keep moving')) {
        messages.push(`You decide not to follow the shadows. The library seems to shift around you, offering different paths.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'return' to investigate the shadows, 'explore' a different direction, or 'rest' here?`);
            typeNextMessage(() => {
                getUserInput(handleMovementChoice);
            });
        });
    } else {
        messages.push(`Do you 'investigate' the shadows or 'keep moving'?`);
        typeNextMessage(() => {
            getUserInput(handleShadowInvestigation);
        });
    }
}

// New function to handle alcove choices
function handleAlcoveChoice(choice) {
    if (choice.includes('read')) {
        handleJournalChoice('read');
    } else if (choice.includes('explore')) {
        messages.push(`As you explore the alcove, you discover hidden compartments and mysterious artifacts.`);
        gameState.cluesFound.push('hiddenArtifacts');
        typeNextMessage(() => {
            messages.push(`Do you wish to 'examine' the artifacts, 'return' to the journal, or 'leave' the alcove?`);
            typeNextMessage(() => {
                getUserInput(handleArtifactDiscovery);
            });
        });
    } else if (choice.includes('return')) {
        messages.push(`You step back into the main library, but remember the alcove's location.`);
        typeNextMessage(continueExploration);
    } else {
        messages.push(`Do you 'read' the journal, 'explore' the alcove further, or 'return' to the main library?`);
        typeNextMessage(() => {
            getUserInput(handleAlcoveChoice);
        });
    }
}

// New function to handle movement choices
function handleMovementChoice(choice) {
    if (choice.includes('return')) {
        messages.push(`You turn back to investigate the shadows you noticed earlier.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('explore')) {
        messages.push(`You choose a different path through the library.`);
        typeNextMessage(continueExploration);
    } else if (choice.includes('rest')) {
        handleAlternativeEndingChoice(choice);
    } else {
        messages.push(`Do you wish to 'return' to investigate the shadows, 'explore' a different direction, or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handleMovementChoice);
        });
    }
}

// New function to handle artifact discovery
function handleArtifactDiscovery(choice) {
    if (choice.includes('examine')) {
        messages.push(`The artifacts resonate with personal significance, each one triggering fragments of memory.`);
        gameState.cluesFound.push('artifactMemories');
        typeNextMessage(checkForEnding);
    } else if (choice.includes('return')) {
        messages.push(`You turn your attention back to the journal.`);
        typeNextMessage(() => {
            handleJournalChoice('read');
        });
    } else if (choice.includes('leave')) {
        messages.push(`You exit the alcove, returning to the main library.`);
        typeNextMessage(continueExploration);
    } else {
        messages.push(`Do you wish to 'examine' the artifacts, 'return' to the journal, or 'leave' the alcove?`);
        typeNextMessage(() => {
            getUserInput(handleArtifactDiscovery);
        });
    }
}

// Modified to prevent journal dead end
function handleJournalChoice(choice) {
    if (choice.includes('read')) {
        messages.push(`You open the journal, and as you read, memories flood back. You remember why you're here.`);
        gameState.cluesFound.push('memoryRestoration');
        typeNextMessage(() => {
            messages.push(`A doorway appears, glowing softly. The journal remains in your hands.`);
            typeNextMessage(() => {
                messages.push(`Do you 'enter' the doorway, 'continue reading', or 'explore' elsewhere?`);
                typeNextMessage(() => {
                    getUserInput(handlePostJournalChoice);
                });
            });
        });
    } else if (choice.includes('put')) {
        messages.push(`You place the journal back. A feeling of regret lingers, but the journal remains within reach.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'reconsider' and take the journal, 'explore' further, or 'rest' here?`);
            typeNextMessage(() => {
                getUserInput(handleJournalReconsideration);
            });
        });
    } else {
        messages.push(`Do you 'read' the journal or 'put it away'?`);
        typeNextMessage(() => {
            getUserInput(handleJournalChoice);
        });
    }
}

// New function to handle post-journal choices
function handlePostJournalChoice(choice) {
    if (choice.includes('enter')) {
        handleFinalDecision('enter');
    } else if (choice.includes('continue')) {
        messages.push(`You delve deeper into the journal's pages, uncovering more memories.`);
        gameState.cluesFound.push('deeperMemories');
        typeNextMessage(checkForEnding);
    } else if (choice.includes('explore')) {
        messages.push(`You carefully store the journal and continue exploring the library.`);
        gameState.inventory.push('journal');
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else {
        messages.push(`Do you 'enter' the doorway, 'continue reading', or 'explore' elsewhere?`);
        typeNextMessage(() => {
            getUserInput(handlePostJournalChoice);
        });
    }
}

// New function to handle journal reconsideration
function handleJournalReconsideration(choice) {
    if (choice.includes('reconsider')) {
        messages.push(`You return to the journal, reaching for it once more.`);
        typeNextMessage(() => {
            getUserInput(handleJournalChoice);
        });
    } else if (choice.includes('explore')) {
        messages.push(`You leave the alcove but make a mental note of its location.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('rest')) {
        handleAlternativeEndingChoice(choice);
    } else {
        messages.push(`Do you wish to 'reconsider' and take the journal, 'explore' further, or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handleJournalReconsideration);
        });
    }
}

// Encounter with the shadow librarian (call out path)
function encounterShadowLibrarian() {
    gameState.visitedScenes.shadowEncountered = true;
    messages.push(`A figure emerges from the shadows—a tall silhouette draped in tattered robes. "Lost souls wander here," it whispers. "Do you seek answers or solace?" 

Do you 'engage' with the shadow or 'avoid' it?`);
    typeNextMessage(() => {
        getUserInput(handleShadowDecision);
    });
}

function handleShadowDecision(choice) {
    if (choice.includes('engage')) {
        messages.push(`You nod hesitantly. "I seek the truth," you say. The shadow extends a skeletal hand, pointing deeper into the library. "Truth is hidden where memories reside," it murmurs before dissolving into mist.`);
        gameState.trustedShadows++;
        typeNextMessage(proceedToNextSection);
    } else if (choice.includes('avoid')) {
        messages.push(`You step back, fear gripping you. The shadow's eyes glow briefly before it vanishes. The air grows colder, and the silence becomes oppressive.`);
        gameState.avoidedShadows++;
        typeNextMessage(() => {
            messages.push(`Do you wish to 'reconsider' your choice, 'proceed' alone, or 'wait' here?`);
            typeNextMessage(() => {
                getUserInput(handleAvoidanceChoice);
            });
        });
    } else {
        messages.push(`The shadow waits silently. Do you 'engage' with the shadow or 'avoid' it?`);
        typeNextMessage(() => {
            getUserInput(handleShadowDecision);
        });
    }
}

// New function to handle avoidance choices
function handleAvoidanceChoice(choice) {
    if (choice.includes('reconsider')) {
        messages.push(`The shadow reappears, patient and understanding.`);
        typeNextMessage(() => {
            getUserInput(handleShadowDecision);
        });
    } else if (choice.includes('proceed')) {
        faceObstacleAlone();
    } else if (choice.includes('wait')) {
        messages.push(`You decide to wait, gathering your thoughts.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'reconsider' your choice or 'proceed' alone?`);
            typeNextMessage(() => {
                getUserInput(handleAvoidanceChoice);
            });
        });
    } else {
        messages.push(`Do you wish to 'reconsider' your choice, 'proceed' alone, or 'wait' here?`);
        typeNextMessage(() => {
            getUserInput(handleAvoidanceChoice);
        });
    }
}

// Proceed to the next section with more choices
function proceedToNextSection() {
    messages.push(`Following the shadow's direction, you arrive at a grand hall filled with ornate mirrors. Each reflection shows you at different ages, wearing expressions of joy, sorrow, and anger.

Do you 'approach' a mirror, 'look away', or 'return' to the entrance?`);
    typeNextMessage(() => {
        getUserInput(handleMirrorChoice);
    });
}

// Modified to prevent mirror choice dead ends
function handleMirrorChoice(choice) {
    if (choice.includes('approach')) {
        messages.push(`You step toward a mirror where your reflection smiles warmly. As you touch the glass, a memory unfolds—a cherished moment with a loved one. Tears well in your eyes as you realize how much you've forgotten.`);
        gameState.cluesFound.push('mirrorMemory');
        gameState.visitedScenes.mirrors = true;
        typeNextMessage(() => {
            messages.push(`Do you wish to 'examine' more mirrors, 'continue' exploring, or 'reflect' on what you've seen?`);
            typeNextMessage(() => {
                getUserInput(handleMirrorExploration);
            });
        });
    } else if (choice.includes('look away')) {
        messages.push(`Unnerved by the reflections, you turn away. The feeling of disconnection deepens, and you question what you might be missing.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'reconsider' looking at the mirrors, 'continue' exploring, or 'return' to the entrance?`);
            typeNextMessage(() => {
                getUserInput(handleMirrorAvoidance);
            });
        });
    } else if (choice.includes('return')) {
        messages.push(`You step back toward the entrance, though the mirrors' reflections still catch your eye.`);
        typeNextMessage(() => {
            encounterShadowLibrarian();
        });
    } else {
        messages.push(`The mirrors reflect countless versions of you. Do you 'approach' a mirror, 'look away', or 'return' to the entrance?`);
        typeNextMessage(() => {
            getUserInput(handleMirrorChoice);
        });
    }
}

// New function to handle mirror exploration
function handleMirrorExploration(choice) {
    if (choice.includes('examine')) {
        messages.push(`Each mirror reveals different fragments of your past, building a tapestry of memories.`);
        gameState.cluesFound.push('mirrorRecollections');
        typeNextMessage(continueExploration);
    } else if (choice.includes('continue')) {
        continueExploration();
    } else if (choice.includes('reflect')) {
        messages.push(`You take time to process the memories you've recovered.`);
        typeNextMessage(checkForEnding);
    } else {
        messages.push(`Do you wish to 'examine' more mirrors, 'continue' exploring, or 'reflect' on what you've seen?`);
        typeNextMessage(() => {
            getUserInput(handleMirrorExploration);
        });
    }
}

// New function to handle mirror avoidance
function handleMirrorAvoidance(choice) {
    if (choice.includes('reconsider')) {
        handleMirrorChoice('approach');
    } else if (choice.includes('continue')) {
        continueExploration();
    } else if (choice.includes('return')) {
        messages.push(`You return to the library entrance, carrying the weight of unexamined memories.`);
        typeNextMessage(() => {
            encounterShadowLibrarian();
        });
    } else {
        messages.push(`Do you wish to 'reconsider' looking at the mirrors, 'continue' exploring, or 'return' to the entrance?`);
        typeNextMessage(() => {
            getUserInput(handleMirrorAvoidance);
        });
    }
}

// Modified to enhance continued exploration
function continueExploration() {
    messages.push(`Leaving the hall of mirrors, you find a narrow staircase spiraling upward. A faint melody drifts from above—a song you vaguely remember.

Do you 'ascend' the staircase, 'explore' the current floor, or 'return' to the previous area?`);
    typeNextMessage(() => {
        getUserInput(handleStaircaseChoice);
    });
}

// Modified to prevent staircase choice dead ends
function handleStaircaseChoice(choice) {
    if (choice.includes('ascend')) {
        messages.push(`You climb the staircase, each step resonating with the melody. At the top, you enter a cozy room filled with familiar objects—a journal, a musical instrument, photographs. It's as if you've stepped into a personal sanctuary.`);
        gameState.cluesFound.push('sanctuary');
        gameState.visitedScenes.sanctuary = true;
        typeNextMessage(() => {
            messages.push(`Do you wish to 'examine' the objects, 'play' the instrument, or 'descend' the stairs?`);
            typeNextMessage(() => {
                getUserInput(handleSanctuaryChoice);
            });
        });
    } else if (choice.includes('explore')) {
        messages.push(`You decide to explore the current floor further.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('return')) {
        messages.push(`You return to the previous area.`);
        typeNextMessage(proceedToNextSection);
    } else {
        messages.push(`Do you 'ascend' the staircase, 'explore' the current floor, or 'return' to the previous area?`);
        typeNextMessage(() => {
            getUserInput(handleStaircaseChoice);
        });
    }
}

// New function to handle sanctuary choices
function handleSanctuaryChoice(choice) {
    if (choice.includes('examine')) {
        messages.push(`Each object tells a story, revealing pieces of your past.`);
        gameState.cluesFound.push('personalHistory');
        typeNextMessage(checkForEnding);
    } else if (choice.includes('play')) {
        messages.push(`The music awakens deep memories, filling the sanctuary with familiar melodies.`);
        gameState.cluesFound.push('musicalMemories');
        typeNextMessage(checkForEnding);
    } else if (choice.includes('descend')) {
        messages.push(`You return down the staircase, the melody following you.`);
        typeNextMessage(continueExploration);
    } else {
        messages.push(`Do you wish to 'examine' the objects, 'play' the instrument, or 'descend' the stairs?`);
        typeNextMessage(() => {
            getUserInput(handleSanctuaryChoice);
        });
    }
}

function handleAlternativeEndingChoice(choice) {
    if (choice.includes('explore')) {
        messages.push(`You venture back into the labyrinth of bookshelves, determined to uncover more of the library's mysteries.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('rest')) {
        messages.push(`You decide to rest, allowing the silence of the library to envelop you. Maybe in stillness, the answers will come.

Do you wish to 'continue' your journey or accept this moment of peace?`);
        typeNextMessage(() => {
            getUserInput(handleFinalRestChoice);
        });
    } else {
        messages.push(`The choice is yours. Do you wish to 'explore' further or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handleAlternativeEndingChoice);
        });
    }
}// New function to handle final rest choice
function handleFinalRestChoice(choice) {
    if (choice.includes('continue')) {
        messages.push(`Refreshed from your moment of rest, you stand to continue your journey.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else {
        messages.push(`You embrace the peaceful moment, finding acceptance in the quiet.
        
**A moment of peace...**`);
        isGameOver = true;
        typeNextMessage();
    }
}

// Modified to prevent dead end
function faceObstacleAlone() {
    messages.push(`Without guidance, you wander deeper into the library. The shelves twist and turn, leading you to a dead-end where a heavy door stands before you, adorned with intricate symbols.

Do you 'open' the door, 'turn back', or 'examine' the symbols?`);
    typeNextMessage(() => {
        getUserInput(handleObstacleDoorChoice);
    });
}

// Modified to prevent forced confrontation
function handleObstacleDoorChoice(choice) {
    if (choice.includes('open')) {
        messages.push(`You push the door open and enter a dimly lit chamber. The walls are lined with portraits whose eyes seem to follow you. In the center stands a pedestal with an open book emitting a soft glow.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'approach' the book, 'study' the portraits, or 'leave' the chamber?`);
            typeNextMessage(() => {
                getUserInput(handleChamberChoice);
            });
        });
    } else if (choice.includes('turn')) {
        messages.push(`As you turn back, you notice new paths have appeared in the library.`);
        typeNextMessage(() => {
            messages.push(`Do you wish to 'explore' these new paths or 'return' to the entrance?`);
            typeNextMessage(() => {
                getUserInput(handleNewPathChoice);
            });
        });
    } else if (choice.includes('examine')) {
        messages.push(`The symbols seem to tell a story - your story. Memories begin to surface as you trace them with your fingers.`);
        gameState.cluesFound.push('symbolMemories');
        typeNextMessage(() => {
            messages.push(`Do you wish to 'open' the door now or 'continue' examining the symbols?`);
            typeNextMessage(() => {
                getUserInput(handleSymbolChoice);
            });
        });
    } else {
        messages.push(`The door awaits your decision. Do you 'open' it, 'turn back', or 'examine' the symbols?`);
        typeNextMessage(() => {
            getUserInput(handleObstacleDoorChoice);
        });
    }
}

// New function to handle chamber choices
function handleChamberChoice(choice) {
    if (choice.includes('approach')) {
        messages.push(`As you near the glowing book, its pages begin to turn on their own, revealing glimpses of your past.`);
        typeNextMessage(triggerFinalConfrontation);
    } else if (choice.includes('study')) {
        messages.push(`The portraits show familiar faces - people from your past, each holding a piece of your story.`);
        gameState.cluesFound.push('portraitMemories');
        typeNextMessage(() => {
            messages.push(`Do you wish to 'continue' studying the portraits or 'approach' the book now?`);
            typeNextMessage(() => {
                getUserInput(handlePortraitChoice);
            });
        });
    } else if (choice.includes('leave')) {
        messages.push(`You step back from the chamber, but carry its revelations with you.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else {
        messages.push(`Do you wish to 'approach' the book, 'study' the portraits, or 'leave' the chamber?`);
        typeNextMessage(() => {
            getUserInput(handleChamberChoice);
        });
    }
}

// New function to handle portrait choice
function handlePortraitChoice(choice) {
    if (choice.includes('continue')) {
        messages.push(`Each portrait reveals more memories, building a clearer picture of your past.`);
        gameState.cluesFound.push('deeperPortraitMemories');
        typeNextMessage(checkForEnding);
    } else if (choice.includes('approach')) {
        messages.push(`You turn your attention to the glowing book at the center of the room.`);
        typeNextMessage(triggerFinalConfrontation);
    } else {
        messages.push(`Do you wish to 'continue' studying the portraits or 'approach' the book now?`);
        typeNextMessage(() => {
            getUserInput(handlePortraitChoice);
        });
    }
}

// New function to handle new path choice
function handleNewPathChoice(choice) {
    if (choice.includes('explore')) {
        messages.push(`You venture down one of the new paths, curious about where it might lead.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('return')) {
        messages.push(`You make your way back to the library's entrance.`);
        typeNextMessage(() => {
            encounterShadowLibrarian();
        });
    } else {
        messages.push(`Do you wish to 'explore' these new paths or 'return' to the entrance?`);
        typeNextMessage(() => {
            getUserInput(handleNewPathChoice);
        });
    }
}

// New function to handle symbol choice
function handleSymbolChoice(choice) {
    if (choice.includes('open')) {
        messages.push(`With newfound understanding from the symbols, you open the door.`);
        typeNextMessage(() => {
            handleObstacleDoorChoice('open');
        });
    } else if (choice.includes('continue')) {
        messages.push(`You continue studying the symbols, each one revealing more about your journey.`);
        gameState.cluesFound.push('deeperSymbolMemories');
        typeNextMessage(checkForEnding);
    } else {
        messages.push(`Do you wish to 'open' the door now or 'continue' examining the symbols?`);
        typeNextMessage(() => {
            getUserInput(handleSymbolChoice);
        });
    }
}

// Modified check for ending to include more nuanced paths
function checkForEnding() {
    let cluesFoundDescriptions = gameState.cluesFound.map(clue => clueDescriptions[clue]);
    let cluesCount = cluesFoundDescriptions.length;

    if (cluesCount >= 3) {
        let message = `As you piece together the fragments of your journey—${cluesFoundDescriptions.join(', ')}—a realization begins to take shape. This library isn't just a physical place; it's a labyrinth of your own mind, housing your memories, emotions, and experiences.

Fragments of a traumatic event flash before your eyes—a blinding light, screeching tires, shattered glass. The weight of sorrow presses upon you as you recall the loss of someone dear.

You find yourself before a grand door inscribed with your name. The air is thick with anticipation.

Do you 'enter' to confront the truth, 'reflect' on your discoveries, or 'wait' for more understanding?`;

        messages.push(message);
        typeNextMessage(() => {
            getUserInput(handleEnhancedFinalDecision);
        });
    } else {
        let message = `Despite your discoveries, you sense there are more truths to uncover. The library seems to hold deeper mysteries.

Do you wish to 'continue' exploring, 'review' what you've learned, or 'rest' here?`;

        messages.push(message);
        typeNextMessage(() => {
            getUserInput(handleIncompletePath);
        });
    }
}

// New function to handle incomplete path
function handleIncompletePath(choice) {
    if (choice.includes('continue')) {
        messages.push(`You press on, knowing there are more pieces to this puzzle.`);
        typeNextMessage(() => {
            handleShadowInvestigation('investigate');
        });
    } else if (choice.includes('review')) {
        messages.push(`You take time to process everything you've discovered so far.`);
        typeNextMessage(() => {
            handleAlternativeEndingChoice('explore');
        });
    } else if (choice.includes('rest')) {
        handleAlternativeEndingChoice('rest');
    } else {
        messages.push(`Do you wish to 'continue' exploring, 'review' what you've learned, or 'rest' here?`);
        typeNextMessage(() => {
            getUserInput(handleIncompletePath);
        });
    }
}

// New function to handle enhanced final decision
function handleEnhancedFinalDecision(choice) {
    if (choice.includes('enter')) {
        handleFinalDecision('enter');
    } else if (choice.includes('reflect')) {
        messages.push(`You take time to reflect on your journey, processing the weight of your discoveries.`);
        typeNextMessage(() => {
            messages.push(`Do you now feel ready to 'enter' and face the truth, or do you wish to 'wait' longer?`);
            typeNextMessage(() => {
                getUserInput(handleFinalReflection);
            });
        });
    } else if (choice.includes('wait')) {
        messages.push(`You decide to wait, feeling the need for more time to prepare yourself.`);
        typeNextMessage(() => {
            handleAlternativeEndingChoice('explore');
        });
    } else {
        messages.push(`Do you 'enter' to confront the truth, 'reflect' on your discoveries, or 'wait' for more understanding?`);
        typeNextMessage(() => {
            getUserInput(handleEnhancedFinalDecision);
        });
    }
}

// New function to handle final reflection
function handleFinalReflection(choice) {
    if (choice.includes('enter')) {
        handleFinalDecision('enter');
    } else if (choice.includes('wait')) {
        handleAlternativeEndingChoice('explore');
    } else {
        messages.push(`Do you now feel ready to 'enter' and face the truth, or do you wish to 'wait' longer?`);
        typeNextMessage(() => {
            getUserInput(handleFinalReflection);
        });
    }
}

// Modified final functions remain largely the same but with enhanced feedback
function handleFinalDecision(choice) {
    if (choice.includes('enter')) {
        messages.push(`With a heavy heart, you push open the door. A torrent of memories floods back—the accident, the guilt, the unbearable grief. You realize you've been trapped within your own mind, hiding from the pain of losing someone you loved.

Tears stream down your face as you confront the reality you've been avoiding. The library begins to dissolve around you, the shelves fading into a bright light.

You understand now that to heal, you must face the sorrow and allow yourself to grieve.

**The End**`);
        isGameOver = true;
        typeNextMessage();
    } else if (choice.includes('stay')) {
        messages.push(`You step back from the door, the weight of truth still heavy in your heart. The library offers solace in its endless corridors and forgotten memories.

Perhaps, in time, you'll find the courage to confront what lies beyond.

**To be continued...**`);
        isGameOver = true;
        typeNextMessage();
    } else {
        messages.push(`The choice is yours. Do you 'enter' to confront the truth or 'stay' in the library?`);
        typeNextMessage(() => {
            getUserInput(handleFinalDecision);
        });
    }
}

// Final confrontation remains similar but with more options
function triggerFinalConfrontation() {
    messages.push(`A shadowy figure materializes before you, its form shifting and ethereal. "You cannot run from yourself," it whispers. "I am the embodiment of all you've forgotten and all you've tried to escape."

Memories of the accident surface—the moments you tried so hard to suppress.

Do you choose to 'accept' this part of yourself, 'question' the shadow further, or 'reject' it?`);
    typeNextMessage(() => {
        getUserInput(handleEnhancedFinalChoice);
    });
}

// New function to handle enhanced final choice
function handleEnhancedFinalChoice(choice) {
    if (choice.includes('accept')) {
        handleFinalChoice('accept');
    } else if (choice.includes('question')) {
        messages.push(`"Why now?" you ask. The shadow's form ripples. "Because you are finally ready to remember, to heal."

Do you now choose to 'accept' this truth or 'reject' it?`);
        typeNextMessage(() => {
            getUserInput(handleFinalChoice);
        });
    } else if (choice.includes('reject')) {
        handleFinalChoice('reject');
    } else {
        messages.push(`Do you choose to 'accept' this part of yourself, 'question' the shadow further, or 'reject' it?`);
        typeNextMessage(() => {
            getUserInput(handleEnhancedFinalChoice);
        });
    }
}


// Function to display the ending message using the typewriter effect
function displayEndingMessage() {
    if (endingMessageDisplayed) return; // Prevent multiple calls
    endingMessageDisplayed = true; // Set the flag to indicate the ending message has been displayed
    awaitingRestartChoice = false; // Reset this flag

    // Stop the ambient music
    ambientAudio.pause();

    // Remove any existing inputs or prompts
    const existingInputs = gameDiv.querySelectorAll('input[type="text"]');
    existingInputs.forEach(input => input.remove());
    hidePressSpacePrompt();

    // Prepare the ending messages
    messages.push("Made with ❤️ by Lucas Pearson for the 2024 CPT-167 Final");
    messages.push("Would you like to play again? ('yes' or 'no')");

    // Start typing messages without a callback
    typeNextMessage();
}



function handleRestartChoice(choice) {
    if (choice.includes('yes')) {
        // Reset game state
        gameState = {
            playerName: '',
            hasLight: false,
            cluesFound: [],
            trustedShadows: 0,
            avoidedShadows: 0,
            inventory: [],
            pathTaken: '',
            interactions: 0,
            visitedScenes: {
                aisle: false,
                orbRoom: false,
                mirrors: false,
                sanctuary: false,
                journalFound: false,
                shadowEncountered: false,
            },
        };
        isGameOver = false;
        endingMessageDisplayed = false; // Reset the ending message flag
        awaitingRestartChoice = false; // Reset the flag
        gameFullyOver = false; // Reset the flag
        messages = [];
        if (currentMessageDiv) currentMessageDiv.remove(); // Remove any existing messages
        askName();
    } else {
        messages.push("Thank you for playing!");
        typeNextMessage(() => {
            // After displaying "Thank you for playing!", set the game as fully over
            gameFullyOver = true;
        });
    }
}