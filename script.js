// Global variables
let tasks = JSON.parse(localStorage.getItem('aiTasks') || '[]');
let isCalendarConnected = false;
let gapi, tokenClient;
let recognition = null;
let isListening = false;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    displayTasks();
    updateStats();
    setDefaultDateTime();
    initializeVoiceRecognition();
    gapiLoaded();
});

// Voice Recognition Setup
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            isListening = true;
            updateVoiceButton();
            showNotification('🎤 Mendengarkan...', 'info');
        };
        
        recognition.onresult = function(event) {
            const voiceInput = event.results[0][0].transcript;
            document.getElementById('taskInput').value = voiceInput;
            showNotification(`✅ Berhasil: "${voiceInput}"`, 'success');
        };
        
        recognition.onerror = function(event) {
            showNotification('❌ Error: ' + event.error, 'error');
        };
        
        recognition.onend = function() {
            isListening = false;
            updateVoiceButton();
        };
    } else {
        document.querySelector('.voice-controls').style.display = 'none';
        showNotification('⚠️ Browser tidak mendukung voice recognition', 'error');
    }
}

function toggleVoiceInput() {
    if (!recognition) return;
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function updateVoiceButton() {
    const btn = document.getElementById('voiceBtn');
    const status = document.getElementById('voiceStatus');
    
    if (isListening) {
        btn.textContent = '🔴 Berhenti';
        btn.classList.add('listening');
        status.textContent = 'Sedang mendengarkan...';
    } else {
        btn.textContent = '🎤 Voice Input';
        btn.classList.remove('listening');
        status.textContent = '';
    }
}

// Task Management
function setDefaultDateTime() {
    const now = new Date();
    document.getElementById('taskDate').value = now.toISOString().split('T')[0];
    document.getElementById('taskTime').value = now.toTimeString().slice(0, 5);
}

function processTask() {
    const taskInput = document.getElementById('taskInput').value.trim();
    const taskDate = document.getElementById('taskDate').value;
    const taskTime = document.getElementById('taskTime').value;
    const priority = document.getElementById('priority').value;

    if (!taskInput) {
        showNotification('❌ Mohon masukkan deskripsi tugas!', 'error');
        return;
    }

    // AI Processing
    const aiAnalysis = analyzeTaskWithAI(taskInput);
    showAIResponse(aiAnalysis);

    // Extract task details
    const taskDetails = extractTaskDetails(taskInput, aiAnalysis);

    // Create task object
    const task = {
        id: Date.now(),
        title: taskDetails.title,
        description: taskInput,
        date: taskDate,
        time: taskTime,
        priority: priority,
        createdAt: new Date().toISOString(),
        completed: false,
        category: aiAnalysis.category
    };

    // Add to tasks array
    tasks.unshift(task);
    
    // Save to localStorage
    localStorage.setItem('aiTasks', JSON.stringify(tasks));

    // Update display
    displayTasks();
    updateStats();

    // Clear form
    document.getElementById('taskInput').value = '';

    // Sync to Google Calendar if connected
    if (isCalendarConnected) {
        syncToGoogleCalendar(task);
    }

    showNotification('✅ Tugas berhasil ditambahkan!', 'success');
}

function analyzeTaskWithAI(taskInput) {
    const analysis = {
        extractedInfo: [],
        suggestions: [],
        category: 'umum',
        urgency: 'normal'
    };

    const input = taskInput.toLowerCase();

    // Category detection
    if (input.includes('rapat') || input.includes('meeting')) {
        analysis.category = 'rapat';
        analysis.suggestions.push('Siapkan agenda rapat');
        analysis.suggestions.push('Konfirmasi kehadiran peserta');
    } else if (input.includes('email') || input.includes('balas') || input.includes('kirim')) {
        analysis.category = 'komunikasi';
        analysis.suggestions.push('Siapkan draft email');
    } else if (input.includes('laporan') || input.includes('report')) {
        analysis.category = 'dokumen';
        analysis.suggestions.push('Kumpulkan data yang diperlukan');
    } else if (input.includes('presentasi') || input.includes('slide')) {
        analysis.category = 'presentasi';
        analysis.suggestions.push('Siapkan outline presentasi');
    }

    // Urgency detection
    if (input.includes('urgent') || input.includes('segera') || input.includes('deadline')) {
        analysis.urgency = 'high';
        analysis.extractedInfo.push('Tugas bersifat mendesak');
    }

    // Time extraction
    const timePattern = /(\d{1,2})[:.]\s?(\d{2})/;
    const timeMatch = input.match(timePattern);
    if (timeMatch) {
        analysis.extractedInfo.push(`Waktu terdeteksi: ${timeMatch[0]}`);
    }

    // Date extraction
    if (input.includes('besok')) {
        analysis.extractedInfo.push('Tanggal: Besok');
    } else if (input.includes('hari ini')) {
        analysis.extractedInfo.push('Tanggal: Hari ini');
    }

    return analysis;
}

function extractTaskDetails(taskInput, aiAnalysis) {
    let title = taskInput.length > 50 ? taskInput.substring(0, 50) + '...' : taskInput;
    
    // Add category emoji
    const categoryEmojis = {
        'rapat': '📅',
        'komunikasi': '✉️',
        'dokumen': '📄',
        'presentasi': '📊',
        'umum': '📝'
    };
    
    title = categoryEmojis[aiAnalysis.category] + ' ' + title;
    return { title };
}

function showAIResponse(analysis) {
    const responseDiv = document.getElementById('aiResponse');
    const analysisP = document.getElementById('aiAnalysis');
    
    let responseText = `Kategori: ${analysis.category.toUpperCase()}\n`;
    
    if (analysis.extractedInfo.length > 0) {
        responseText += `\nInformasi yang diekstrak:\n${analysis.extractedInfo.map(info => `• ${info}`).join('\n')}`;
    }
    
    if (analysis.suggestions.length > 0) {
        responseText += `\n\nSaran AI:\n${analysis.suggestions.map(suggestion => `• ${suggestion}`).join('\n')}`;
    }

    analysisP.textContent = responseText;
    responseDiv.classList.add('show');

    setTimeout(() => {
        responseDiv.classList.remove('show');
    }, 10000);
}

function displayTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-state">Belum ada tugas. Tambahkan tugas pertama Anda!</p>';
        return;
    }

    const tasksHTML = tasks.map(task => `
        <div class="task-item">
            <div class="task-actions">
                <button class="btn-small" onclick="deleteTask(${task.id})" title="Hapus">🗑️</button>
                <button class="btn-small" onclick="editTask(${task.id})" title="Edit">✏️</button>
            </div>
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <div class="task-datetime">
                    📅 ${formatDate(task.date)} ⏰ ${task.time}
                </div>
                <div class="task-priority priority-${task.priority}">
                    ${getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
                </div>
            </div>
        </div>
    `).join('');

    tasksList.innerHTML = tasksHTML;
}

function deleteTask(taskId) {
    if (confirm('Yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('aiTasks', JSON.stringify(tasks));
        displayTasks();
        updateStats();
        showNotification('✅ Tugas berhasil dihapus!', 'success');
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('taskInput').value = task.description;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskTime').value = task.time;
        document.getElementById('priority').value = task.priority;
        
        deleteTask(taskId);
        showNotification('📝 Tugas siap untuk diedit!', 'info');
    }
}

function filterTasks() {
    const filter = document.getElementById('filterPriority').value;
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
        } else {
            const priorityElement = item.querySelector('.task-priority');
            if (priorityElement.classList.contains(`priority-${filter}`)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

function searchTasks() {
    const searchTerm = document.getElementById('searchTasks').value.toLowerCase();
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        const title = item.querySelector('.task-title').textContent.toLowerCase();
        const description = item.querySelector('.task-description').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getPriorityIcon(priority) {
    switch (priority) {
        case 'tinggi': return '🔴';
        case 'sedang': return '🟡';
        case 'rendah': return '🟢';
        default: return '⚪';
    }
}

function updateStats() {
    const totalTasks = tasks.length;
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.date === today).length;
    const highPriorityTasks = tasks.filter(task => task.priority === 'tinggi').length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('todayTasks').textContent = todayTasks;
    document.getElementById('highPriorityTasks').textContent = highPriorityTasks;
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Google Calendar Integration
async function gapiLoaded() {
    if (typeof gapi !== 'undefined') {
        await gapi.load('client', initializeGapiClient);
    }
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_CONFIG.API_KEY,
        discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        scope: GOOGLE_CONFIG.SCOPES,
        callback: '',
    });
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        
        isCalendarConnected = true;
        updateCalendarStatus(true);
        showNotification('✅ Berhasil terhubung ke Google Calendar!', 'success');
        
        document.getElementById('authorizeBtn').style.display = 'none';
        document.getElementById('signoutBtn').style.display = 'inline-block';
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        
        isCalendarConnected = false;
        updateCalendarStatus(false);
        showNotification('✅ Berhasil disconnect dari Google Calendar', 'info');
        
        document.getElementById('authorizeBtn').style.display = 'inline-block';
        document.getElementById('signoutBtn').style.display = 'none';
    }
}

function updateCalendarStatus(connected) {
    const statusDiv = document.getElementById('calendarStatus');
    
    if (connected) {
        statusDiv.className = 'calendar-status status-connected';
        statusDiv.textContent = '✅ Terhubung ke Google Calendar';
    } else {
        statusDiv.className = 'calendar-status status-disconnected';
        statusDiv.textContent = '⚠️ Belum terhubung ke Google Calendar';
    }
}

async function syncToGoogleCalendar(task) {
    if (!isCalendarConnected) return;
    
    const event = {
        'summary': task.title,
        'description': task.description,
        'start': {
            'dateTime': `${task.date}T${task.time}:00`,
            'timeZone': 'Asia/Jakarta'
        },
        'end': {
            'dateTime': `${task.date}T${addHour(task.time)}:00`,
            'timeZone': 'Asia/Jakarta'
        }
    };

    try {
        const response = await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });
        
        showNotification('📅 Tugas berhasil disinkronkan ke Google Calendar!', 'success');
        console.log('Event created: ' + response.result.htmlLink);
    } catch (error) {
        showNotification('❌ Gagal sinkronisasi ke Google Calendar', 'error');
        console.error('Error creating calendar event:', error);
    }
}

function addHour(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours) + 1, parseInt(minutes));
    return date.toTimeString().slice(0, 5);
}

// Load Google APIs
if (typeof gapi !== 'undefined') {
    gapi.load('client', gapiLoaded);
}
if (typeof google !== 'undefined') {
    google.accounts.id.initialize({
        callback: gisLoaded
    });
}
