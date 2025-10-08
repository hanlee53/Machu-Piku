let sourceCsvFile;

// Back to index.html
function returnHome() {
    window.location.href = "result.html";
}

async function readCSV(sourceCsvFile, tournamentFormat) {
    const response = await fetch(sourceCsvFile);
    const text = await response.text();
    
    let contender_list = [];
    // Simple parsing into rows & columns
    const rows = text.split("\n");

    // Push players into the list in such format -> {{name, imgSrc}, {name, imgSrc}, ...}
    for (let i = 2; i < rows.length; ++i) {
        let player_profile = rows[i],
            idx = player_profile.indexOf(","),
            name = player_profile.slice(0, idx).trim(),
            imgSrc = player_profile.slice(idx + 1).trim();
        
        if (imgSrc.startsWith('"') && imgSrc.endsWith('"')) {
            imgSrc = imgSrc.slice(1, -1); // remove first and last char
        }
    
        const player = {name, imgSrc};
        contender_list.push(player);
    }
    return contender_list;
}

// select contenders for the tournament
async function shuffleTournamentList(srcToCsv, tournamentFormat) {
    const contender_list = await readCSV(srcToCsv, tournamentFormat);
    let players = [];

    //Always put the top 5 players
    for (let i = 0; i < 5; ++i) {
        players.push(contender_list[i]);
    }

    // randomly select players upto tournament format (16,32,64)
    while (players.length < tournamentFormat) {
        let randomNumber = Math.floor(Math.random() * (contender_list.length - 1));
        let player = contender_list[randomNumber];

        if (!players.includes(player)) {
            players.push(player);
        } 
    }   
    return players;
}

// Display left and right players' image and name
function renderLeftAndRight(leftPlayer, rightPlayer) {
    const left = document.querySelector(".left"),
          right = document.querySelector(".right");

    left.innerHTML = `<img id="left_img" src="${leftPlayer.imgSrc}" alt="${leftPlayer.name}"> <h1>${leftPlayer.name}</h1>`;
    right.innerHTML = `<img id="right_img" src="${rightPlayer.imgSrc}" alt="${rightPlayer.name}"> <h1>${rightPlayer.name}</h1>`;

}

// Run the tournament
function tournament(players, number, tournamentFormat, winners) {
    const left = document.querySelector(".left"),
          right = document.querySelector(".right"),
          title = document.querySelector(".status-bar");
          

    leftPlayer = players[number]; // Starts from the first player of the list
    rightPlayer = players[tournamentFormat - 1 - number]; // Starts from the last player of the list
    
    title.innerHTML = `<p>Round ${tournamentFormat} &nbsp ${number}/${tournamentFormat / 2} </p>`;
    renderLeftAndRight(leftPlayer, rightPlayer);

    
    // When left player is selected
    left.onclick = () => {
        winners.push(leftPlayer); // Selected player in the winners list.

        

        // if the round is over
        if (number + 1 >= tournamentFormat / 2) {
            if (winners.length === 1) { // display the winner if there is only one winner
                alert(`The winner is ${winners[0].name}!`); 

                const champion = winners[0];
                localStorage.setItem('champion', JSON.stringify({        
                id: champion.id || null,
                name: champion.name || '',
                imgSrc: champion.imgSrc || ''
            }));

                returnHome();
            } else {
                tournament(winners, 0, winners.length, []); // new round
            }
        } else {
        tournament(players, number + 1, tournamentFormat, winners); // continue until the next round
        }
    };

    // When right player is selected
    right.onclick = () => {
        winners.push(rightPlayer); // Selected player in the winners list
        
        if (number + 1 >= tournamentFormat / 2) {
            if (winners.length === 1) { // display the winner if there is only one winner
                alert(`The winner is ${winners[0].name}!`);

                const champion = winners[0];
                localStorage.setItem('champion', JSON.stringify({
                id: champion.id || null,
                name: champion.name || '',
                imgSrc: champion.imgSrc || ''
            }));
                
                returnHome()
            } else {
                tournament(winners, 0, winners.length, []); // new round
            }
        } else {
        tournament(players, number + 1, tournamentFormat, winners); // continue until the next round
        }
    };

}

const USE_SERVER_MODE = true;

// Han
window.addEventListener('DOMContentLoaded', () => {
    enableServerMode();
});

if (USE_SERVER_MODE) enableServerMode();
else mainTournamentMode(); // your existing code that calls tournament()


// Server mode: pairwise stream from backend
function enableServerMode() {
  const leftEl  = document.querySelector('.left');
  const rightEl = document.querySelector('.right');

  // When user clicks, submit vote using the IDs we just rendered
  leftEl.onclick  = () => currentPair && sendVoteAndNext(currentPair.left.id);
  rightEl.onclick = () => currentPair && sendVoteAndNext(currentPair.right.id);

  // First pair
  loadPairFromServer();
}

// Call this instead of your tournament() boot
enableServerMode();


// Test

// === Backend integration (Supabase-backed API) ===
const API_BASE = 'http://localhost:8787'; // change to your deployed URL later

// simple per-browser user id
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = (self.crypto && crypto.randomUUID) ? crypto.randomUUID()
                                              : Math.random().toString(36).slice(2);
  localStorage.setItem('userId', userId);
}

// the current pair from the API
let currentPair = null;

async function loadPairFromServer() {
  const resp = await fetch(`${API_BASE}/pair`);
  if (!resp.ok) {
    console.error('Failed to load pair:', await resp.text());
    return;
  }
  currentPair = await resp.json();

  // Your render helper expects {name, imgSrc}
  const leftPlayer  = { name: currentPair.left.title || '',  imgSrc: currentPair.left.url,  id: currentPair.left.id };
  const rightPlayer = { name: currentPair.right.title || '', imgSrc: currentPair.right.url, id: currentPair.right.id };

  // Reuse your existing UI renderer
  renderLeftAndRight(leftPlayer, rightPlayer);
}

async function sendVoteAndNext(winnerId) {
  if (!currentPair) return;
  const body = {
    userId,
    leftId: currentPair.left.id,
    rightId: currentPair.right.id,
    winnerId,
    decidedInMs: 0
  };

  const resp = await fetch(`${API_BASE}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    // The server returns 200 even on duplicate pair-votes; only real errors will be !ok + body text.
    console.warn('Vote error:', await resp.text());
  }

  // Load the next pair immediately
  await loadPairFromServer();
}
// Test


async function main() {
    const winners = [];
    document.getElementById("tournamentFormat-form").addEventListener("submit", async function (event) {
        // stop the page from reloading
        event.preventDefault(); 
    
        // the tournamentFormat is what user has selected: 64,32,16.
        const tournamentFormat = parseInt(document.getElementById("tournamentFormat").value, 10);
        
        // Run the tournament
        const left = document.querySelector(".left"),
            right = document.querySelector(".right"),
            nav = document.querySelector(".status-bar"),
            or = document.querySelector(".or");
        
            const players = await shuffleTournamentList("source/csv/ManUtd_Players.csv", tournamentFormat);
        tournament(players, 0, tournamentFormat, winners); 
        
        left.classList.toggle("active");
        right.classList.toggle("active");
        nav.classList.toggle("active");
        or.classList.toggle("active");

        // Hide the select menu after the userInput
        document.getElementById("tournamentFormat-form").innerHTML = `<form id="tournamentFormat-form" style="display: hidden;">`;
    });
}

main();
