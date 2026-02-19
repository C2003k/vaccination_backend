
// import fetch from 'node-fetch'; // Built-in fetch in Node 18+

const BASE_URL = 'http://localhost:5000/api';

const testDashboard = async () => {
    try {
        console.log("1. Logging in as Hospital Admin...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@hospital.com',
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error("Login failed:", loginData);
            return;
        }

        const token = loginData.data.accessToken;
        const hospitalId = loginData.data.user.hospital;
        console.log("Login successful. Token received.");
        console.log("Hospital ID from User:", hospitalId);

        if (!hospitalId) {
            console.error("No hospital ID found on user object!");
            // Attempt to fetch user profile to see if it's there
            const meRes = await fetch(`${BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const meData = await meRes.json();
            console.log("Me Endpoint Data:", JSON.stringify(meData, null, 2));
            return;
        }

        console.log(`2. Fetching Dashboard for Hospital ID: ${hospitalId}...`);
        const dashRes = await fetch(`${BASE_URL}/hospitals/${hospitalId}/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const dashData = await dashRes.json();
        console.log("Dashboard Response:", JSON.stringify(dashData, null, 2));

        if (dashData.success) {
            console.log("✅ Dashboard data fetched successfully!");
        } else {
            console.error("❌ Failed to fetch dashboard data");
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
};

testDashboard();
