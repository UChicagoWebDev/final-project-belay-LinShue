const apiBaseUrl = '/api';
const signupForm = document.getElementById('registration-form'); 

function retrieveUnreadMessageCounts() {
    fetch(`${apiBaseUrl}/unread-counts`)
        .then(res => res.json())
        .then(unreadCounts => {
            console.log('Unread Message Counts:', unreadCounts);
        })
        .catch(fetchError => console.error('Error fetching unread counts:', fetchError));
}

function switchToChannel(targetChannelId) {
    history.pushState({ channel: targetChannelId }, `Channel ${targetChannelId}`, `/channel/${targetChannelId}`);
    fetch(`${apiBaseUrl}/channels/${targetChannelId}`)
        .then(res => res.json())
        .then(channelData => {
            displayChannelMessages(channelData);
        })
        .catch(fetchError => console.error('Error fetching channel messages:', fetchError));
}

function goBack() {
    history.back();
}

function registerUser() {
    const user = document.querySelector('#register-username').value;
    const pass = document.querySelector('#register-password').value; 
    fetch(`${apiBaseUrl}/membership`, {  
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Signup failed with status: ${res.status}`);
        }
        return res.json();
    })
    .then(userCredentials => {
        localStorage.setItem('api_key', userCredentials.token);
        window.location.reload();
    })
    .catch(signupError => {
        console.error('Signup failed:', signupError);
    });
}

function authenticateUser(username, password) {
    fetch(`${apiBaseUrl}/access`, {  
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    .then(res => res.json())
    .then(loginResponse => {
        console.log('Login response:', loginResponse);
        localStorage.setItem('api_key', loginResponse.token);
        window.location.reload();
    })
    .catch(loginError => {
        console.error('Login failed:', loginError);
    });
}

document.querySelector('.login button').addEventListener('click', (evt) => {
    evt.preventDefault();
    const user = document.querySelector('#access-username').value;
    const pass = document.querySelector('#access-password').value;
    authenticateUser(user, pass);
});



function validateUserCredentials(user, pass) {
    fetch(`${apiBaseUrl}/access`, {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
    })
    .then(res => res.json())
    .then(credentials => {
        localStorage.setItem('api_key', credentials.token); 
        localStorage.setItem('member_id', credentials.userId); 
        localStorage.setItem('member_username', credentials.username); 

        const targetPage = localStorage.getItem('targetPage');
        if (targetPage) {
            localStorage.removeItem('targetPage');
            window.location.href = targetPage;
        } else {
            directToHomePage();
        }
    })
    .catch(authError => console.error('Authentication failed:', authError));
}

function userIsAuthenticated() {
    return !!localStorage.getItem('api_key');
}

function processLogout() {
    localStorage.removeItem('api_key'); 
    localStorage.removeItem('member_id');
    localStorage.removeItem('member_username'); 

    redirectToLogin();
}

function redirectToLogin() {
    history.pushState({ page: 'loginSignup' }, 'Login/Signup', '/login-signup');
    showLoginSignupView();
}

function showLoginSignupView() {
    const loginScreen = document.getElementById('access-form'); 
    loginScreen.style.display = 'block';
}

function directToHomePage() {
    history.pushState({ page: 'default' }, 'Home', '/');
    showHomePage();
}

function showHomePage() {
    const channelOverview = document.querySelector('.nav-channel'); 
    channelOverview.style.display = 'block';
}


document.addEventListener('click', evt => {
    const clickedElement = evt.target;
    const targetChannelId = clickedElement.getAttribute('data-channel');

    if (targetChannelId) {
        switchToChannel(targetChannelId);
    }

    if (clickedElement.hasAttribute('data-back')) {
        goBack();
    }

    if (clickedElement.hasAttribute('data-logout')) {
        processLogout();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const unauthUI = document.getElementById('hidden-ui');  
    const authUI = document.getElementById('logged-in-ui'); 
    
    const channelsDisplay = document.querySelector('.nav-channel');  
    const messageArea = document.querySelector('.chat-messages'); 

    if (userIsAuthenticated()) {
        unauthUI.style.display = 'none';
        authUI.style.display = 'block';
        channelsDisplay.style.display = 'block';
        messageArea.style.display = 'block';
        retrieveUnreadMessageCounts();
    } else {
        unauthUI.style.display = 'block';
        authUI.style.display = 'none';
        channelsDisplay.style.display = 'none';
        messageArea.style.display = 'none';
    }
});

window.addEventListener('popstate', evt => {
    const currentState = evt.state;

    if (currentState && currentState.channel) {
        switchToChannel(currentState.channel);
    } else if (currentState && currentState.page === 'loginSignup') {
        showLoginSignupView();
    } else {
        showHomePage();
    }
});
