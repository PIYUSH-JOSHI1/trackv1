
const mainContent = document.getElementById('mainContent');
const navItems = document.querySelectorAll('.nav-item');
let isDarkMode = true;
let isOnline = true;

const pages = {
    dashboard: `
        <h1>AI Traffic Control System</h1>
        
        <!-- System Status -->
        <div class="system-status">
            <div class="status-card">
                <div class="status-indicator" id="connectionStatus"></div>
                <span>Backend: <span id="backendStatus">Connecting...</span></span>
            </div>
            <div class="status-card">
                <span>System Mode: <span id="systemMode">Auto</span></span>
                <button id="modeSwitch" class="button">Switch to Manual</button>
            </div>
            <div class="status-card">
                <span>Emergency Mode: <span id="emergencyMode">Normal</span></span>
                <button id="emergencyBtn" class="button emergency-btn">🚨 Emergency Override</button>
            </div>
        </div>

        <!-- Camera Feed Toggle -->
        <div class="feed-toggle-section">
            <h3>Camera Feeds:</h3>
            <div class="feed-toggle-buttons">
                <button class="feed-toggle active" data-feed="0" onclick="toggleVideoFeed(0)">Camera 1 (ON)</button>
                <button class="feed-toggle" data-feed="1" onclick="toggleVideoFeed(1)">Camera 2 (OFF)</button>
                <button class="feed-toggle" data-feed="2" onclick="toggleVideoFeed(2)">Camera 3 (OFF)</button>
                <button class="feed-toggle" data-feed="3" onclick="toggleVideoFeed(3)">Camera 4 (OFF)</button>
            </div>
        </div>

        <!-- Video Feeds with Real-time Data -->
        <div class="video-grid" id="videoGrid">
            ${[1, 2, 3, 4].map(i => `
                <div class="video-card" id="video-card-${i-1}" style="display: ${i === 1 ? 'flex' : 'none'};">
                    <div class="video-container" id="video-container-${i-1}">
                        <img id="video-feed-${i-1}" class="video-feed" alt="Video Feed ${i}" 
                             src="" onerror="handleVideoError(${i-1})">
                        <div class="video-overlay">
                            <div class="signal-light" id="signal-${i-1}">
                                <div class="light red" id="red-${i-1}"></div>
                                <div class="light yellow" id="yellow-${i-1}"></div>
                                <div class="light green" id="green-${i-1}"></div>
                            </div>
                            <div class="video-controls">
                                <button class="fullscreen-btn" onclick="toggleFullscreen(${i-1})" title="Fullscreen">⛶</button>
                            </div>
                        </div>
                        <div class="video-error" id="video-error-${i-1}" style="display: none;">
                            <p>Feed ${i} Unavailable</p>
                            <button onclick="retryVideoFeed(${i-1})" class="button">Retry</button>
                        </div>
                    </div>
                    
                    <div class="video-info">
                        <h3>Junction ${i}</h3>
                        
                        <!-- Vehicle Count Display -->
                        <div class="vehicle-stats">
                            <div class="stat-item">
                                <span class="stat-label">🚗 Vehicles:</span>
                                <span class="stat-value" id="count-${i-1}">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">🚦 Signal:</span>
                                <span class="stat-value signal-state" id="signal-state-${i-1}">GREEN</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">⏱️ Green Time:</span>
                                <span class="stat-value" id="green-time-${i-1}">30s</span>
                            </div>
                        </div>

                        <!-- Traffic Density Progress -->
                        <div class="density-indicator">
                            <label>Traffic Density:</label>
                            <div class="progress-bar">
                                <div class="progress-fill" id="density-${i-1}" style="width: 0%;"></div>
                            </div>
                            <span class="density-text" id="density-text-${i-1}">Low</span>
                        </div>

                        <!-- Alert System -->
                        <div class="alert-section">
                            <div class="alert-display" id="alert-${i-1}"></div>
                            <div class="control-buttons">
                                <button class="button alert-btn" onclick="sendTrafficAlert(${i-1})">🚨 Traffic Alert</button>
                                <button class="button ambulance-btn" onclick="ambulanceOverride(${i-1})">🚑 Ambulance</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- Global Controls -->
        <div class="global-controls">
            <button class="button" onclick="startAllFeeds()">▶️ Start All Feeds</button>
            <button class="button" onclick="stopAllFeeds()">⏸️ Stop All Feeds</button>
            <button class="button" onclick="resetSystem()">🔄 Reset System</button>
            <button class="button" onclick="exportData()">📊 Export Data</button>
        </div>
    `,
    reports: `
        <h1>Reports</h1>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${[1, 2, 3, 4].map(i => `
                <div class="card">
                    <h2>Junction ${i} Report</h2>
                    <canvas id="predictionChart${i}"></canvas>
                    <canvas id="densityChart${i}"></canvas>
                    <canvas id="congestionChart${i}"></canvas>
                </div>
            `).join('')}
        </div>
    `,
    settings: `
        <h1>Settings</h1>
        <div class="card">
            <h2>Theme</h2>
            <label class="switch">
                <input type="checkbox" id="themeSwitch" ${isDarkMode ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <span id="themeStatus">Dark Mode</span>
        </div>
        <div class="card">
            <h2>📺 Video Sources</h2>
            <div style="margin-bottom: 20px;">
                <h3>YouTube Video Upload</h3>
                <p style="color: #888; font-size: 12px;">Paste your YouTube video link below to stream it with traffic predictions</p>
                <input type="text" id="youtubeUrl" placeholder="https://youtu.be/9vPVPVKWcAk" 
                       style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Select Feed:</label>
                        <select id="feedSelect" style="width: 100%; padding: 8px; border-radius: 4px;">
                            <option value="0">Feed 1 (North)</option>
                            <option value="1">Feed 2 (East)</option>
                            <option value="2">Feed 3 (South)</option>
                            <option value="3">Feed 4 (West)</option>
                        </select>
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <button class="button" onclick="loadYoutubeVideo()" style="width: 100%; background: #4CAF50; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            🎬 Load YouTube Video
                        </button>
                    </div>
                </div>
                
                <div id="youtubeStatus" style="margin-top: 10px; padding: 10px; border-radius: 4px; display: none;">
                </div>
            </div>
        </div>
        <div class="card">
            <h2>Notification Settings</h2>
            <label>
                <input type="checkbox" id="emailNotifications" checked>
                Email Notifications
            </label>
            <br>
            <label>
                <input type="checkbox" id="smsNotifications" checked>
                SMS Notifications
            </label>
        </div>
        <div class="card">
            <h2>Data Refresh Rate</h2>
            <select id="refreshRate">
                <option value="5000">5 seconds</option>
                <option value="10000" selected>10 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
            </select>
        </div>
    `,
    help: `
    <h1>Help Center</h1>
    <div class="card">
        <h2>Frequently Asked Questions</h2>
        <ul class="faq-list">
            <li class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(this)">
                    How do I interpret the traffic density data? <span class="arrow">↓</span>
                </div>
                <div class="faq-answer" style="display: none;">
                    Traffic density refers to the number of vehicles on a road section within a particular time. Higher density usually implies slower traffic flow, while lower density means smoother movement. The data helps optimize traffic management decisions.
                </div>
            </li>
            <li class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(this)">
                    What do the different congestion levels mean? <span class="arrow">↓</span>
                </div>
                <div class="faq-answer" style="display: none;">
                    Congestion levels are based on traffic data and are categorized as follows:
                    <ul>
                        <li><strong>Low:</strong> Free-flowing traffic.</li>
                        <li><strong>Moderate:</strong> Some slowdowns but manageable.</li>
                        <li><strong>High:</strong> Significant delays, possible backups.</li>
                        <li><strong>Severe:</strong> Traffic jams or gridlock.</li>
                    </ul>
                </div>
            </li>
            <li class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(this)">
                    How can I customize my dashboard view? <span class="arrow">↓</span>
                </div>
                <div class="faq-answer" style="display: none;">
                    You can customize the dashboard by selecting the widgets and data metrics you want to prioritize. Simply navigate to the settings and use the drag-and-drop feature to rearrange the layout as per your needs.
                </div>
            </li>
            <li class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(this)">
                    What should I do if I notice a technical issue? <span class="arrow">↓</span>
                </div>
                <div class="faq-answer" style="display: none;">
                    In case of technical issues, click the "Report Issue" button located in the dashboard. You will be prompted to describe the problem. Our technical team will review the report and get back to you.
                </div>
            </li>
            <li class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(this)">
                    How do I switch between Online and Manual modes? <span class="arrow">↓</span>
                </div>
                <div class="faq-answer" style="display: none;">
                    Switching between Online and Manual modes is simple. Click on "Switch to Online/Manual Mode," verify your email, provide a reason, and confirm the switch. This ensures secure transitions between modes.
                </div>
            </li>
        </ul>
    </div>

    <div class="card">
        <h2>Switching Between Online and Manual Modes</h2>
        <div class="faq-item">
            <div class="faq-question" onclick="toggleFAQ(this)">
                How to switch between modes <span class="arrow">↓</span>
            </div>
            <div class="faq-answer" style="display: none;">
                <p>To switch between Online and Manual modes:</p>
                <ol>
                    <li>Click the "Switch to Online/Manual Mode" button on the dashboard.</li>
                    <li>A dialog box will appear asking for authentication.</li>
                    <li>Enter your email address and provide a reason for switching modes.</li>
                    <li>Optionally, check the box to send a report to the developer.</li>
                    <li>Click "Confirm Switch" to complete the process.</li>
                </ol>
                <p>This process ensures that mode switches are authenticated and logged for security purposes.</p>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>Contact Support</h2>
        <div class="faq-item">
            <div class="faq-question" onclick="toggleFAQ(this)">
                How to reach support <span class="arrow">↓</span>
            </div>
            <div class="faq-answer" style="display: none;">
                <div class="contact-info">
                    <p>For assistance, please contact the IT department:</p>
                    <p>Email: it-support@police.gov.in</p>
                    <p>Phone: 1800-123-4567</p>
                    <p>Available 24/7</p>
                </div>
            </div>
        </div>
    </div>
`,
    profile: `
        <h1>Officer Profile</h1>
        <div class="card" style="display: flex; align-items: center;">
            <img src="https://placekitten.com/200/200" alt="Officer Rajesh Kumar" style="width: 100px; height: 100px; border-radius: 50%; margin-right: 20px;">
            <div>
                <h2>Rajesh Kumar</h2>
                <p><strong>Badge Number:</strong> IPS-2345</p>
                <p><strong>Rank:</strong> Sub-Inspector</p>
                <p><strong>Station:</strong> Central Police Station, Mumbai</p>
                <p><strong>Years of Service:</strong> 8</p>
                <p><strong>Specialization:</strong> Traffic Management</p>
            </div>
        </div>
        <div class="card">
            <h2>Performance Metrics</h2>
            <canvas id="performanceChart"></canvas>
        </div>
        <div class="card">
            <h2>Recent Activities</h2>
            <ul>
                <li>Completed advanced traffic management course - 15/09/2023</li>
                <li>Received commendation for managing Diwali traffic - 12/11/2023</li>
                <li>Implemented new traffic signal optimization system - 03/01/2024</li>
            </ul>
        </div>
    `,
    weather: `
        <h1>Weather Information</h1>
        <div class="card" style="display: flex; align-items: center;">
            <div id="mainWeatherIcon" class="weather-icon">🌤️</div>
            <div>
                <h2>Current Weather</h2>
                <p>Temperature: <span id="mainTemperature">--</span>°C</p>
                <p>Condition: <span id="mainCondition">--</span></p>
                <p>Humidity: <span id="humidity">--</span>%</p>
                <p>Wind Speed: <span id="windSpeed">--</span> km/h</p>
            </div>
        </div>
        <div class="card">
            <h2>Weather Map</h2>
            <div id="weatherMap" style="height: 300px; background-color: #ccc;">Weather Map Placeholder</div>
        </div>
        <div class="card">
            <h2>Weather Impact on Traffic</h2>
            <p>Current weather conditions may affect traffic flow. Please adjust traffic management strategies accordingly.</p>
            <canvas id="weatherImpactChart"></canvas>
        </div>
    `,
    inspectors: `
        <h1>Traffic Inspectors</h1>
        <div class="inspector-list">
            ${[1, 2, 3, 4].map(i => `
                <div class="inspector-card">
                    <h3>Junction ${i}</h3>
                    <p>Current Inspectors: <span id="currentInspectors${i}">3</span></p>
                    <p>New Assignments: <span id="newAssignments${i}">1</span></p>
                    <button class="add-inspector-btn" onclick="openAddInspectorModal(${i})">Add Inspector</button>
                    <button class="button" onclick="removeInspector(${i})">Remove Inspector</button>
                    <div id="inspectorList${i}"></div>
                </div>
            `).join('')}
        </div>
    `,
    map: `
        <h1>Map View</h1>
        <div class="card">
            <div id="junctionMap" style="height: 400px; background-color: #ccc;">
                <!-- Temporary map with junction markers -->
                ${[1, 2, 3, 4].map(i => `
                    <div style="position: absolute; left: ${20 + i * 20}%; top: ${20 + i * 15}%; width: 20px; height: 20px; background-color: red; border-radius: 50%;" onclick="showJunctionVideo(${i})"></div>
                    <div id="videoFeed${i}" style="display: none; position: absolute; width: 200px; height: 150px; background-color: #000; border: 2px solid white; color: white; text-align: center; line-height: 150px;">Video Feed ${i}</div>
                `).join('')}
            </div>
        </div>
    `
};










// Get DOM elements
const sidebar = document.getElementById('sidebar');

const toggleBtn = document.getElementById('toggleBtn');

// Function to toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle('closed');
    sidebar.classList.toggle('open');
    mainContent.classList.toggle('full-width');
}

// Event listener for toggle button
toggleBtn.addEventListener('click', toggleSidebar);

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth <= 768;
    const clickedOutsideSidebar = !sidebar.contains(e.target) && e.target !== toggleBtn;
    
    if (isMobile && clickedOutsideSidebar && !sidebar.classList.contains('closed')) {
        toggleSidebar();
    }
});

// Adjust layout on window resize
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && sidebar.classList.contains('closed')) {
        sidebar.classList.remove('closed');
        mainContent.classList.remove('full-width');
    } else if (isMobile && !sidebar.classList.contains('closed')) {
        sidebar.classList.add('closed');
        mainContent.classList.add('full-width');
    }
});

// Run initial layout adjustment
window.dispatchEvent(new Event('resize'));

// ... (rest of your existing JavaScript code)



// Function to toggle FAQ answers
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const arrow = element.querySelector('.arrow');
    const allFAQs = document.querySelectorAll('.faq-item');

    // Close all other FAQs
    allFAQs.forEach(faq => {
        const faqAnswer = faq.querySelector('.faq-answer');
        const faqArrow = faq.querySelector('.arrow');

        if (faq !== element.parentElement) {
            faqAnswer.classList.remove('active'); // Hide other answers
            faqArrow.textContent = '↓'; // Reset arrow to down
        }
    });

    // Toggle current FAQ
    if (answer.classList.contains('active')) {
        answer.classList.remove('active'); // Hide the answer
        arrow.textContent = '↓'; // Set arrow down
    } else {
        answer.classList.add('active'); // Show the answer
        arrow.textContent = '↑'; // Set arrow up
    }
}

function setActivePage(pageId) {
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    mainContent.innerHTML = pages[pageId];

    if (pageId === 'dashboard') {
        initializeDashboard();
        // Initialize traffic system after dashboard is loaded
        setTimeout(() => {
            initializeTrafficSystem();
        }, 500);
    } else if (pageId === 'reports') {
        initializeReports();
    } else if (pageId === 'weather') {
        updateWeatherInfo();
        createWeatherImpactChart();
    } else if (pageId === 'profile') {
        createPerformanceChart();
    } else if (pageId === 'inspectors') {
        updateInspectorLists();
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const pageId = item.getAttribute('data-page');
        setActivePage(pageId);
    });
});

function initializeDashboard() {
    const modeSwitch = document.getElementById('modeSwitch');
    const systemMode = document.getElementById('systemMode');

    modeSwitch.addEventListener('click', () => {
        openModeSwitch();
    });

    // Simulate real-time updates
    setInterval(() => {
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`congestion${i}`).textContent = Math.floor(Math.random() * 100) + '%';
            document.getElementById(`flow${i}`).textContent = Math.floor(Math.random() * 100) + '%';
            document.getElementById(`incidents${i}`).textContent = Math.floor(Math.random() * 100) + '%';
        }
    }, 5000);
}

// ... (previous code remains the same)

function openModeSwitch() {
    const email = prompt("Enter your email for authentication:");
    if (email) {
        if (isValidEmail(email)) {
            const reason = prompt("Provide a reason for switching modes:");
            if (reason) {
                const confirmReport = confirm("Do you want to send a report to the developer?");
                isOnline = !isOnline;
                document.getElementById('systemMode').textContent = isOnline ? 'Online' : 'Manual';
                document.getElementById('modeSwitch').textContent = `Switch to ${isOnline ? 'Manual' : 'Online'} Mode`;
                
                if (confirmReport) {
                    sendReportToDeveloper(email, reason, isOnline);
                }
                
                alert(`Mode switched to ${isOnline ? 'Online' : 'Manual'}. ${confirmReport ? 'A report has been sent to the developer.' : ''}`);
            }
        } else {
            alert("Invalid email. Authentication failed.");
        }
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function sendReportToDeveloper(userEmail, reason, newMode) {
    const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/20237355/2mh16m0/';
  
    fetch(zapierWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        userEmail,
        reason,
        newMode,
        timestamp: new Date().toISOString()
      })
    })
    .then(response => {
      if (response.ok) {
        console.log('Report sent successfully');
        alert('Report sent to developer at rajtilakjoshij@gmail.com');
      } else {
        throw new Error('Failed to send report');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Failed to send report. Please try again.');
    });
  }

// ... (rest of the code remains the same)

function initializeReports() {
    for (let i = 1; i <= 4; i++) {
        createPredictionChart(i);
        createDensityChart(i);
        createCongestionChart(i);
    }
}
function createPredictionChart(feedId) {
    const ctx = document.getElementById(`predictionChart${feedId}`).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4'],
            datasets: [{
                label: 'Predicted Count',
                data: [65, 59, 80, 81],
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }, {
                label: 'Actual Count',
                data: [70, 62, 75, 85],
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createDensityChart(feedId) {
    const ctx = document.getElementById(`densityChart${feedId}`).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
            datasets: [{
                label: 'Traffic Density',
                data: [30, 20, 40, 80, 65, 75, 90, 50],
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createCongestionChart(feedId) {
    const ctx = document.getElementById(`congestionChart${feedId}`).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            datasets: [{
                label: 'Congestion Level',
                data: [65, 59, 80, 81, 56],
                backgroundColor: 'rgba(255, 159, 64, 0.6)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function sendAlert(feedId) {
    alert(`Alert sent for Junction ${feedId}. SMS notification dispatched to nearest junction.`);
}

function updateWeatherInfo() {
    // Simulate weather data (replace with actual API call in production)
    const temperature = Math.floor(Math.random() * 15) + 20; // 20-35°C
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const humidity = Math.floor(Math.random() * 30) + 40; // 40-70%
    const windSpeed = Math.floor(Math.random() * 20) + 5; // 5-25 km/h

    document.getElementById('temperature').textContent = temperature;
    document.getElementById('condition').textContent = condition;
    document.getElementById('mainTemperature').textContent = temperature;
    document.getElementById('mainCondition').textContent = condition;
    document.getElementById('humidity').textContent = humidity;
    document.getElementById('windSpeed').textContent = windSpeed;

    // Update weather icons
    const weatherIcon = document.getElementById('weatherIcon');
    const mainWeatherIcon = document.getElementById('mainWeatherIcon');
    switch(condition) {
        case 'Sunny':
            weatherIcon.textContent = '☀️';
            mainWeatherIcon.textContent = '☀️';
            break;
        case 'Cloudy':
            weatherIcon.textContent = '☁️';
            mainWeatherIcon.textContent = '☁️';
            break;
        case 'Rainy':
            weatherIcon.textContent = '🌧️';
            mainWeatherIcon.textContent = '🌧️';
            break;
        case 'Stormy':
            weatherIcon.textContent = '⛈️';
            mainWeatherIcon.textContent = '⛈️';
            break;
    }
}

function createWeatherImpactChart() {
    const ctx = document.getElementById('weatherImpactChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
            datasets: [{
                label: 'Traffic Flow',
                data: [70, 62, 75, 85, 80, 70, 65, 72],
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Traffic Management', 'Public Relations', 'Report Writing', 'Emergency Response', 'Team Leadership'],
            datasets: [{
                label: 'Officer Performance',
                data: [85, 75, 90, 80, 70],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            }]
        },
        options: {
            responsive: true,
            scale: {
                ticks: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.style.setProperty('--background-color', isDarkMode ? '#1a1a1a' : '#ffffff');
    document.body.style.setProperty('--text-color', isDarkMode ? '#ffffff' : '#000000');
    document.body.style.setProperty('--card-bg-color', isDarkMode ? '#2c2c2c' : '#f0f0f0');
    document.getElementById('themeStatus').textContent = isDarkMode ? 'Dark Mode' : 'Light Mode';
}

function openAddInspectorModal(junctionId) {
    const modal = document.getElementById('addInspectorModal');
    document.getElementById('junctionId').value = junctionId;
    modal.style.display = 'block';
}

function closeAddInspectorModal() {
    const modal = document.getElementById('addInspectorModal');
    modal.style.display = 'none';
}

document.querySelector('.close').onclick = closeAddInspectorModal;

window.onclick = function(event) {
    const modal = document.getElementById('addInspectorModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

document.getElementById('addInspectorForm').onsubmit = function(e) {
    e.preventDefault();
    const junctionId = document.getElementById('junctionId').value;
    const name = document.getElementById('inspectorName').value;
    const phone = document.getElementById('inspectorPhone').value;
    const email = document.getElementById('inspectorEmail').value;

    // Add inspector to the list (in a real app, this would involve a backend call)
    const inspectorList = document.getElementById(`inspectorList${junctionId}`);
    const newInspector = document.createElement('div');
    newInspector.innerHTML = `
        <p><strong>${name}</strong></p>
        <p>Phone: ${phone}</p>
        <p>Email: ${email}</p>
    `;
    inspectorList.appendChild(newInspector);

    // Update the count
    const currentInspectorsElement = document.getElementById(`currentInspectors${junctionId}`);
    const currentCount = parseInt(currentInspectorsElement.textContent);
    currentInspectorsElement.textContent = currentCount + 1;

    closeAddInspectorModal();
}

function removeInspector(junctionId) {
    const inspectorList = document.getElementById(`inspectorList${junctionId}`);
    if (inspectorList.lastChild) {
        inspectorList.removeChild(inspectorList.lastChild);

        // Update the count
        const currentInspectorsElement = document.getElementById(`currentInspectors${junctionId}`);
        const currentCount = parseInt(currentInspectorsElement.textContent);
        currentInspectorsElement.textContent = Math.max(0, currentCount - 1);
    }
}

function updateInspectorLists() {
    // Simulate initial inspector data
    for (let i = 1; i <= 4; i++) {
        const inspectorList = document.getElementById(`inspectorList${i}`);
        inspectorList.innerHTML = `
            <div>
                <p><strong>Inspector ${i}</strong></p>
                <p>Phone: 123-456-789${i}</p>
                <p>Email: inspector${i}@police.gov.in</p>
            </div>
        `;
    }
}

function showJunctionVideo(junctionId) {
    const videoFeed = document.getElementById(`videoFeed${junctionId}`);
    videoFeed.style.display = videoFeed.style.display === 'none' ? 'block' : 'none';
}

// Initialize the dashboard
setActivePage('dashboard');

// Theme switch event listener
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'themeSwitch') {
        toggleTheme();
    }
});

// Simulate periodic weather updates
setInterval(updateWeatherInfo, 30000); // Update every 5 minutes






// ... (previous code remains the same)

function updateWeatherInfo() {
    getLocation();
}

// Function to get user location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Display map and fetch weather based on user location
function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Show map based on the location
    showMap(lat, lon);

    // Fetch weather information based on coordinates
    getWeatherByLocation(lat, lon);
}

// Handle errors with geolocation
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

// Fetch weather data from OpenWeatherMap API
function getWeatherByLocation(lat, lon) {
    const apiKey = 'aa7a488c6767463453dcafd276e0c39b'; // Replace with your OpenWeatherMap API Key
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
            alert("Error fetching weather data. Please try again.");
        });
}

// Display fetched weather data
function displayWeather(data) {
    document.getElementById('mainTemperature').textContent = data.main.temp;
    document.getElementById('mainCondition').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('windSpeed').textContent = data.wind.speed;
    
    const iconCode = data.weather[0].icon;
    const weatherIcon = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('mainWeatherIcon').innerHTML = `<img src="${weatherIcon}" alt="Weather Icon" />`;

    const lat = data.coord.lat;
    const lon = data.coord.lon;
    showMap(lat, lon);
}

// Display map using an embedded iframe with the user's coordinates
function showMap(lat, lon) {
    const mapDiv = document.getElementById('weatherMap');
    mapDiv.innerHTML = `
        <iframe
            width="100%"
            height="300px"
            frameborder="0" style="border:0"
            src="https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed"
            allowfullscreen>
        </iframe>`;
}

// ============================================================================
// TRAFFIC MONITORING SYSTEM - BACKEND INTEGRATION
// ============================================================================

// Configuration
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://traffic-optimization-backend.onrender.com'; // Deployed backend
let isSystemActive = false;
let emergencyMode = false;
let trafficDataPolling = null;

// Traffic Monitoring API Class
class TrafficMonitorAPI {
    constructor(backendURL) {
        this.backendURL = backendURL;
        this.isConnected = false;
        this.videoFeeds = {};
        this.alertSounds = {
            traffic: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmoeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGJ2M2Oi0aiUEMXvH79qQQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJXnH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmoeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGCqO2Oy4cCYFJHjH8N2QQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQQAoUX7Tp66hVFApGn+DyvmkeGJ+M2Oi0aiUEMnvH79qQ=='),
            ambulance: new Audio('data:audio/wav;base64,UklGRv4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YdoCAAC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBA')
        };
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.backendURL}/health`);
            this.isConnected = response.ok;
            this.updateConnectionStatus(this.isConnected);
            return this.isConnected;
        } catch (error) {
            console.error('Backend connection failed:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            return false;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('backendStatus');
        const indicator = document.getElementById('connectionStatus');
        
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
            statusElement.style.color = connected ? '#4CAF50' : '#f44336';
        }
        
        if (indicator) {
            indicator.style.backgroundColor = connected ? '#4CAF50' : '#f44336';
        }
    }

    async setVideoSource(type, sources = []) {
        try {
            const response = await fetch(`${this.backendURL}/set_video_source`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: type, sources: sources })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to set video source:', error);
            return null;
        }
    }

    getVideoFeedURL(feedId) {
        return `${this.backendURL}/video_feed/${feedId}`;
    }

    async getVideoFeedAsImage(feedId) {
        // Get single frame from video feed (workaround for CORS issues)
        try {
            const response = await fetch(`${this.backendURL}/video_feed/${feedId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'image/jpeg, image/*'
                }
            });
            if (response.ok) {
                return await response.blob();
            }
        } catch (error) {
            console.error(`Failed to get frame for feed ${feedId}:`, error);
        }
        return null;
    }

    async getTrafficData(feedId) {
        try {
            const response = await fetch(`${this.backendURL}/get_data/${feedId}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to get data for feed ${feedId}:`, error);
            return null;
        }
    }

    startDataPolling() {
        if (trafficDataPolling) {
            clearInterval(trafficDataPolling);
        }
        
        trafficDataPolling = setInterval(async () => {
            for (let i = 0; i < 4; i++) {
                const data = await this.getTrafficData(i);
                if (data) {
                    this.updateTrafficDisplay(i, data);
                }
            }
        }, 2000);
    }

    stopDataPolling() {
        if (trafficDataPolling) {
            clearInterval(trafficDataPolling);
            trafficDataPolling = null;
        }
    }

    updateTrafficDisplay(feedId, data) {
        // Update vehicle count
        const countElement = document.getElementById(`count-${feedId}`);
        if (countElement) {
            countElement.textContent = data.count || 0;
        }

        // Update signal state
        const signalStateElement = document.getElementById(`signal-state-${feedId}`);
        if (signalStateElement) {
            signalStateElement.textContent = data.signal_state || 'UNKNOWN';
            signalStateElement.className = `stat-value signal-state signal-${(data.signal_state || 'unknown').toLowerCase()}`;
        }

        // Update green time or next green time
        const greenTimeElement = document.getElementById(`green-time-${feedId}`);
        if (greenTimeElement) {
            if (data.signal_state === 'RED') {
                // Show next green time when signal is RED
                const nextGreen = data.next_green_time || 0;
                greenTimeElement.textContent = `Next: ${Math.ceil(nextGreen)}s`;
                greenTimeElement.style.color = '#FF6B6B';
            } else if (data.signal_state === 'GREEN') {
                // Show green time countdown when signal is GREEN
                greenTimeElement.textContent = `${data.green_time || 0}s`;
                greenTimeElement.style.color = '#4CAF50';
            } else if (data.signal_state === 'YELLOW') {
                // Show remaining time when signal is YELLOW
                greenTimeElement.textContent = `${data.green_time || 0}s`;
                greenTimeElement.style.color = '#FFC107';
            } else {
                // For OBSERVATION or other states
                greenTimeElement.textContent = `${data.green_time || 0}s`;
                greenTimeElement.style.color = '#FF9800';
            }
        }

        // Update signal lights
        this.updateSignalLights(feedId, data.signal_state);

        // Update traffic density
        this.updateTrafficDensity(feedId, data.count);

        // Check for alerts
        this.checkTrafficAlerts(feedId, data);
    }

    updateSignalLights(feedId, signalState) {
        const states = ['red', 'yellow', 'green'];
        
        states.forEach(state => {
            const lightElement = document.getElementById(`${state}-${feedId}`);
            if (lightElement) {
                lightElement.classList.remove('active');
            }
        });

        if (signalState) {
            const activeLight = document.getElementById(`${signalState.toLowerCase()}-${feedId}`);
            if (activeLight) {
                activeLight.classList.add('active');
            }
        }
    }

    updateTrafficDensity(feedId, vehicleCount) {
        const densityFill = document.getElementById(`density-${feedId}`);
        const densityText = document.getElementById(`density-text-${feedId}`);
        
        if (densityFill && densityText) {
            const density = Math.min((vehicleCount / 20) * 100, 100); // Max 20 vehicles = 100%
            densityFill.style.width = `${density}%`;
            
            let level, color;
            if (density < 30) {
                level = 'Low';
                color = '#4CAF50';
            } else if (density < 70) {
                level = 'Medium';
                color = '#FF9800';
            } else {
                level = 'High';
                color = '#f44336';
            }
            
            densityFill.style.backgroundColor = color;
            densityText.textContent = level;
            densityText.style.color = color;
        }
    }

    checkTrafficAlerts(feedId, data) {
        const alertElement = document.getElementById(`alert-${feedId}`);
        
        if (!alertElement) return;

        // Clear previous alerts
        alertElement.innerHTML = '';

        const vehicleCount = data.count || 0;
        const signalState = data.signal_state || 'UNKNOWN';

        // High congestion alert
        if (vehicleCount > 15) {
            this.showAlert(feedId, 'High Traffic Congestion!', 'warning');
        }
        
        // Signal timing alert
        if (signalState === 'RED' && data.green_time > 120) {
            this.showAlert(feedId, 'Extended Red Light', 'info');
        }

        // Emergency override needed
        if (vehicleCount > 25) {
            this.showAlert(feedId, 'Emergency Intervention Required!', 'danger');
        }
    }

    showAlert(feedId, message, type) {
        const alertElement = document.getElementById(`alert-${feedId}`);
        if (!alertElement) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <span>⚠️ ${message}</span>
            <button onclick="dismissAlert(this)" class="alert-close">×</button>
        `;
        
        alertElement.appendChild(alertDiv);

        // Play alert sound for high priority alerts
        if (type === 'danger') {
            this.alertSounds.traffic.play().catch(e => console.log('Audio play failed:', e));
        }

        // Auto dismiss after 5 seconds for non-critical alerts
        if (type === 'info') {
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Initialize Traffic Monitor API
const trafficAPI = new TrafficMonitorAPI(BACKEND_URL);

// Video Feed Management
function initVideoFeed(feedId) {
    const videoElement = document.getElementById(`video-feed-${feedId}`);
    const errorElement = document.getElementById(`video-error-${feedId}`);
    
    if (videoElement) {
        // Get the MJPEG stream URL
        const streamUrl = trafficAPI.getVideoFeedURL(feedId);
        
        // For <img> tags with MJPEG streams, set src directly
        // The browser will handle the multipart/x-mixed-replace stream
        videoElement.src = streamUrl;
        videoElement.style.display = 'block';
        
        // Add error handling
        videoElement.onerror = () => {
            console.error(`Error loading video feed ${feedId}`);
            if (errorElement) {
                errorElement.style.display = 'flex';
            }
            // Retry after 3 seconds
            setTimeout(() => {
                initVideoFeed(feedId);
            }, 3000);
        };
        
        videoElement.onload = () => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        };
        
        // Clear error state initially
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Start data polling
        trafficAPI.startDataPolling();
    }
}

function retryVideoFeed(feedId) {
    const errorElement = document.getElementById(`video-error-${feedId}`);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    initVideoFeed(feedId);
}

function handleVideoError(feedId) {
    const videoElement = document.getElementById(`video-feed-${feedId}`);
    const errorElement = document.getElementById(`video-error-${feedId}`);
    
    console.warn(`Video feed ${feedId} error - attempting reconnection...`);
    
    if (videoElement) {
        videoElement.style.display = 'none';
    }
    
    if (errorElement) {
        errorElement.style.display = 'block';
    }
    
    // Retry after 5 seconds
    setTimeout(() => retryVideoFeed(feedId), 5000);
}

function retryVideoFeed(feedId) {
    initVideoFeed(feedId);
}

function toggleVideoFeed(feedId) {
    const videoCard = document.getElementById(`video-card-${feedId}`);
    const toggleButton = document.querySelector(`.feed-toggle[data-feed="${feedId}"]`);
    
    if (!videoCard || !toggleButton) return;
    
    const isHidden = videoCard.style.display === 'none';
    
    if (isHidden) {
        // Turn ON the feed
        videoCard.style.display = 'flex';
        toggleButton.classList.add('active');
        toggleButton.textContent = `Camera ${feedId + 1} (ON)`;
        initVideoFeed(feedId);
    } else {
        // Turn OFF the feed
        videoCard.style.display = 'none';
        toggleButton.classList.remove('active');
        toggleButton.textContent = `Camera ${feedId + 1} (OFF)`;
        
        // Stop the video stream
        const videoElement = document.getElementById(`video-feed-${feedId}`);
        if (videoElement) {
            videoElement.src = '';
        }
    }
}

// Fullscreen Video Display
let fullscreenFeedId = null;

function toggleFullscreen(feedId) {
    const videoCard = document.getElementById(`video-card-${feedId}`);
    const videoContainer = document.getElementById(`video-container-${feedId}`);
    const videoFeed = document.getElementById(`video-feed-${feedId}`);
    
    if (fullscreenFeedId !== null && fullscreenFeedId !== feedId) {
        // Exit previous fullscreen
        exitFullscreen(fullscreenFeedId);
    }
    
    if (fullscreenFeedId === feedId) {
        // Exit fullscreen
        exitFullscreen(feedId);
    } else {
        // Enter fullscreen
        fullscreenFeedId = feedId;
        
        // Create fullscreen modal
        const fullscreenModal = document.createElement('div');
        fullscreenModal.id = `fullscreen-modal-${feedId}`;
        fullscreenModal.className = 'fullscreen-modal';
        fullscreenModal.innerHTML = `
            <div class="fullscreen-content">
                <button class="close-fullscreen" onclick="toggleFullscreen(${feedId})" title="Exit Fullscreen">✕</button>
                <div class="fullscreen-video-container">
                    <img id="fullscreen-video-${feedId}" class="fullscreen-video" 
                         src="${videoFeed.src}" alt="Fullscreen Video Feed ${feedId + 1}">
                    <div class="fullscreen-overlay">
                        <div class="fullscreen-info">
                            <h2>Junction ${feedId + 1} - Full Screen</h2>
                            <div class="fullscreen-stats">
                                <span>🚗 Vehicles: <strong id="fs-count-${feedId}">0</strong></span>
                                <span>🚦 Signal: <strong id="fs-signal-${feedId}">GREEN</strong></span>
                                <span>⏱️ Green Time: <strong id="fs-time-${feedId}">30s</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(fullscreenModal);
        fullscreenModal.style.display = 'flex';
        
        // Update fullscreen video source
        const fullscreenVideo = document.getElementById(`fullscreen-video-${feedId}`);
        if (fullscreenVideo && videoFeed.src) {
            fullscreenVideo.src = videoFeed.src;
        }
    }
}

function exitFullscreen(feedId) {
    const modal = document.getElementById(`fullscreen-modal-${feedId}`);
    if (modal) {
        modal.remove();
    }
    fullscreenFeedId = null;
}

// Traffic Control Functions
function sendTrafficAlert(feedId) {
    trafficAPI.showAlert(feedId, `Manual alert sent for Junction ${feedId + 1}`, 'info');
    
    // You can add logic to notify traffic control center
    console.log(`Traffic alert sent for junction ${feedId + 1}`);
}

function ambulanceOverride(feedId) {
    if (!emergencyMode) {
        emergencyMode = true;
        document.getElementById('emergencyMode').textContent = 'AMBULANCE';
        document.getElementById('emergencyMode').style.color = '#f44336';
        
        // Play ambulance sound
        trafficAPI.alertSounds.ambulance.play().catch(e => console.log('Audio play failed:', e));
        
        trafficAPI.showAlert(feedId, `🚑 AMBULANCE OVERRIDE - Junction ${feedId + 1}`, 'danger');
        
        // Auto reset after 2 minutes
        setTimeout(() => {
            resetEmergencyMode();
        }, 120000);
        
        console.log(`Ambulance override activated for junction ${feedId + 1}`);
    }
}

function resetEmergencyMode() {
    emergencyMode = false;
    document.getElementById('emergencyMode').textContent = 'Normal';
    document.getElementById('emergencyMode').style.color = '#4CAF50';
    
    // Clear all alerts
    for (let i = 0; i < 4; i++) {
        const alertElement = document.getElementById(`alert-${i}`);
        if (alertElement) {
            alertElement.innerHTML = '';
        }
    }
}

// System Control Functions
function startAllFeeds() {
    isSystemActive = true;
    
    // Check backend connection first
    fetch(`${BACKEND_URL}/api/health`)
        .then(res => res.json())
        .then(data => {
            console.log('Backend connected:', data);
            // Start all video feeds
            for (let i = 0; i < 4; i++) {
                initVideoFeed(i);
            }
            trafficAPI.startDataPolling();
            document.getElementById('systemMode').textContent = 'Auto';
            console.log('All traffic feeds started');
        })
        .catch(err => {
            console.error('Backend connection failed:', err);
            alert('Backend not available. Make sure Python backend is running on port 5000');
        });
}

function stopAllFeeds() {
    isSystemActive = false;
    trafficAPI.stopDataPolling();
    
    // Stop all video feeds
    for (let i = 0; i < 4; i++) {
        const videoElement = document.getElementById(`video-feed-${i}`);
        if (videoElement) {
            videoElement.src = '';
        }
    }
    
    document.getElementById('systemMode').textContent = 'Manual';
    console.log('All traffic feeds stopped');
}

function resetSystem() {
    stopAllFeeds();
    resetEmergencyMode();
    
    // Reset all displays
    for (let i = 0; i < 4; i++) {
        const countElement = document.getElementById(`count-${i}`);
        const signalStateElement = document.getElementById(`signal-state-${i}`);
        const greenTimeElement = document.getElementById(`green-time-${i}`);
        const densityFill = document.getElementById(`density-${i}`);
        const densityText = document.getElementById(`density-text-${i}`);
        
        if (countElement) countElement.textContent = '0';
        if (signalStateElement) {
            signalStateElement.textContent = 'GREEN';
            signalStateElement.className = 'stat-value signal-state signal-green';
        }
        if (greenTimeElement) greenTimeElement.textContent = '30s';
        if (densityFill) {
            densityFill.style.width = '0%';
            densityFill.style.backgroundColor = '#4CAF50';
        }
        if (densityText) {
            densityText.textContent = 'Low';
            densityText.style.color = '#4CAF50';
        }
    }
    
    console.log('Traffic system reset');
}

function exportData() {
    // Create CSV data
    const data = [];
    const headers = ['Junction', 'Vehicle Count', 'Signal State', 'Green Time', 'Density Level'];
    data.push(headers);
    
    for (let i = 0; i < 4; i++) {
        const count = document.getElementById(`count-${i}`)?.textContent || '0';
        const signal = document.getElementById(`signal-state-${i}`)?.textContent || 'GREEN';
        const greenTime = document.getElementById(`green-time-${i}`)?.textContent || '30s';
        const density = document.getElementById(`density-text-${i}`)?.textContent || 'Low';
        
        data.push([`Junction ${i + 1}`, count, signal, greenTime, density]);
    }
    
    // Convert to CSV
    const csvContent = data.map(row => row.join(',')).join('\\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Traffic data exported');
}

function dismissAlert(button) {
    const alertElement = button.parentElement;
    if (alertElement) {
        alertElement.remove();
    }
}

// YouTube Video Loading Function
async function loadYoutubeVideo() {
    const youtubeUrl = document.getElementById('youtubeUrl').value;
    const feedId = document.getElementById('feedSelect').value;
    const statusDiv = document.getElementById('youtubeStatus');
    
    // Validate input
    if (!youtubeUrl.trim()) {
        statusDiv.style.display = 'block';
        statusDiv.style.backgroundColor = '#ffebee';
        statusDiv.style.color = '#c62828';
        statusDiv.textContent = '❌ Please paste a YouTube URL';
        return;
    }
    
    // Validate YouTube URL format
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
        statusDiv.style.display = 'block';
        statusDiv.style.backgroundColor = '#ffebee';
        statusDiv.style.color = '#c62828';
        statusDiv.textContent = '❌ Invalid YouTube URL. Please paste a valid YouTube link.';
        return;
    }
    
    // Show loading status
    statusDiv.style.display = 'block';
    statusDiv.style.backgroundColor = '#e3f2fd';
    statusDiv.style.color = '#1565c0';
    statusDiv.textContent = '⏳ Loading YouTube video... This may take 10-15 seconds...';
    
    try {
        const response = await fetch(`${BACKEND_URL}/set_youtube_feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feed_id: parseInt(feedId),
                url: youtubeUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Success
        statusDiv.style.display = 'block';
        statusDiv.style.backgroundColor = '#e8f5e9';
        statusDiv.style.color = '#2e7d32';
        statusDiv.textContent = `✅ YouTube video loaded successfully for Feed ${parseInt(feedId) + 1}!`;
        
        // Clear input
        document.getElementById('youtubeUrl').value = '';
        
        console.log('YouTube video loaded:', result);
        
    } catch (error) {
        statusDiv.style.display = 'block';
        statusDiv.style.backgroundColor = '#ffebee';
        statusDiv.style.color = '#c62828';
        statusDiv.textContent = `❌ Error: ${error.message}. Please try again.`;
        console.error('YouTube load error:', error);
    }
}

// Allow Enter key to trigger video load
document.addEventListener('DOMContentLoaded', function() {
    const youtubeInput = document.getElementById('youtubeUrl');
    if (youtubeInput) {
        youtubeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadYoutubeVideo();
            }
        });
    }
});

// Emergency button handler
document.addEventListener('DOMContentLoaded', function() {
    const emergencyBtn = document.getElementById('emergencyBtn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', function() {
            if (emergencyMode) {
                resetEmergencyMode();
                this.textContent = '🚨 Emergency Override';
                this.classList.remove('active');
            } else {
                emergencyMode = true;
                document.getElementById('emergencyMode').textContent = 'EMERGENCY';
                document.getElementById('emergencyMode').style.color = '#f44336';
                this.textContent = '✅ Exit Emergency';
                this.classList.add('active');
                
                // Override all signals to emergency state
                for (let i = 0; i < 4; i++) {
                    trafficAPI.showAlert(i, '🚨 EMERGENCY MODE ACTIVE', 'danger');
                }
            }
        });
    }
});

// Auto-initialize when dashboard is loaded
function initializeTrafficSystem() {
    trafficAPI.checkConnection().then(connected => {
        if (connected) {
            console.log('Backend connected successfully');
            // Auto-start demo mode
            startAllFeeds();
        } else {
            console.log('Backend connection failed - using demo mode');
            // Still show demo interface
            for (let i = 0; i < 4; i++) {
                handleVideoError(i);
            }
        }
    });
}


