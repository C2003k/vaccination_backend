const BASE_URL = "http://localhost:5000/api";

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Login failed");
  }
  return data.data.accessToken;
}

async function apiCall(token, endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log("Starting Linking Endpoint Tests...");

  let adminToken;
  const adminCreds = [
    { email: "admin@vactrack.com", password: "admin123" },
    { email: "admin@vactrack.com", password: "password123" },
  ];

  for (const creds of adminCreds) {
    try {
      adminToken = await login(creds.email, creds.password);
      console.log(`Logged in as admin (${creds.email}).`);
      break;
    } catch (error) {
      console.warn(`Login failed for ${creds.email}: ${error.message}`);
    }
  }

  if (!adminToken) {
    console.warn("No admin credentials worked. Skipping linking tests.");
    return;
  }

  console.log("\nFetching hospitals...");
  const hospitalsRes = await apiCall(adminToken, "/hospitals");
  if (!hospitalsRes.data?.data?.length) {
    console.warn("No hospitals found. Seed hospitals before running this test.");
    return;
  }

  const hospital = hospitalsRes.data.data[0];
  console.log(`Using hospital: ${hospital.name} (${hospital._id})`);

  console.log("\nFetching hospital staff users...");
  const staffRes = await apiCall(adminToken, "/users/role/hospital_staff");
  if (!staffRes.data?.data?.length) {
    console.warn("No hospital staff users found. Seed staff users before running this test.");
  } else {
    const staffUser = staffRes.data.data[0];
    console.log(`Linking staff: ${staffUser.name} (${staffUser._id})`);

    const linkRes = await apiCall(adminToken, `/hospitals/${hospital._id}/staff`, "POST", {
      userId: staffUser._id,
    });
    console.log("Link staff response:", linkRes.status, linkRes.data?.message);

    const staffListRes = await apiCall(adminToken, `/hospitals/${hospital._id}/staff`);
    console.log(`Hospital staff count: ${staffListRes.data?.count || 0}`);

    const unlinkRes = await apiCall(
      adminToken,
      `/hospitals/${hospital._id}/staff/${staffUser._id}`,
      "DELETE"
    );
    console.log("Unlink staff response:", unlinkRes.status, unlinkRes.data?.message);
  }

  console.log("\nFetching eligible health workers and mothers...");
  const healthWorkerRes = await apiCall(
    adminToken,
    `/hospitals/${hospital._id}/eligible-health-workers`
  );
  const motherRes = await apiCall(
    adminToken,
    `/hospitals/${hospital._id}/eligible-mothers?assigned=false`
  );

  if (!healthWorkerRes.data?.data?.length || !motherRes.data?.data?.length) {
    console.warn("Health workers or mothers missing. Seed data to test mother assignments.");
    return;
  }

  const healthWorker = healthWorkerRes.data.data[0];
  const mother = motherRes.data.data[0];

  console.log(`Assigning mother ${mother.name} to CHW ${healthWorker.name}...`);
  const assignRes = await apiCall(
    adminToken,
    `/hospitals/${hospital._id}/mother-assignments`,
    "POST",
    {
      motherId: mother._id,
      healthWorkerId: healthWorker._id,
    }
  );

  console.log("Assign response:", assignRes.status, assignRes.data?.message);

  console.log("\nLinking endpoint tests completed.");
}

if (typeof fetch === "undefined") {
  console.error("This script requires Node 18+ with native fetch.");
} else {
  runTests().catch((error) => {
    console.error("Linking test failed:", error);
  });
}
