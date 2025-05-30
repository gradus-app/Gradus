# 💚 Gradus Dating App

Ласкаво просимо до Gradus Dating App – простого веб-додатку для знайомств, створеного за допомогою HTML, CSS, JavaScript та Supabase. Цей додаток дозволяє користувачам реєструватися, створювати профілі, "свайпати" інших користувачів, знаходити збіги та спілкуватися в чаті.

## ✨ Live Demo
Ви можете переглянути робочу версію додатку тут:
[https://gradus.github.io/gradus-app/](https://gradus.github.io/gradus-app/)

## 🚀 Особливості
* **Автентифікація користувачів:** Реєстрація та вхід за допомогою Supabase Auth.
* **Управління профілем:** Створення та редагування особистого профілю (ім'я, вік, улюблені напої, теми для спілкування, стать, кого шукаєте, фото профілю).
* **Система "свайпів":** Перегляд профілів інших користувачів та вираження "лайків" або "дизлайків".
* **Збіги (Matches):** Перегляд користувачів, які "лайкнули" один одного.
* **Чат:** Обмін повідомленнями з користувачами, з якими є збіг.
* **Простий та зрозумілий інтерфейс.**

## 🛠️ Технології
* **Фронтенд:**
    * HTML5
    * CSS3
    * JavaScript (ванільний JS)
* **Бекенд/База даних/Автентифікація:**
    * [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Auth, Storage)

## ⚙️ Налаштування проекту (для локального запуску)

Щоб запустити цей проект локально, виконайте наступні кроки:

1.  **Клонуйте репозиторій:**
    ```bash
    git clone [https://github.com/gradus/gradus-app.git](https://github.com/gradus/gradus-app.git)
    cd gradus-app
    ```

2.  **Налаштуйте проект Supabase:**
    * Створіть новий проект на [Supabase Dashboard](https://supabase.com/dashboard).
    * Перейдіть до **`Settings -> API Keys`** та скопіюйте ваш `Project URL` та `anon public` key.
    * Створіть наступні таблиці в **`Table Editor`** та налаштуйте RLS-політики згідно з інструкціями в [посібнику](https://github.com/gradus/gradus-app/blob/main/docs/SUPABASE_SETUP.md) (якщо створиш окремий файл).

    * **Таблиця `profiles`:**
        * `id`: `uuid`, `Primary Key`, `Default Value: gen_random_uuid()`
        * `user_id`: `uuid`, `Not Null`, `Foreign Key` до `auth.users.id`
        * `username`: `text`, `Not Null`
        * `age`: `integer`, `Nullable`
        * `favorite_drink`: `text`, `Nullable`
        * `communication_topics`: `text`, `Nullable`
        * `avatar_url`: `text`, `Nullable`
        * `gender`: `text`, `Nullable` (`male`, `female`, `other`)
        * `looking_for_gender`: `text`, `Nullable` (`male`, `female`, `both`)
        * `created_at`: `timestamp with time zone`, `Default Value: now()`

    * **Таблиця `likes`:**
        * `id`: `uuid`, `Primary Key`, `Default Value: gen_random_uuid()`
        * `from_user_id`: `uuid`, `Not Null`, `Foreign Key` до `auth.users.id`
        * `to_user_id`: `uuid`, `Not Null`, `Foreign Key` до `auth.users.id`
        * `type`: `text`, `Not Null` (`like`, `dislike`)
        * `created_at`: `timestamp with time zone`, `Default Value: now()`

    * **Таблиця `messages`:**
        * `id`: `uuid`, `Primary Key`, `Default Value: gen_random_uuid()`
        * `sender_id`: `uuid`, `Not Null`, `Foreign Key` до `auth.users.id`
        * `receiver_id`: `uuid`, `Not Null`, `Foreign Key` до `auth.users.id`
        * `content`: `text`, `Not Null`
        * `created_at`: `timestamp with time zone`, `Default Value: now()`

3.  **Оновіть `script.js`:**
    * Відкрийте `script.js`.
    * Замініть заповнювачі `SUPABASE_URL` та `SUPABASE_ANON_KEY` на ваші реальні ключі з проекту Supabase:
    ```javascript
    const SUPABASE_URL = 'https://ldzctuyvlsgehebnqwwk.supabase.co'; // Наприклад: '[https://yeijxripzjlvxprmbavi.supabase.co](https://yeijxripzjlvxprmbavi.supabase.co)'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkemN0dXl2bHNnZWhlYm5xd3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MTA5NTAsImV4cCI6MjA2NDE4Njk1MH0.gfPOQl-1sHvgZ2eO7GRsQgcdYU7isXgjg2g-SbpWB0g'; // Наприклад: 'eyJhbGciOiJIUzI1NiIsIn...
    ```

4.  **Відкрийте `index.html` у браузері:**
    * Просто відкрийте файл `index.html` у вашому улюбленому веб-браузері.
    * Або використовуйте розширення "Live Server" для VS Code для зручної розробки.

## 📝 Використання
1.  **Реєстрація/Вхід:** На головній сторінці виберіть "Вхід / Реєстрація".
2.  **Створення Профілю:** Після входу перейдіть до "Мій Профіль" та заповніть інформацію про себе.
3.  **Свайпи:** Перейдіть до "Свайпи", щоб переглядати профілі інших користувачів та взаємодіяти з ними.
4.  **Збіги та Чат:** У розділі "Збіги" ви побачите користувачів, які також "лайкнули" вас. Клацніть на збіг, щоб розпочати розмову.

## 🔮 Майбутні Плани
* Можливість завантаження фотографій безпосередньо у Supabase Storage.
* Розширений пошук та фільтрація профілів.
* Сповіщення про нові збіги та повідомлення.
* Покращений UI/UX.

## 🤝 Внески
Внески вітаються! Якщо у вас є пропозиції щодо покращення або ви знайшли помилку, будь ласка, відкрийте "Issue" або "Pull Request".

## 📄 Ліцензія
Цей проект ліцензовано під ліцензією MIT. Дивіться файл [LICENSE](LICENSE) для отримання додаткової інформації.
