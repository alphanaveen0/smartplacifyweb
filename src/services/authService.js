import { apiClient, clearSession, getStoredUser, setSession, updateStoredUser, USE_MOCKS } from "./apiClient.js";
import { delay, loadDb, nextId, roles, saveDb } from "./mockData.js";

function createToken(user) {
  return `mock-${user.role}-${user.id}-${Date.now()}`;
}

function publicUser(user) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read profile image."));
    reader.readAsDataURL(file);
  });
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  const value = String(phone).trim().replace(/[^\d+]/g, "");
  const digits = value.replace(/\D/g, "");
  if (!value.startsWith("+") && digits.length === 10) return `+91${digits}`;
  return value;
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new Error("Enter a valid mobile number.");
  }
}

function createOtpToken(phone) {
  return `mock-otp-${normalizePhone(phone)}-${Date.now()}`;
}

async function loginMock(email, password) {
  const db = loadDb();
  const normalizedEmail = normalizeEmail(email);
  validateEmail(normalizedEmail);
  const user = db.users.find((item) => item.email.toLowerCase() === normalizedEmail);

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
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone || payload.mobile);
  validateEmail(email);
  validatePhone(phone);

  if (!roles.includes(payload.role)) {
    throw new Error("Choose a valid role.");
  }

  if (String(payload.password || "").length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (!payload.otpToken || !String(payload.otpToken).includes(phone)) {
    throw new Error("Verify your mobile number before registering.");
  }

  const phoneMatches = (value = "") => normalizePhone(value) === phone;
  if (
    db.users.some((user) => user.email.toLowerCase() === email || phoneMatches(user.phone || user.mobile)) ||
    db.students.some((student) => student.email.toLowerCase() === email || phoneMatches(student.phone)) ||
    db.companies.some((company) => company.email.toLowerCase() === email || phoneMatches(company.phone))
  ) {
    throw new Error("An account with this email or mobile number already exists.");
  }

  const user = {
    id: nextId(db.users),
    name: payload.name,
    email,
    phone,
    mobile: phone,
    password: payload.password,
    role: payload.role,
    profile_image_url: payload.profile_image_url || ""
  };

  if (payload.role === "student") {
    const student = {
      id: nextId(db.students),
      full_name: payload.name,
      email,
      phone,
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
      email,
      phone,
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
    const { avatar, ...registrationPayload } = payload;

    if (!USE_MOCKS) {
      const session = await apiClient("/auth/register", { method: "POST", body: registrationPayload });
      setSession(session);
      if (avatar) {
        try {
          const uploadedUser = await this.uploadAvatar(avatar);
          return { ...session, user: uploadedUser };
        } catch (error) {
          console.warn("Profile image upload failed after registration:", error);
        }
      }
      return session;
    }

    const session = await registerMock(registrationPayload);
    if (avatar) {
      const imageUrl = await fileToDataUrl(avatar);
      const updatedUser = { ...session.user, profile_image_url: imageUrl };
      updateStoredUser(updatedUser);
      return delay({ ...session, user: updatedUser });
    }
    return session;
  },

  async sendRegisterOtp(payload) {
    const phone = normalizePhone(payload.phone);
    const email = normalizeEmail(payload.email || "");
    if (email) validateEmail(email);
    validatePhone(phone);

    if (!USE_MOCKS) {
      return apiClient("/auth/otp/send", { method: "POST", body: { email, phone } });
    }

    const db = loadDb();
    const phoneMatches = (value = "") => normalizePhone(value) === phone;
    if (
      db.users.some((user) => user.email.toLowerCase() === email || phoneMatches(user.phone || user.mobile)) ||
      db.students.some((student) => student.email.toLowerCase() === email || phoneMatches(student.phone)) ||
      db.companies.some((company) => company.email.toLowerCase() === email || phoneMatches(company.phone))
    ) {
      throw new Error("An account with this email or mobile number already exists.");
    }

    return delay({ message: "Demo OTP sent to email and mobile. Use 123456.", devOtp: "123456", expiresInMinutes: 10 });
  },

  async verifyRegisterOtp(payload) {
    const phone = normalizePhone(payload.phone);
    const email = normalizeEmail(payload.email || "");
    if (email) validateEmail(email);
    validatePhone(phone);

    if (!USE_MOCKS) {
      return apiClient("/auth/otp/verify", { method: "POST", body: { email, phone, otp: payload.otp } });
    }

    if (String(payload.otp).trim() !== "123456") {
      throw new Error("Invalid OTP.");
    }
    return delay({ message: "Mobile number verified.", otpToken: createOtpToken(phone) });
  },

  async updateProfile(user, updates) {
    const updatedUser = { ...user, ...updates };

    if (!USE_MOCKS) {
      const serverUser = await apiClient("/auth/me", { method: "PUT", body: updates });
      updateStoredUser(serverUser);
      return serverUser;
    }

    const db = loadDb();
    db.users = db.users.map((item) => (item.id === user.id ? { ...item, ...updates } : item));
    saveDb(db);
    updateStoredUser(updatedUser);
    return delay(updatedUser);
  },

  async uploadAvatar(file) {
    if (!file) {
      throw new Error("Choose a profile image.");
    }

    if (!USE_MOCKS) {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await apiClient("/auth/me/avatar", { method: "POST", body: formData });
      updateStoredUser(result.user);
      return result.user;
    }

    const currentUser = getStoredUser();
    const imageUrl = await fileToDataUrl(file);
    const updatedUser = { ...currentUser, profile_image_url: imageUrl, profileImage: imageUrl };
    const db = loadDb();
    db.users = db.users.map((item) => (item.id === currentUser.id ? { ...item, profile_image_url: imageUrl, profileImage: imageUrl } : item));
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
