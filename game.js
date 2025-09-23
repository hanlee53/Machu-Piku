let sourceCsvFile;

// Read the csv file and create a nested array [
//                                              [name1, imgSrc1], 
//                                              [name2, imgSrc2], 
//                                              ...
//                                             ]
async function readCSV(sourceCsvFile) {
    const response = await fetch(sourceCsvFile);
    const text = await response.text();
    
    let contender_list = [];
    // Simple parsing into rows & columns
    const rows = text.split("\n");

    for (let i = 2; i < rows.length; ++i) {
        let player_profile = rows[i];
        let player_profile_list = player_profile.split(",");
        let id = player_profile_list[0],
            name = player_profile_list[1],
            imgSrc = player_profile_list[2],
            license = player_profile_list[3];
        
        contender_list.push([name, imgSrc]);
    }

    return contender_list;
}

// Create random number from 0 to TournamentFormat - 1. Need to fix this. 
function generateRandomNumber(tournamentFormat) {
    let min = 0;
    let max = tournamentFormat;

    let randomNumber = Math.floor(Math.random() * max);
    
    return randomNumber;
}

async function shuffleTournamentList(srcToCsv, tournamentFormat) {
    const contender_list = await readCSV(srcToCsv);
    let players = [];

    while (players.length < tournamentFormat) {
        let randomNumber = generateRandomNumber(tournamentFormat);
        let player = contender_list[randomNumber];

        if (!players.includes(player)) {
            players.push(player);
        }
    }
    console.log(players);
    
}




shuffleTournamentList("source/csv/ManUtd_Players.csv", 64);
  

