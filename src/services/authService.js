import { apiClient, clearSession, getStoredUser, setSession, updateStoredUser, USE_MOCKS } from "./apiClient.js";
import { delay, loadDb, nextId, roles, saveDb } from "./mockData.js";

function createToken(user) {
  return `mock-${user.role}-${user.id}-${Date.now()}`;
}

function publicUser(user) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

async function loginMock(email, password) {
  const db = loadDb();
  const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  const session = {
    token: createToken(user),
    user: publicUser(user)
  };

  setSession(session);
  return delay(session);
}

async function registerMock(payload) {
  const db = loadDb();

  if (!roles.includes(payload.role)) {
    throw new Error("Choose a valid role.");
  }

  if (db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
    id: nextId(db.users),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role
  };

  if (payload.role === "student") {
    const student = {
      id: nextId(db.students),
      full_name: payload.name,
      email: payload.email,
      phone: "",
      college: "Gurugram University",
      course: "",
      branch: "",
      graduation_year: 2027,
      cgpa: 0,
      percentage: 0,
      backlogs: 0,
      skills: "",
      certifications: "",
      projects: "",
      experience: "",
      placement_status: "PROFILE_PENDING",
      resume_name: "",
      resume_updated_at: ""
    };
    db.students = [student, ...db.students];
    user.student_id = student.id;
  }

  if (payload.role === "company") {
    const company = {
      id: nextId(db.companies),
      name: payload.name,
      email: payload.email,
      phone: "",
      website: "",
      industry: "",
      location: "",
      description: "",
      logo: payload.name.slice(0, 2).toUpperCase(),
      verified: false
    };
    db.companies = [company, ...db.companies];
    user.company_id = company.id;
  }

  db.users = [user, ...db.users];
  saveDb(db);

  const session = {
    token: createToken(user),
    user: publicUser(user)
  };

  setSession(session);
  return delay(session);
}

export const authService = {
  getCurrentUser() {
    return getStoredUser();
  },

  async login(email, password) {
    if (!USE_MOCKS) {
      const session = await apiClient("/auth/login", { method: "POST", body: { email, password } });
      setSession(session);
      return session;
    }

    return loginMock(email, password);
  },

  async register(payload) {
    if (!USE_MOCKS) {
      const session = await apiClient("/auth/register", { method: "POST", body: payload });
      setSession(session);
      return session;
    }

    return registerMock(payload);
  },

  async updateProfile(user, updates) {
    const updatedUser = { ...user, ...updates };

    if (!USE_MOCKS) {
      await apiClient("/auth/me", { method: "PUT", body: updates });
      updateStoredUser(updatedUser);
      return updatedUser;
    }

    const db = loadDb();
    db.users = db.users.map((item) => (item.id === user.id ? { ...item, ...updates } : item));
    saveDb(db);
    updateStoredUser(updatedUser);
    return delay(updatedUser);
  },

  async requestPasswordReset(email) {
    if (!USE_MOCKS) {
      return apiClient("/auth/forgot-password", { method: "POST", body: { email } });
    }

    return delay({ message: `Password reset instructions were sent to ${email} in mock mode.` });
  },

  logout() {
    clearSession();
  }
};
