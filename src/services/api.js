
const API_BASE_URL = "/api";

function getToken() {
  return sessionStorage.getItem("campusfix_token");
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    throw new Error(
      data?.message || data?.detail || `Request failed (${response.status}).`
    );
  }

  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Login failed. Please try again.");
  }

  if (!data.token || !data.email || !data.role) {
    throw new Error("The server returned an unexpected login response.");
  }

  return data;
}

export function getCurrentUser() {
  return apiRequest("/users/me");
}

export function getMyComplaints() {
  return apiRequest("/complaints/my");
}

export function createComplaint(complaint) {
  return apiRequest("/complaints", {
    method: "POST",
    body: JSON.stringify(complaint),
  });


}


export function getAllComplaints() {
  return apiRequest("/complaints");
}


export function getAllUsers() {
  return apiRequest("/users");
}

export function assignTechnician(complaintId, technicianId) {
  const params = new URLSearchParams({
    complaintId: String(complaintId),
    technicianId: String(technicianId),
  });

  return apiRequest(`/assignments?${params.toString()}`, {
    method: "POST",
  });
}


export function getMyAssignments() {
  return apiRequest("/assignments/my");
}

export function startComplaint(complaintId) {
  return apiRequest(`/complaints/${complaintId}/start`, {
    method: "PUT",
  });
}

export function resolveComplaint(complaintId) {
  return apiRequest(`/complaints/${complaintId}/resolve`, {
    method: "PUT",
  });
}


export function getComplaintById(complaintId) {
  return apiRequest(`/complaints/${complaintId}`);
}


export function verifyComplaint(complaintId, approved) {
  return apiRequest(
    `/complaints/${complaintId}/verify?approved=${approved}`,
    {
      method: "PUT",
    }
  );
}

export async function verifyResolution(complaintId, approved) {
  return apiRequest(
    `/complaints/${complaintId}/verify?approved=${approved}`,
    {
      method: "PUT",
    }
  );
}
