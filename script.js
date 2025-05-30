// --- Supabase Client Initialization ---
const SUPABASE_URL = 'https://ldzctuyvlsgehebnqwwk.supabase.co'; // <--- Твій Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldWp4cmlwenpsdnhwcm1iYXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODg4MTgsImV4cCI6MTczMjY0MDg1OH0.kE5E-example-key'; // <--- Твій anon public key з API Keys

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const appContainer = document.getElementById('app-container');
const navLoginBtn = document.getElementById('nav-login-btn');
const navProfileBtn = document.getElementById('nav-profile-btn');
const navSwipeBtn = document.getElementById('nav-swipe-btn');
const navMatchesBtn = document.getElementById('nav-matches-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');

let currentUser = null; // Зберігатиме поточного користувача
let currentProfileData = null; // Зберігатиме дані профілю поточного користувача

// --- Utility Functions ---
function displayMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    appContainer.prepend(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000); // Повідомлення зникає через 5 секунд
}

function showLoader() {
    appContainer.innerHTML = '<p>Завантаження...</p>';
}

function hideLoader() {
    // В ідеалі, це виклик видалить завантажувач після завантаження вмісту
}

// --- Navigation & UI Updates ---
async function updateUI(session) {
    currentUser = session?.user || null;
    if (currentUser) {
        navLoginBtn.style.display = 'none';
        navProfileBtn.style.display = 'inline-block';
        navSwipeBtn.style.display = 'inline-block';
        navMatchesBtn.style.display = 'inline-block';
        navLogoutBtn.style.display = 'inline-block';
        // Завантажити профіль користувача при вході
        await fetchUserProfile();
    } else {
        navLoginBtn.style.display = 'inline-block';
        navProfileBtn.style.display = 'none';
        navSwipeBtn.style.display = 'none';
        navMatchesBtn.style.display = 'none';
        navLogoutBtn.style.display = 'none';
        renderAuthForm(); // Показати форму входу/реєстрації
    }
}

// --- Authentication ---
async function handleAuth(event, type) {
    event.preventDefault();
    showLoader();
    const email = event.target.email.value;
    const password = event.target.password.value;
    let authResponse;

    if (type === 'signup') {
        authResponse = await supabase.auth.signUp({ email, password });
    } else { // type === 'login'
        authResponse = await supabase.auth.signInWithPassword({ email, password });
    }

    const { data, error } = authResponse;

    if (error) {
        displayMessage('error', `Помилка автентифікації: ${error.message}`);
    } else {
        if (type === 'signup') {
            displayMessage('success', 'Реєстрація успішна! Перевірте свою пошту для підтвердження.');
        } else {
            displayMessage('success', 'Вхід успішний!');
            await updateUI(data.session);
        }
    }
    hideLoader();
}

async function handleLogout() {
    showLoader();
    const { error } = await supabase.auth.signOut();
    if (error) {
        displayMessage('error', `Помилка виходу: ${error.message}`);
    } else {
        displayMessage('success', 'Ви вийшли з системи.');
        await updateUI(null); // Оновити UI для неавторизованого стану
    }
    hideLoader();
}

// --- Profile Management ---
async function fetchUserProfile() {
    if (!currentUser) return;
    showLoader();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 - означає, що запис не знайдено (тобто профіль ще не створений)
        displayMessage('error', `Помилка завантаження профілю: ${error.message}`);
        currentProfileData = null; // Скинути дані профілю
        renderProfileForm(); // Якщо профіль не знайдено, показати форму створення
    } else if (data) {
        currentProfileData = data;
        renderProfileDisplay(); // Якщо профіль знайдено, показати його
    } else {
        currentProfileData = null; // Профіль не знайдено, потрібно створити
        renderProfileForm(); // Показати форму для створення профілю
    }
    hideLoader();
}

async function saveProfile(event) {
    event.preventDefault();
    showLoader();
    const username = event.target.username.value;
    const age = parseInt(event.target.age.value);
    const favorite_drink = event.target.favorite_drink.value;
    const communication_topics = event.target.communication_topics.value;
    const avatar_url = event.target.avatar_url.value;
    const gender = event.target.gender.value;
    const looking_for_gender = event.target.looking_for_gender.value;

    const profileData = {
        user_id: currentUser.id,
        username,
        age,
        favorite_drink,
        communication_topics,
        avatar_url,
        gender,
        looking_for_gender
    };

    let response;
    if (currentProfileData) {
        // Оновлення існуючого профілю
        response = await supabase
            .from('profiles')
            .update(profileData)
            .eq('user_id', currentUser.id);
    } else {
        // Створення нового профілю
        response = await supabase
            .from('profiles')
            .insert([profileData]);
    }

    const { error } = response;

    if (error) {
        displayMessage('error', `Помилка збереження профілю: ${error.message}`);
    } else {
        displayMessage('success', 'Профіль успішно збережено!');
        await fetchUserProfile(); // Перезавантажити профіль для оновлення UI
    }
    hideLoader();
}

// --- Swiping Logic ---
let swipeableProfiles = [];
let currentSwipeIndex = 0;

async function fetchSwipeableProfiles() {
    showLoader();
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', currentUser.id) // Не показувати власний профіль
        .limit(10); // Обмежити для тестування

    if (error) {
        displayMessage('error', `Помилка завантаження профілів для свайпу: ${error.message}`);
        swipeableProfiles = [];
    } else {
        swipeableProfiles = profiles;
        currentSwipeIndex = 0;
        renderSwipeCard(); // Відобразити перший профіль
    }
    hideLoader();
}

async function handleSwipe(type) {
    if (currentSwipeIndex >= swipeableProfiles.length) {
        displayMessage('info', 'Більше немає профілів для свайпу. Спробуйте пізніше!');
        return;
    }

    const swipedProfile = swipeableProfiles[currentSwipeIndex];
    showLoader(); // Показати завантажувач, поки "лайк" зберігається

    const { error } = await supabase
        .from('likes')
        .insert([{
            from_user_id: currentUser.id,
            to_user_id: swipedProfile.user_id,
            type: type // 'like' or 'dislike'
        }]);

    if (error) {
        displayMessage('error', `Помилка збереження свайпу: ${error.message}`);
    } else {
        // Додаємо затримку, щоб користувач бачив завантаження, перш ніж картка зміниться
        setTimeout(() => {
            currentSwipeIndex++;
            if (currentSwipeIndex < swipeableProfiles.length) {
                renderSwipeCard();
            } else {
                appContainer.innerHTML = '<p class="message info">Більше немає профілів для свайпу. Спробуйте пізніше!</p>';
            }
            hideLoader(); // Сховати завантажувач після обробки свайпу
        }, 500); // Затримка 0.5 секунди
    }
    // Якщо є помилка, hideLoader() вже було викликано у блоці if (error)
    if (!error) hideLoader();
}


// --- Matches Logic ---
async function fetchMatches() {
    showLoader();
    // Отримати "лайки", де поточний користувач є отримувачем (to_user_id) і тип 'like'
    const { data: incomingLikes, error: incomingError } = await supabase
        .from('likes')
        .select('from_user_id')
        .eq('to_user_id', currentUser.id)
        .eq('type', 'like');

    if (incomingError) {
        displayMessage('error', `Помилка завантаження вхідних лайків: ${incomingError.message}`);
        hideLoader();
        return;
    }

    const likedByMeUserIds = incomingLikes.map(like => like.from_user_id);

    // Отримати "лайки", де поточний користувач є відправником (from_user_id) і тип 'like'
    const { data: outgoingLikes, error: outgoingError } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', currentUser.id)
        .eq('type', 'like');

    if (outgoingError) {
        displayMessage('error', `Помилка завантаження вихідних лайків: ${outgoingError.message}`);
        hideLoader();
        return;
    }

    const myLikedUserIds = outgoingLikes.map(like => like.to_user_id);

    // Знайти збіги (користувачі, яких я "лайкнув" і які "лайкнули" мене)
    const matchedUserIds = myLikedUserIds.filter(userId => likedByMeUserIds.includes(userId));

    if (matchedUserIds.length === 0) {
        appContainer.innerHTML = '<p class="message info">У вас поки немає збігів. Продовжуйте свайпати!</p>';
        hideLoader();
        return;
    }

    // Отримати профілі збігів
    const { data: matchedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', matchedUserIds);

    if (profilesError) {
        displayMessage('error', `Помилка завантаження профілів збігів: ${profilesError.message}`);
    } else {
        renderMatches(matchedProfiles);
    }
    hideLoader();
}

// --- Chat Logic ---
let currentChatPartnerId = null;
let currentChatPartnerUsername = '';

async function fetchMessages(partnerId) {
    showLoader();
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true }); // Сортувати за часом

    if (error) {
        displayMessage('error', `Помилка завантаження повідомлень: ${error.message}`);
        appContainer.innerHTML = 'Виберіть збіг, щоб почати чат.';
    } else {
        renderChat(currentChatPartnerUsername, data);
    }
    hideLoader();
}

async function sendMessage(event) {
    event.preventDefault();
    if (!currentChatPartnerId || !currentUser) {
        displayMessage('error', 'Немає співрозмовника для відправки повідомлення.');
        return;
    }

    const messageInput = event.target.messageInput;
    const content = messageInput.value.trim();

    if (!content) return;

    const { error } = await supabase
        .from('messages')
        .insert([{
            sender_id: currentUser.id,
            receiver_id: currentChatPartnerId,
            content: content
        }]);

    if (error) {
        displayMessage('error', `Помилка відправки повідомлення: ${error.message}`);
    } else {
        messageInput.value = ''; // Очистити поле вводу
        await fetchMessages(currentChatPartnerId); // Перезавантажити чат
    }
}

// --- Render Functions (UI specific) ---
function renderAuthForm() {
    appContainer.innerHTML = `
        <h2>Вхід / Реєстрація</h2>
        <form id="login-form" class="auth-form">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Пароль" required>
            <button type="submit">Увійти</button>
        </form>
        <p>Немає акаунту? <a href="#" id="show-signup">Зареєструватися</a></p>
        <form id="signup-form" class="auth-form" style="display:none;">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Пароль" required>
            <button type="submit">Зареєструватися</button>
        </form>
    `;
    document.getElementById('login-form').addEventListener('submit', (e) => handleAuth(e, 'login'));
    document.getElementById('signup-form').addEventListener('submit', (e) => handleAuth(e, 'signup'));
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'flex';
        document.getElementById('show-signup').style.display = 'none';
    });
}

function renderProfileForm() {
    const profile = currentProfileData || {};
    appContainer.innerHTML = `
        <h2>${profile.id ? 'Редагувати' : 'Створити'} Профіль</h2>
        <form id="profile-form" class="profile-form">
            <label for="username">Ім'я користувача:</label>
            <input type="text" id="username" name="username" value="${profile.username || ''}" required>

            <label for="age">Вік:</label>
            <input type="number" id="age" name="age" value="${profile.age || ''}">

            <label for="favorite_drink">Улюблений напій:</label>
            <input type="text" id="favorite_drink" name="favorite_drink" value="${profile.favorite_drink || ''}">

            <label for="communication_topics">Теми для спілкування:</label>
            <textarea id="communication_topics" name="communication_topics">${profile.communication_topics || ''}</textarea>

            <label for="avatar_url">Посилання на фото профілю:</label>
            <input type="url" id="avatar_url" name="avatar_url" value="${profile.avatar_url || ''}" placeholder="URL зображення">

            <label for="gender">Ваша стать:</label>
            <select id="gender" name="gender" required>
                <option value="">Виберіть</option>
                <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>Чоловіча</option>
                <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>Жіноча</option>
                <option value="other" ${profile.gender === 'other' ? 'selected' : ''}>Інша</option>
            </select>

            <label for="looking_for_gender">Шукаю:</label>
            <select id="looking_for_gender" name="looking_for_gender" required>
                <option value="">Виберіть</option>
                <option value="male" ${profile.looking_for_gender === 'male' ? 'selected' : ''}>Чоловіка</option>
                <option value="female" ${profile.looking_for_gender === 'female' ? 'selected' : ''}>Жінку</option>
                <option value="both" ${profile.looking_for_gender === 'both' ? 'selected' : ''}>Чоловіка та Жінку</option>
            </select>

            <button type="submit">Зберегти Профіль</button>
        </form>
    `;
    document.getElementById('profile-form').addEventListener('submit', saveProfile);
}

function renderProfileDisplay() {
    if (!currentProfileData) {
        appContainer.innerHTML = '<p class="message info">Профіль не знайдено. Будь ласка, створіть свій профіль.</p>';
        return;
    }
    const p = currentProfileData;
    appContainer.innerHTML = `
        <div class="profile-display">
            <img src="${p.avatar_url || 'https://via.placeholder.com/150'}" alt="${p.username}">
            <h2>${p.username}, ${p.age}</h2>
            <p><strong>Улюблений напій:</strong> ${p.favorite_drink || 'Не вказано'}</p>
            <p><strong>Теми для спілкування:</strong> ${p.communication_topics || 'Не вказано'}</p>
            <p><strong>Стать:</strong> ${p.gender || 'Не вказано'}</p>
            <p><strong>Шукаю:</strong> ${p.looking_for_gender || 'Не вказано'}</p>
            <button class="edit-profile-btn auth-form" style="background-color: #007bff;">Редагувати Профіль</button>
        </div>
    `;
    document.querySelector('.edit-profile-btn').addEventListener('click', renderProfileForm);
}

function renderSwipeCard() {
    if (swipeableProfiles.length === 0 || currentSwipeIndex >= swipeableProfiles.length) {
        appContainer.innerHTML = '<p class="message info">Більше немає профілів для свайпу. Спробуйте пізніше або оновіть сторінку!</p>';
        return;
    }

    const profile = swipeableProfiles[currentSwipeIndex];
    appContainer.innerHTML = `
        <div class="swipe-card">
            <img src="${profile.avatar_url || 'https://via.placeholder.com/200'}" alt="${profile.username}">
            <h2>${profile.username}, ${profile.age}</h2>
            <p><strong>Улюблений напій:</strong> ${profile.favorite_drink || 'Не вказано'}</p>
            <p><strong>Теми для спілкування:</strong> ${profile.communication_topics || 'Не вказано'}</p>
            <p><strong>Стать:</strong> ${profile.gender || 'Не вказано'}</p>
            <p><strong>Шукаю:</strong> ${profile.looking_for_gender || 'Не вказано'}</p>
            <div class="swipe-actions">
                <button class="dislike" data-type="dislike">❌</button>
                <button class="like" data-type="like">❤️</button>
            </div>
        </div>
    `;
    document.querySelector('.dislike').addEventListener('click', () => handleSwipe('dislike'));
    document.querySelector('.like').addEventListener('click', () => handleSwipe('like'));
}

function renderMatches(matches) {
    if (matches.length === 0) {
        appContainer.innerHTML = '<p class="message info">У вас поки немає збігів. Продовжуйте свайпати!</p>';
        return;
    }

    let matchesHtml = '<h2>Ваші Збіги</h2><div class="matches-list">';
    matches.forEach(match => {
        matchesHtml += `
            <div class="match-item" data-user-id="${match.user_id}" data-username="${match.username}">
                <img src="${match.avatar_url || 'https://via.placeholder.com/80'}" alt="${match.username}">
                <h3>${match.username}</h3>
                <p>${match.age || 'N/A'} років</p>
            </div>
        `;
    });
    matchesHtml += '</div>';
    appContainer.innerHTML = matchesHtml;

    document.querySelectorAll('.match-item').forEach(item => {
        item.addEventListener('click', (e) => {
            currentChatPartnerId = e.currentTarget.dataset.userId;
            currentChatPartnerUsername = e.currentTarget.dataset.username;
            fetchMessages(currentChatPartnerId);
        });
    });
}

function renderChat(partnerUsername, messages) {
    let chatHtml = `
        <h2>Чат з ${partnerUsername}</h2>
        <div class="message-container" id="chat-messages">
            </div>
        <form id="chat-form" class="chat-form">
            <textarea id="messageInput" name="messageInput" placeholder="Введіть ваше повідомлення..." rows="3" required></textarea>
            <button type="submit">Відправити</button>
        </form>
    `;
    appContainer.innerHTML = chatHtml;

    const chatMessagesDiv = document.getElementById('chat-messages');
    messages.forEach(msg => {
        const messageClass = msg.sender_id === currentUser.id ? 'sent' : '';
        const senderName = msg.sender_id === currentUser.id ? 'Ви' : partnerUsername;
        const formattedTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatMessagesDiv.innerHTML += `
            <div class="message-item ${messageClass}">
                <strong>${senderName}</strong>
                <p>${msg.content}</p>
                <small>${formattedTime}</small>
            </div>
        `;
    });
    // Прокрутити донизу
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

    document.getElementById('chat-form').addEventListener('submit', sendMessage);
}

// --- Event Listeners ---
navLoginBtn.addEventListener('click', renderAuthForm);
navProfileBtn.addEventListener('click', fetchUserProfile);
navSwipeBtn.addEventListener('click', fetchSwipeableProfiles);
navMatchesBtn.addEventListener('click', fetchMatches);
navLogoutBtn.addEventListener('click', handleLogout);

// --- Initial Load ---
supabase.auth.getSession().then(({ data: { session } }) => {
    updateUI(session);
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session);
});

