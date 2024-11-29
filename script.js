// Use Luxon's DateTime
const { DateTime } = luxon;

const CITIES = [
    { name: "London, UK", zone: "Europe/London" },
    { name: "New York, USA", zone: "America/New_York" },
    { name: "Los Angeles, USA", zone: "America/Los_Angeles" },
    { name: "Tokyo, Japan", zone: "Asia/Tokyo" },
    { name: "Sydney, Australia", zone: "Australia/Sydney" },
    { name: "Dubai, UAE", zone: "Asia/Dubai" },
    { name: "Singapore", zone: "Asia/Singapore" },
    { name: "Hong Kong", zone: "Asia/Hong_Kong" },
    { name: "Paris, France", zone: "Europe/Paris" },
    { name: "Berlin, Germany", zone: "Europe/Berlin" },
    { name: "Mumbai, India", zone: "Asia/Kolkata" },
    { name: "Beijing, China", zone: "Asia/Shanghai" },
    { name: "Toronto, Canada", zone: "America/Toronto" },
    { name: "São Paulo, Brazil", zone: "America/Sao_Paulo" },
    { name: "Moscow, Russia", zone: "Europe/Moscow" },
    { name: "Amsterdam, Netherlands", zone: "Europe/Amsterdam" },
    { name: "Seoul, South Korea", zone: "Asia/Seoul" },
    { name: "Istanbul, Turkey", zone: "Europe/Istanbul" },
    { name: "Bangkok, Thailand", zone: "Asia/Bangkok" },
    { name: "Vancouver, Canada", zone: "America/Vancouver" },
    { name: "Auckland, New Zealand", zone: "Pacific/Auckland" },
    { name: "Honolulu, USA", zone: "Pacific/Honolulu" },
    { name: "Anchorage, USA", zone: "America/Anchorage" },
    { name: "Denver, USA", zone: "America/Denver" },
    { name: "Chicago, USA", zone: "America/Chicago" },
    { name: "Phoenix, USA", zone: "America/Phoenix" },
    { name: "Mexico City, Mexico", zone: "America/Mexico_City" },
    { name: "Buenos Aires, Argentina", zone: "America/Argentina/Buenos_Aires" },
    { name: "Reykjavik, Iceland", zone: "Atlantic/Reykjavik" },
    { name: "Cairo, Egypt", zone: "Africa/Cairo" },
    { name: "Jerusalem, Israel", zone: "Asia/Jerusalem" },
    { name: "Baghdad, Iraq", zone: "Asia/Baghdad" },
    { name: "Tehran, Iran", zone: "Asia/Tehran" },
    { name: "Karachi, Pakistan", zone: "Asia/Karachi" },
    { name: "Dhaka, Bangladesh", zone: "Asia/Dhaka" },
    { name: "Jakarta, Indonesia", zone: "Asia/Jakarta" },
    { name: "Perth, Australia", zone: "Australia/Perth" },
    { name: "Adelaide, Australia", zone: "Australia/Adelaide" },
    { name: "Brisbane, Australia", zone: "Australia/Brisbane" },
    { name: "Noumea, New Caledonia", zone: "Pacific/Noumea" }
].sort((a, b) => {
    const offsetA = DateTime.now().setZone(a.zone).offset;
    const offsetB = DateTime.now().setZone(b.zone).offset;
    return offsetA - offsetB;
});

let selectedCities = JSON.parse(localStorage.getItem('selectedCities')) || CITIES.slice(0, 4);
let currentHour = DateTime.now().hour;

function saveToLocalStorage() {
  localStorage.setItem('selectedCities', JSON.stringify(selectedCities));
}

function populateCityDropdown() {
    const citySelect = document.getElementById('citySelect');
    const homeSelect = document.getElementById('homeSelect');
    
    citySelect.innerHTML = '<option value="">Add a city...</option>';
    homeSelect.innerHTML = '<option value="">Select home city...</option>';
    
    CITIES.forEach(city => {
        const now = DateTime.now().setZone(city.zone);
        const offset = now.offset / 60;
        const optionText = `${city.name} (UTC${offset >= 0 ? '+' : ''}${offset})`;
        const optionValue = JSON.stringify({ name: city.name, zone: city.zone });
        
        // Add to city select
        const cityOption = document.createElement('option');
        cityOption.value = optionValue;
        cityOption.textContent = optionText;
        citySelect.appendChild(cityOption);
        
        // Add to home select
        const homeOption = document.createElement('option');
        homeOption.value = optionValue;
        homeOption.textContent = optionText;
        homeSelect.appendChild(homeOption);
    });
}

function getWorkingHoursClass(dateTime) {
    const hour = dateTime.hour;
    if (hour >= 9 && hour < 17) return 'working-hours';
    if (hour >= 7 && hour < 9 || hour >= 17 && hour < 19) return 'extended-hours';
    return 'outside-hours';
}

function formatHour(dateTime) {
    return dateTime.toFormat('HH:mm');
}

function removeCity(cityName) {
  if (selectedCities.length > 1) {
    selectedCities = selectedCities.filter(city => city.name !== cityName);
    saveToLocalStorage();
    renderTable();
    updateCitySelect();
  }
}

function renderTable() {
    const headerRow = document.getElementById('headerRow');
    const tableBody = document.getElementById('tableBody');
    
    // Render headers
    headerRow.innerHTML = selectedCities.map(city => `
        <th style="width: ${100/selectedCities.length}%">
            <div class="city-header">
                <div class="city-info">
                    <span>${city.name}</span>
                </div>
                ${selectedCities.length > 1 ? 
                    `<button class="remove-city" onclick="removeCity('${city.name}')">×</button>` : 
                    ''}
            </div>
        </th>
    `).join('');

    // Get 6 AM for the home city (first city in selectedCities)
    const homeCity = selectedCities[0];
    const startTime = DateTime.now().setZone(homeCity.zone)
        .startOf('day')
        .plus({ hours: 6 });

    // Render body
    tableBody.innerHTML = Array.from({ length: 24 }, (_, i) => {
        const rowTime = startTime.plus({ hours: i });
        const isCurrentHour = rowTime.hasSame(DateTime.now().setZone(homeCity.zone), 'hour');

        return `
            <tr class="${isCurrentHour ? 'current-time' : ''}">
                ${selectedCities.map(city => {
                    const cityTime = rowTime.setZone(city.zone);
                    return `
                        <td style="width: ${100/selectedCities.length}%;" class="${getWorkingHoursClass(cityTime)}">
                            <div class="time">${formatHour(cityTime)}</div>
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    }).join('');
}

// Event Listeners
document.getElementById('homeSelect').addEventListener('change', (e) => {
    if (!e.target.value) return;
    
    const cityData = JSON.parse(e.target.value);
    selectedCities[0] = cityData;
    saveToLocalStorage();
    renderTable();
    populateCityDropdown();
    e.target.value = '';
});

document.getElementById('citySelect').addEventListener('change', (e) => {
    if (!e.target.value) return;
    
    const cityData = JSON.parse(e.target.value);
    if (!selectedCities.find(city => city.name === cityData.name)) {
        // Add the new city
        selectedCities.push(cityData);
        
        // Sort all cities except the home city (index 0)
        const homeCity = selectedCities[0];
        const homeOffset = DateTime.now().setZone(homeCity.zone).offset;
        
        const sortedCities = [
            homeCity,
            ...selectedCities.slice(1).sort((a, b) => {
                const offsetA = DateTime.now().setZone(a.zone).offset - homeOffset;
                const offsetB = DateTime.now().setZone(b.zone).offset - homeOffset;
                return offsetB - offsetA;
            })
        ];
        
        selectedCities = sortedCities;
        saveToLocalStorage();
        renderTable();
        populateCityDropdown();
    }
    e.target.value = '';
});

// Update current time
setInterval(() => {
    const newHour = DateTime.now().hour;
    if (newHour !== currentHour) {
        currentHour = newHour;
        renderTable();
    }
}, 60000);

// Initial render
renderTable();
populateCityDropdown();
