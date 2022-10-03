const fs = require('fs');
const crypto = require('crypto');

const API_URL = "https://www.googleapis.com/webfonts/v1/webfonts?key=";
const API_KEY = process.env.GOOGLE_FONTS_API_KEY;

function calculateHash (somestring){
    return crypto.createHash('md5').update(somestring).digest('hex').toString();
};

async function updateFiles () {
    let newApiData;
    let newData;

    try {
        newApiData = await fetch(`${API_URL}${API_KEY}`);
        newData = await newApiData.json();
    } catch (error) {
        console.error("❎  Error fetching the Google Fonts API:", error);
        return;
    }

    if ( newData.items ) {
        const newDataString = JSON.stringify(newData, null, 2);

        const oldFileData = fs.readFileSync('./assets/google-fonts/fallback-fonts-list.json', 'utf8');
        const oldData = JSON.parse(oldFileData);
        const oldDataString = JSON.stringify(oldData, null, 2);

        if ( calculateHash(newDataString) !== calculateHash(oldDataString) ) {
            fs.writeFileSync('./assets/google-fonts/fallback-fonts-list.json', newDataString);
            console.info("✅  Google Fonts JSON file updated");
        } else {
            console.info("ℹ️  Google Fonts JSON file is up to date");
        }

    } else {
        console.error("❎  No new data to check. Check the Google Fonts API key.");
    }
}


updateFiles ();