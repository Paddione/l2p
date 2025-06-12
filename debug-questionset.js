// Debug script to test question set selection
// This script will be run in the browser console to test the functionality

console.log('=== Question Set Selection Debug Script ===');

// Test 1: Check if we have the question set manager
console.log('1. Checking if questionSetManager is available...');
if (window.appState && window.appState.modules && window.appState.modules.questionSetManager) {
    console.log('✅ Question set manager is available');
} else {
    console.log('❌ Question set manager is NOT available');
    console.log('Available modules:', window.appState?.modules ? Object.keys(window.appState.modules) : 'None');
}

// Test 2: Check if we have current lobby
console.log('\n2. Checking current lobby...');
if (window.appState && window.appState.modules && window.appState.modules.playerManager) {
    const currentLobby = window.appState.modules.playerManager.getCurrentLobby();
    console.log('Current lobby:', currentLobby);
    if (currentLobby) {
        console.log('✅ Current lobby exists:', currentLobby.code);
        console.log('Current question set:', currentLobby.question_set);
    } else {
        console.log('❌ No current lobby found');
    }
} else {
    console.log('❌ Player manager is NOT available');
}

// Test 3: Check if we have current player
console.log('\n3. Checking current player...');
if (window.appState && window.appState.modules && window.appState.modules.playerManager) {
    const currentPlayer = window.appState.modules.playerManager.getCurrentPlayer();
    console.log('Current player:', currentPlayer);
    if (currentPlayer) {
        console.log('✅ Current player exists:', currentPlayer.username);
    } else {
        console.log('❌ No current player found');
    }
} else {
    console.log('❌ Player manager is NOT available');
}

// Test 4: Check if we can get question sets
console.log('\n4. Testing question sets API...');
if (window.appState && window.appState.modules && window.appState.modules.questionSetsApi) {
    try {
        window.appState.modules.questionSetsApi.getAll().then(questionSets => {
            console.log('✅ Question sets loaded:', questionSets.length);
            console.log('Available question sets:', questionSets.map(qs => ({id: qs.id, name: qs.name})));
        }).catch(error => {
            console.log('❌ Failed to load question sets:', error);
        });
    } catch (error) {
        console.log('❌ Error testing question sets API:', error);
    }
} else {
    console.log('❌ Question sets API is NOT available');
}

// Test 5: Test event listener
console.log('\n5. Testing event listener...');
console.log('Adding test event listener for questionSetSelected...');
document.addEventListener('questionSetSelected', function(event) {
    console.log('🎯 TEST: questionSetSelected event received!');
    console.log('Event detail:', event.detail);
});

// Test 6: Simulate question set selection
console.log('\n6. To test question set selection, you can run:');
console.log('document.dispatchEvent(new CustomEvent("questionSetSelected", { detail: { id: 1, name: "Test Set" } }));');

console.log('\n=== Debug script completed ===\n');
console.log('Please:');
console.log('1. Create a lobby');
console.log('2. Try to select a question set');
console.log('3. Check the console for any error messages');
console.log('4. Run the simulation command above to test the event system'); 