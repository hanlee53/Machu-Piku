let sourceCsvFile;

/*  Read the csv file and create a nested array [
                                                [name1, imgSrc1], 
                                                [name2, imgSrc2], 
                                                ...
                                                ]
*/

async function readCSV(sourceCsvFile, tournamentFormat) {
    const response = await fetch(sourceCsvFile);
    const text = await response.text();
    
    let contender_list = [];
    // Simple parsing into rows & columns
    const rows = text.split("\n");

    for (let i = 2; i < rows.length; ++i) {
        let player_profile = rows[i],
            idx = player_profile.indexOf(","),
            name = player_profile.slice(0, idx).trim(),
            imgSrc = player_profile.slice(idx + 1).trim();
        
        if (imgSrc.startsWith('"') && imgSrc.endsWith('"')) {
            imgSrc = imgSrc.slice(1, -1); // remove first and last char
        }
    
        const player = {name, imgSrc};
        player[tournamentFormat] = 1;

        for (let i = tournamentFormat / 2; i >= 1; i /= 2) {
            player[i] = 0;
        }
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
        let randomNumber = Math.floor(Math.random() * tournamentFormat);
        let player = contender_list[randomNumber];

        if (!players.includes(player)) {
            players.push(player);
        } 
    }   
    return players;
}

function renderLeftAndRight(leftPlayer, rightPlayer) {
    const left = document.querySelector(".left"),
          right = document.querySelector(".right");


    left.innerHTML = `<img id="left_img" src="${leftPlayer.imgSrc}" alt="${leftPlayer.name}"> <h1>${leftPlayer.name}</h1>`;
    right.innerHTML = `<img id=right_img" src="${rightPlayer.imgSrc}" alt="${rightPlayer.name}"> <h1>${rightPlayer.name}</h1>`;
}


function tournament(players, number, tournamentFormat, winners) {
    console.log(number);
    console.log(tournamentFormat);

    const left = document.querySelector(".left"),
          right = document.querySelector(".right"),
          title = document.querySelector(".status-bar");

    console.log(winners);
    if (number >= tournamentFormat / 2) {
        return;
    }

    leftPlayer = players[number];
    rightPlayer = players[tournamentFormat - 1 - number];

    title.innerHTML = `<p>Round ${tournamentFormat} &nbsp ${number}/${tournamentFormat / 2} </p>`;
    renderLeftAndRight(leftPlayer, rightPlayer);

    left.onclick = () => {
        if (!winners.includes(leftPlayer)) {
            winners.push(leftPlayer);
        }

        if (number + 1 >= tournamentFormat / 2) {
        // round done → start next with winners
            if (winners.length === 1) {
                alert(`🏆 The winner is ${winners[0].name}!`);
            } else {
                tournament(winners, 0, winners.length, []); // new round
            }
        } else {
        tournament(players, number + 1, tournamentFormat, winners);
        }
    };

    right.onclick = () => {
        winners.push(rightPlayer);
        
        if (number + 1 >= tournamentFormat / 2) {
            console.log("finished");
            if (winners.length === 1) {
                alert(`🏆 The winner is ${winners[0].name}!`);
            } else {
                c(winners, 0, winners.length, []); // new round
            }
        } else {
        c(players, number + 1, tournamentFormat, winners);
        }
    };
}


async function main() {
    const winners = [];
    const players = await shuffleTournamentList("source/csv/ManUtd_Players.csv", 64);
    console.log(players);
    let result = tournament(players, 0, 64, winners);
}

main();
