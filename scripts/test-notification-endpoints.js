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

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log("Starting Notification CRUD Tests...");

  let adminToken;
  try {
    adminToken = await login("admin@vactrack.com", "admin123");
  } catch (error) {
    console.warn("Admin login failed. Seed admin or update credentials.");
    return;
  }

  console.log("Fetching users...");
  const usersRes = await apiCall(adminToken, "/users");
  if (!usersRes.data?.data?.length) {
    console.warn("No users found. Seed users before testing.");
    return;
  }

  const targetUser = usersRes.data.data[0];

  console.log("Creating notification...");
  const createRes = await apiCall(adminToken, "/notifications", "POST", {
    userId: targetUser._id,
    title: "Test Notification",
    message: "This is a test notification.",
    type: "system",
    priority: "low",
  });
  console.log("Create status:", createRes.status, createRes.data?.message);

  const notificationId = createRes.data?.data?._id;
  if (!notificationId) {
    console.warn("Notification creation failed.");
    return;
  }

  console.log("Updating notification...");
  const updateRes = await apiCall(adminToken, `/notifications/${notificationId}`, "PUT", {
    title: "Updated Notification",
    priority: "medium",
  });
  console.log("Update status:", updateRes.status, updateRes.data?.message);

  console.log("Marking notification as read...");
  const readRes = await apiCall(adminToken, `/notifications/${notificationId}/read`, "PATCH");
  console.log("Read status:", readRes.status, readRes.data?.message);

  console.log("Deleting notification...");
  const deleteRes = await apiCall(adminToken, `/notifications/${notificationId}`, "DELETE");
  console.log("Delete status:", deleteRes.status, deleteRes.data?.message);

  console.log("Notification CRUD tests completed.");
}

if (typeof fetch === "undefined") {
  console.error("This script requires Node 18+ with native fetch.");
} else {
  runTests().catch((error) => {
    console.error("Notification tests failed:", error);
  });
}
