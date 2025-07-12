const apiKey = "adfd369215144a8294685728243011"; // Replace with your WeatherAPI key
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const refreshBtn = document.getElementById("refreshBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const forecast = document.getElementById("forecast");
const unitToggle = document.getElementById("unitToggle");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const forecastTitle = document.getElementById("forecastTitle");

let isCelsius = true;
let lastQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  
  if (localStorage.getItem("unitPref") === "fahrenheit") {
    isCelsius = false;
    unitToggle.checked = true;
  }
  
  const lastLocation = localStorage.getItem("lastLocation");
  if (lastLocation) {
    cityInput.value = lastLocation;
    fetchWeather(lastLocation);
  }
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city === "") {
    showError("Please enter a city name!");
    return;
  }
  fetchWeather(city);
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      error => {
        hideLoading();
        showError("Unable to retrieve your location. Please enable location services.");
      }
    );
  } else {
    showError("Geolocation is not supported by your browser.");
  }
});

refreshBtn.addEventListener("click", () => {
  if (lastQuery) {
    fetchWeather(lastQuery);
  } else {
    showError("No location to refresh. Please search first.");
  }
});

unitToggle.addEventListener("change", () => {
  isCelsius = !isCelsius;
  localStorage.setItem("unitPref", isCelsius ? "celsius" : "fahrenheit");
  if (lastQuery) {
    fetchWeather(lastQuery);
  }
});

cityInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

async function fetchWeather(query) {
  showLoading();
  lastQuery = query;
  localStorage.setItem("lastLocation", query);
  
  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${query}&aqi=no`),
      fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=5&aqi=no&alerts=no`)
    ]);
    
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    if (currentData.error || forecastData.error) {
      const error = currentData.error || forecastData.error;
      showError(error.message);
      return;
    }
    
    displayWeather(currentData);
    displayForecast(forecastData.forecast.forecastday);
    hideLoading();
    showContent();
  } catch (error) {
    showError("Error fetching weather data. Please try again later.");
    hideLoading();
  }
}

function displayWeather(data) {
  const { location, current } = data;
  const temperature = isCelsius ? current.temp_c : current.temp_f;
  const windSpeed = isCelsius ? current.wind_kph : current.wind_mph;
  const windUnit = isCelsius ? "kph" : "mph";
  const visibility = isCelsius ? current.vis_km : current.vis_miles;
  const visibilityUnit = isCelsius ? "km" : "miles";
  
  document.getElementById("location").textContent = `${location.name}, ${location.country}`;
  document.getElementById("currentDate").textContent = new Date(location.localtime).toLocaleDateString("en-US", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById("weatherIcon").src = current.condition.icon;
  document.getElementById("weatherIcon").alt = current.condition.text;
  document.getElementById("weatherCondition").textContent = current.condition.text;
  document.getElementById("temperature").textContent = `${temperature}°${isCelsius ? "C" : "F"}`;
  document.getElementById("humidity").textContent = `${current.humidity}%`;
  document.getElementById("wind").textContent = `${windSpeed} ${windUnit} ${current.wind_dir}`;
  document.getElementById("pressure").textContent = `${current.pressure_mb} mb`;
  document.getElementById("visibility").textContent = `${visibility} ${visibilityUnit}`;
}

function displayForecast(forecastDays) {
  forecast.innerHTML = "";
  forecastTitle.classList.remove("d-none");
  
  forecastDays.forEach(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: 'short' });
    
    const card = document.createElement("div");
    card.className = "col-6 col-sm-4 col-md-3 col-lg-2 forecast-card";
    card.innerHTML = `
      <h5>${dayName}</h5>
      <p class="small">${date.toLocaleDateString()}</p>
      <img src="${day.day.condition.icon}" alt="${day.day.condition.text}" class="forecast-icon">
      <p class="my-1">${day.day.condition.text}</p>
      <p class="fw-bold">${isCelsius ? day.day.avgtemp_c : day.day.avgtemp_f}°${isCelsius ? "C" : "F"}</p>
      <div class="d-flex justify-content-between small">
        <span><i class="fas fa-temperature-high"></i> ${isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f}°</span>
        <span><i class="fas fa-temperature-low"></i> ${isCelsius ? day.day.mintemp_c : day.day.mintemp_f}°</span>
      </div>
    `;
    forecast.appendChild(card);
  });
}

function showLoading() {
  loadingIndicator.classList.remove("d-none");
  weatherResult.classList.add("d-none");
  forecastTitle.classList.add("d-none");
  errorMessage.classList.add("d-none");
}

function hideLoading() {
  loadingIndicator.classList.add("d-none");
}

function showContent() {
  weatherResult.classList.remove("d-none");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("d-none");
  weatherResult.classList.add("d-none");
  forecastTitle.classList.add("d-none");
  hideLoading();
}

document.addEventListener('contextmenu', (e) => e.preventDefault());

function ctrlShiftKey(e, keyCode) {
  return e.ctrlKey && e.shiftKey && e.keyCode === keyCode.charCodeAt(0);
}

document.onkeydown = (e) => {
  if (
    event.keyCode === 123 ||
    ctrlShiftKey(e, 'I') ||
    ctrlShiftKey(e, 'J') ||
    ctrlShiftKey(e, 'C') ||
    (e.ctrlKey && e.keyCode === 'U'.charCodeAt(0))
  ) {
    return false;
  }
};