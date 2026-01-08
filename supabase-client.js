/**
 * Supabase Configuration for Track-V Frontend
 * Handles authentication, database queries, and real-time subscriptions
 */

// Supabase Configuration
const SUPABASE_URL = 'https://kpouqjeocjiccskuxhle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwb3VxamVvY2ppY2Nza3V4aGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODU0MjcsImV4cCI6MjA4MzQ2MTQyN30.rxkTGV7ESIvnb5Ff4UCcvWFLiiVp0RN9xrQ8wp2sVEQ';

// Backend API URL (Update this after deploying to Render)
const BACKEND_URL = 'http://localhost:5000'; // Change to 'https://your-app.onrender.com' after deployment

// Initialize Supabase Client
let supabase = null;

// Initialize Supabase when script loads
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return true;
    }
    console.warn('Supabase library not loaded');
    return false;
}

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

/**
 * Sign up new user
 */
async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        return {
            success: true,
            user: data.user,
            message: 'Account created! Please check your email to verify.'
        };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in user
 */
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Store session
        localStorage.setItem('track_v_session', JSON.stringify(data.session));
        localStorage.setItem('track_v_user', JSON.stringify(data.user));

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out user
 */
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        
        // Clear local storage
        localStorage.removeItem('track_v_session');
        localStorage.removeItem('track_v_user');
        localStorage.removeItem('track_v_settings');

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current user
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated() {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Get current session
 */
async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// =============================================
// USER PROFILE FUNCTIONS
// =============================================

/**
 * Get user profile
 */
async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

/**
 * Update user profile
 */
async function updateProfile(updates) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, profile: data };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload profile avatar
 */
async function uploadAvatar(file) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with avatar URL
        await updateProfile({ avatar_url: publicUrl });

        return { success: true, avatarUrl: publicUrl };
    } catch (error) {
        console.error('Upload avatar error:', error);
        return { success: false, error: error.message };
    }
}

// =============================================
// USER SETTINGS FUNCTIONS
// =============================================

/**
 * Get user settings
 */
async function getUserSettings() {
    // First check local storage for cached settings
    const cached = localStorage.getItem('track_v_settings');
    if (cached) {
        return JSON.parse(cached);
    }

    const profile = await getUserProfile();
    if (profile) {
        const settings = {
            dark_mode: profile.dark_mode || false,
            email_alerts_enabled: profile.email_alerts_enabled !== false
        };
        localStorage.setItem('track_v_settings', JSON.stringify(settings));
        return settings;
    }

    return { dark_mode: false, email_alerts_enabled: true };
}

/**
 * Update user settings
 */
async function updateSettings(settings) {
    const result = await updateProfile(settings);
    if (result.success) {
        localStorage.setItem('track_v_settings', JSON.stringify(settings));
    }
    return result;
}

/**
 * Toggle dark mode
 */
async function toggleDarkMode(enabled) {
    const result = await updateSettings({ dark_mode: enabled });
    if (result.success) {
        applyDarkMode(enabled);
    }
    return result;
}

/**
 * Toggle email alerts
 */
async function toggleEmailAlerts(enabled) {
    return await updateSettings({ email_alerts_enabled: enabled });
}

/**
 * Apply dark mode to UI
 */
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
}

// =============================================
// JUNCTION & TRAFFIC DATA FUNCTIONS
// =============================================

/**
 * Get all junctions
 */
async function getJunctions() {
    try {
        const { data, error } = await supabase
            .from('junctions')
            .select(`
                *,
                cameras (*)
            `)
            .eq('status', 'active');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get junctions error:', error);
        return [];
    }
}

/**
 * Get traffic data for a junction
 */
async function getTrafficData(junctionId, cameraIndex = null) {
    try {
        let query = supabase
            .from('traffic_data')
            .select('*')
            .eq('junction_id', junctionId)
            .order('timestamp', { ascending: false })
            .limit(10);

        if (cameraIndex !== null) {
            query = query.eq('camera_index', cameraIndex);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get traffic data error:', error);
        return [];
    }
}

/**
 * Get traffic history
 */
async function getTrafficHistory(junctionId, hours = 24) {
    try {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('traffic_data')
            .select('*')
            .eq('junction_id', junctionId)
            .gte('timestamp', since)
            .order('timestamp', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get traffic history error:', error);
        return [];
    }
}

/**
 * Subscribe to real-time traffic updates
 */
function subscribeToTrafficUpdates(junctionId, callback) {
    const subscription = supabase
        .channel(`traffic_${junctionId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'traffic_data',
            filter: `junction_id=eq.${junctionId}`
        }, (payload) => {
            callback(payload.new);
        })
        .subscribe();

    return subscription;
}

// =============================================
// ALERT FUNCTIONS
// =============================================

/**
 * Create traffic alert
 */
async function createAlert(junctionId, alertData) {
    const user = await getCurrentUser();
    
    try {
        const { data, error } = await supabase
            .from('alerts')
            .insert({
                junction_id: junctionId,
                camera_index: alertData.camera_index,
                alert_type: alertData.type || 'manual',
                severity: alertData.severity || 'medium',
                title: alertData.title || 'Traffic Alert',
                description: alertData.description || '',
                created_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger email send via backend API
        const settings = await getUserSettings();
        if (settings.email_alerts_enabled) {
            await sendAlertEmail(junctionId, alertData, data.id);
        }

        return { success: true, alert: data };
    } catch (error) {
        console.error('Create alert error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send alert email via backend
 */
async function sendAlertEmail(junctionId, alertData, alertId) {
    try {
        const session = await getSession();
        
        const response = await fetch(`${BACKEND_URL}/api/v1/alerts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
                'X-User-ID': session?.user?.id
            },
            body: JSON.stringify({
                junction_id: junctionId,
                ...alertData
            })
        });

        return await response.json();
    } catch (error) {
        console.error('Send alert email error:', error);
        return { success: false };
    }
}

/**
 * Get alerts for junction
 */
async function getAlerts(junctionId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('junction_id', junctionId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get alerts error:', error);
        return [];
    }
}

/**
 * Subscribe to real-time alert updates
 */
function subscribeToAlerts(junctionId, callback) {
    const subscription = supabase
        .channel(`alerts_${junctionId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'alerts',
            filter: `junction_id=eq.${junctionId}`
        }, (payload) => {
            callback(payload.new);
        })
        .subscribe();

    return subscription;
}

// =============================================
// MAP DATA FUNCTIONS
// =============================================

/**
 * Get all junctions with latest data for map
 */
async function getMapData() {
    try {
        const junctions = await getJunctions();
        
        const mapData = await Promise.all(junctions.map(async (junction) => {
            const trafficData = await getTrafficData(junction.id);
            
            return {
                id: junction.id,
                name: junction.name,
                location_name: junction.location_name,
                latitude: parseFloat(junction.latitude),
                longitude: parseFloat(junction.longitude),
                status: junction.status,
                inspector_name: junction.inspector_name,
                cameras: junction.cameras || [],
                latest_traffic: trafficData[0] || null
            };
        }));

        return mapData;
    } catch (error) {
        console.error('Get map data error:', error);
        return [];
    }
}

// =============================================
// REPORT FUNCTIONS
// =============================================

/**
 * Get traffic reports
 */
async function getReports(junctionId, reportType = 'hourly', days = 7) {
    try {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('traffic_reports')
            .select('*')
            .eq('junction_id', junctionId)
            .eq('report_type', reportType)
            .gte('report_date', since)
            .order('report_date', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get reports error:', error);
        return [];
    }
}

/**
 * Download report as CSV
 */
async function downloadReport(junctionId, reportType = 'daily', days = 30) {
    try {
        const session = await getSession();
        
        const response = await fetch(
            `${BACKEND_URL}/api/v1/reports/${junctionId}/download?type=${reportType}&days=${days}`,
            {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            }
        );

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `traffic_report_${junctionId}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        }

        return { success: false };
    } catch (error) {
        console.error('Download report error:', error);
        return { success: false, error: error.message };
    }
}

// =============================================
// VIDEO SOURCE MANAGEMENT
// =============================================

/**
 * Update camera source (YouTube, RTSP, file)
 */
async function updateCameraSource(junctionId, cameraIndex, sourceType, sourceUrl) {
    try {
        const session = await getSession();
        
        // Update in Supabase
        const { error } = await supabase
            .from('cameras')
            .update({
                source_type: sourceType,
                source_url: sourceUrl,
                is_active: true,
                last_active: new Date().toISOString()
            })
            .eq('junction_id', junctionId)
            .eq('camera_index', cameraIndex);

        if (error) throw error;

        // Notify backend to switch video source
        await fetch(`${BACKEND_URL}/set_video_source`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                feed_id: cameraIndex,
                source_type: sourceType,
                source_url: sourceUrl
            })
        });

        return { success: true };
    } catch (error) {
        console.error('Update camera source error:', error);
        return { success: false, error: error.message };
    }
}

// =============================================
// INITIALIZATION
// =============================================

/**
 * Initialize app on page load
 */
async function initializeApp() {
    // Initialize Supabase
    if (!initSupabase()) {
        console.error('Failed to initialize Supabase');
        return;
    }

    // Check authentication
    const user = await getCurrentUser();
    if (user) {
        console.log('User logged in:', user.email);
        
        // Apply user settings
        const settings = await getUserSettings();
        applyDarkMode(settings.dark_mode);
    } else {
        console.log('No user logged in');
        // Redirect to login if on protected page
        if (window.location.pathname.includes('/afterlogin/')) {
            window.location.href = '../login.html';
        }
    }
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions for use in other scripts
window.TrackV = {
    // Auth
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isAuthenticated,
    
    // Profile
    getUserProfile,
    updateProfile,
    uploadAvatar,
    
    // Settings
    getUserSettings,
    updateSettings,
    toggleDarkMode,
    toggleEmailAlerts,
    
    // Junctions & Traffic
    getJunctions,
    getTrafficData,
    getTrafficHistory,
    subscribeToTrafficUpdates,
    
    // Alerts
    createAlert,
    getAlerts,
    subscribeToAlerts,
    
    // Map
    getMapData,
    
    // Reports
    getReports,
    downloadReport,
    
    // Video
    updateCameraSource,
    
    // Backend URL
    BACKEND_URL
};
