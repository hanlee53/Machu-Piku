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

async function tournament(arr, tournamentFormat) {
    const left = document.querySelector(".left"),
          right = document.querySelector(".right");
        
    let leftNumber = Math.floor(Math.random() * tournamentFormat),
        rightNumber = Math.floor(Math.random() * tournamentFormat),
        leftPlayer = arr[leftNumber],
        rightPlayer = arr[rightNumber];
    
    while (leftPlayer.tournamentFormat == 0) {
        leftNumber = Math.floor(Math.random() * tournamentFormat);
        leftPlayer = arr[leftNumber];
    }

    while (rightPlayer.tournamentFormat == 0) {
        rightNumber = Math.floor(Math.random() * tournamentFormat);
        rightPlayer = arr[rightNumber];
    }

    left.innerHTML = `<img id="left_img" src="${leftPlayer.imgSrc}" alt="${leftPlayer.name}"> ${leftPlayer.name}`;
    right.innerHTML = `<img id=right_img" src="${arr[rightNumber].imgSrc}" alt="${arr[rightNumber].name}"> ${arr[rightNumber].name}`;


    console.log(arr); // For test, can be deleted later. 
}



async function main() {
    const players = await shuffleTournamentList("source/csv/ManUtd_Players.csv", 64);
    tournament(players, 64);
}

main();
