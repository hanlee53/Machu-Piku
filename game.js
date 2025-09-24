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

        for (let i = tournamentFormat / 2; i >= 2; i /= 2) {
            player[i] = 0;
        }

        contender_list.push(player);
    }

    return contender_list;
}

// Create random number from 0 to maxNumber
function generateRandomNumber(maxNumber) {
    let min = 0;
    let max = maxNumber;

    let randomNumber = Math.floor(Math.random() * max);
    
    return randomNumber;
}


async function shuffleTournamentList(srcToCsv, tournamentFormat) {
    const contender_list = await readCSV(srcToCsv, tournamentFormat); 
    let players = [];

    //Always put the top 5 players
    for (let i = 0; i < 5; ++i) {
        players.push(contender_list[i]);
    }

    // randomly select players upto tournament format (16,32,64)
    while (players.length < tournamentFormat) {
        let randomNumber = generateRandomNumber(contender_list.length);
        let player = contender_list[randomNumber];

        if (!players.includes(player)) {
            players.push(player);
        } 
    }   
    return players;
}

async function createTournament(srcToCsv, tournamentFormat) {
    const players = await shuffleTournamentList(srcToCsv, tournamentFormat);
    const left = document.querySelector(".left"),
        right = document.querySelector(".right"),
          
        left_img = document.getElementById("left_img"),
        right_img = document.getElementById("right_img"),
          
        leftNumber = generateRandomNumber(tournamentFormat),
        rightNumber = generateRandomNumber(tournamentFormat),
          
        left_player = players[leftNumber],
        right_player = players[rightNumber],
          
        leftImgSrc = left_player.imgSrc,
        rightImgSrc = right_player.imgSrc,

        leftName = left_player.name,
        rightName = right_player.name;



    if (players.length == 1) {
        console.log("Winner is {players[0].name}");
        return;
    }

    
    left_img.src = leftImgSrc;
    right_img.src = rightImgSrc;

    console.log(players);
}


createTournament("source/csv/ManUtd_Players.csv", 64);

