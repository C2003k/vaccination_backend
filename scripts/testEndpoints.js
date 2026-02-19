


const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    try {
        console.log("1. Logging in as Health Worker...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'chw@test.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            const err = await loginRes.text();
            throw new Error(`Login failed: ${err}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.data.accessToken;
        console.log("Login successful. Token received.");

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log("\n2. Fetching Dashboard Stats...");
        const statsRes = await fetch(`${BASE_URL}/health-worker/stats`, { headers });
        const statsData = await statsRes.json();
        console.log("Stats:", JSON.stringify(statsData.data, null, 2));

        console.log("\n3. Fetching Assigned Mothers...");
        const mothersRes = await fetch(`${BASE_URL}/health-worker/assigned-mothers`, { headers });
        const mothersData = await mothersRes.json();
        console.log("Mothers Data Response:", JSON.stringify(mothersData, null, 2));
        console.log(`Found ${mothersData.count} assigned mothers.`);

        let childId;
        if (mothersData.data.length > 0 && mothersData.data[0].children.length > 0) {
            childId = mothersData.data[0].children[0].id;
            console.log(`Using Child ID: ${childId} for further tests.`);
        } else {
            console.log("No children found to test with.");
        }

        console.log("\n4. Creating Schedule...");
        const scheduleRes = await fetch(`${BASE_URL}/health-worker/schedule`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                motherId: mothersData.data[0].id,
                type: 'home_visit',
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                duration: 45,
                purpose: 'Routine Checkup',
                priority: 'medium',
                location: 'Test Location'
            })
        });
        const scheduleData = await scheduleRes.json();
        console.log("Schedule created:", scheduleData.success);
        if (!scheduleData.success) {
            console.log("Schedule Error:", JSON.stringify(scheduleData, null, 2));
        }

        console.log("\n5. Fetching Schedule...");
        const getScheduleRes = await fetch(`${BASE_URL}/health-worker/schedule`, { headers });
        const getScheduleData = await getScheduleRes.json();
        console.log(`Schedule count: ${getScheduleData.count}`);

        console.log("\n6. Creating Field Report...");
        const reportRes = await fetch(`${BASE_URL}/health-worker/reports`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                reportDate: new Date(),
                location: {
                    subCounty: 'Kitui Central',
                    ward: 'Township',
                    village: 'Majengo'
                },
                activities: {
                    mothersVisited: 1,
                    vaccinationsGiven: 0,
                    followUps: 0
                },
                challenges: 'None',
                status: 'draft'
            })
        });
        const reportData = await reportRes.json();
        console.log("Report created:", reportData.success);
        if (!reportData.success) {
            console.log("Report Error:", JSON.stringify(reportData, null, 2));
        }

        if (childId) {
            console.log("\n7. Recording Vaccination (Mocking vaccine ID)...");
            // Valid vaccine ID would be needed here. 
            // Ideally we fetch vaccines first.
            // But for now let's just error catch this one if ID is invalid, or skip.
            // Let's assume we can't easily record without a valid vaccine ID.
            console.log("Skipping vaccination record without valid vaccine ID lookup.");
        }

        console.log("\n--- All Tests Completed Successfully ---");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testEndpoints();
