const apiUrl = 'https://api.lyrics.ovh';

const searchInput = document.getElementById('search-input');
const results = document.getElementById('results');
const lyricsDiv = document.getElementById('lyrics');
const lyricsInfo = document.getElementById('lyrics-info');
const errorElement = document.getElementById('error');

let timeoutSuggest;

searchInput.addEventListener('input', function() {
    // Wait for the user to stop typing before showing suggestions
    if (timeoutSuggest) clearTimeout(timeoutSuggest);
    timeoutSuggest = setTimeout(suggestions, 500);
});

function removeResults() {
    while (results.firstChild) results.removeChild(results.firstChild);
    results.classList.add('hidden');
}

async function suggestions() {
    const searchVal = searchInput.value.trim();

    if (!searchVal) {
        removeResults();
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/suggest/${searchVal}`);
        const data = await response.json();

        removeResults();

        const finalResults = [];
        const seenResults = [];

        data.data.forEach(result => {
            if (seenResults.length >= 5) return;

            const t = `${result.title} - ${result.artist.name}`;
            if (seenResults.includes(t)) return;

            seenResults.push(t);
            finalResults.push({
                display: t,
                artist: result.artist.name,
                title: result.title
            });
        });

        const previewPromises = finalResults.map(async result => {
            try {
                const response = await fetch(`${apiUrl}/v1/${result.artist}/${result.title}`);
                const data = await response.json();
                return { ...result, preview: data.lyrics.split('\n').slice(0, 2).join(' ') + "..." };
            } catch (error) {
                return { ...result, preview: 'No lyrics found for this song' };
            }
        });

        const finalResultsWithPreviews = await Promise.all(previewPromises);

        finalResultsWithPreviews.forEach(result => {
            const li = document.createElement('li');
            li.classList.add('cursor-pointer', 'hover:bg-gray-700', 'p-2', 'mb-2', 'flex', 'flex-col');
            li.innerHTML = `
                <div class="text-lg">${result.display}</div>
                <div class="text-sm text-gray-400">${result.preview}</div>
            `;

            results.appendChild(li);

            li.addEventListener('click', () => songLyrics(result));
        });

        if (finalResultsWithPreviews.length > 0) results.classList.remove('hidden');

    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

async function songLyrics(song) {
    removeResults();
    lyricsDiv.innerHTML = '';
    lyricsInfo.classList.add('hidden');

    try {
        const response = await fetch(`${apiUrl}/v1/${song.artist}/${song.title}`);
        const data = await response.json();

        lyricsDiv.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${song.display}</h3>
            <div>${data.lyrics.replace(/\n/g, '<br />')}</div>
        `;

    } catch (error) {
        lyricsDiv.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${song.display}</h3>
            <div>No lyrics for this song</div>
        `;
    }

    lyricsInfo.classList.remove('hidden');
}
