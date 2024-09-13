import fetch from 'node-fetch';
const googleSheetsUrl = 'https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec';

const apiUrl = 'https://api.artic.edu/api/v1/artworks';
const limit = 100;
const totalArtworks = 500;
const fields = 'id,api_link,title,date_display,artist_title,term_titles';

let collectedArtworks = [];

async function fetchArtworks() {
    let page = 1;

    while (collectedArtworks.length < totalArtworks) {
        const response = await fetch(`${apiUrl}?fields=${fields}&limit=${limit}&page=${page}&sort=date_display`);
        const data = await response.json();

        collectedArtworks = collectedArtworks.concat(data.data);

        if (data.data.length < limit) {
            break;
        }

        page++;
    }

    collectedArtworks.sort((a, b) => {
        const artistA = a.artist_title ? a.artist_title.toLowerCase() : "";
        const artistB = b.artist_title ? b.artist_title.toLowerCase() : "";
        return artistA.localeCompare(artistB);
    });

    const filteredArtworks = collectedArtworks.filter(artwork => {
        return artwork.term_titles && artwork.term_titles.some(term =>
            term.toLowerCase().includes('oil painting') ||
            term.toLowerCase().includes('oil') ||
            term.toLowerCase().includes('painting')
        );
    });

    await sendToGoogleSheets(filteredArtworks);
}

async function sendToGoogleSheets(artworks) {
    const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(artworks.map(artwork => ({
            id: artwork.id,
            api_link: artwork.api_link,
            title: artwork.title,
            date_display: artwork.date_display,
            artist_title: artwork.artist_title,
            term_titles: artwork.term_titles.join(', ')
        })))
    });

    if (response.ok) {
        console.log('Data successfully sent to Google Sheets');
    } else {
        console.error('Failed to send data to Google Sheets');
    }
}

fetchArtworks();