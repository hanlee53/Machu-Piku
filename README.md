# Machu-Piku

Welcome to Machu-Piku, a full-stack web application that simulates a bracket-style tournament.

This application allows a user to start a tournament by choosing a concept and the number of contenders. It then repeatedly presents two contenders, allowing the user to vote for their preferred option. This process continues through each round of the bracket until a single winner remains.

The project is still under development. Right now, it only has a tournament for football players, which is what the Machu-Piku team loves! 

The application is powered by a **Node.js** backend using the **Express.js** framework to serve a RESTful API. All tournament data, image information, and user votes are stored in a **Supabase** (PostgreSQL) database. The backend handles the core logic for fetching contender pairs (`GET /pair`), recording votes (`POST /vote`), and retrieving user voting history (`GET /me/votes`).

---

# How to Run This Project

## 1. Navigate to the Backend Directory
All commands must be run from within the `backend` folder of the project.

```cd backend```

## 2. Install Dependencies
Install the required Node.js packages using npm.

```npm install```

## 3. Configure Environment Variables
The server needs to connect to a Supabase project.
1. Create a file named `.env` inside the `backend` directory.
2. Copy the following content into your new `.env` file:

```
SUPABASE_URL=ADD_YOUR_URL
SUPABASE_SERVICE_ROLE_KEY=ADD_YOUR_KEY
PORT=8787
```

3. Replace ADD_YOUR_URL with your Supabase project URL.
4. Replace ADD_YOUR_KEY with your Supabase service role key.

## 4. Start the Server
Run the start script defined in `package.json`.

The server will start, and you should see the following message in your console:

```API listening on http://localhost:8787```

---

# To Be Further Developed
## Full User Authentication 
Implement a proper user login system (e.g., email/password or social logins) using Supabase Auth. Replace the simple userId and allow users to save their tournament progress and view their voting history across devices.

## User-Generated Tournaments (Currently under development)
Allow authenticated users to create and name their own tournaments, including uploading their own images and contender names.