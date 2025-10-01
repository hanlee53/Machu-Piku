let sourceCsvFile;

// Back to index.html
function returnHome() {
    window.location.href = "index.html";
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
        let randomNumber = Math.floor(Math.random() * contender_list.length);
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
    right.innerHTML = `<img id=right_img" src="${rightPlayer.imgSrc}" alt="${rightPlayer.name}"> <h1>${rightPlayer.name}</h1>`;
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
                returnHome()
            } else {
                tournament(winners, 0, winners.length, []); // new round
            }
        } else {
        tournament(players, number + 1, tournamentFormat, winners); // continue until the next round
        }
    };
}


async function main() {
    const winners = [];
    document.getElementById("tournamentFormat-form").addEventListener("submit", async function (event) {
        // stop the page from reloading
        event.preventDefault(); 
    
        // the tournamentFormat is what user has selected: 64,32,16.
        const tournamentFormat = parseInt(document.getElementById("tournamentFormat").value, 10);
        
        // Run the tournament
        const players = await shuffleTournamentList("source/csv/ManUtd_Players.csv", tournamentFormat);
        tournament(players, 0, tournamentFormat, winners); 

        // Hide the select menu after the userInput
        document.getElementById("tournamentFormat-form").innerHTML = `<form id="tournamentFormat-form" style="display: hidden;">`;
    });
}

main();
