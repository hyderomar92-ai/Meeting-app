
import { UserProfile } from '../types';

// Sentinel Local Identity Provider (SLIP)
// A compliant, secure-by-design authentication mock for safeguarding applications.

// Secure User Directory
const SECURE_USERS: UserProfile[] = [
    { 
        id: 'u0', 
        name: 'System Owner', 
        role: 'Super Admin', 
        initials: 'SO', 
        email: 'super@sentinel.edu', 
        status: 'Active' 
    },
    { 
        id: 'u1', 
        name: 'Jane Doe', 
        role: 'Head of Year', 
        initials: 'JD', 
        email: 'jane.doe@sentinel.edu', 
        status: 'Active', 
        allowedYearGroups: ['07', '08'] 
    },
    { 
        id: 'u2', 
        name: 'John Smith', 
        role: 'Teacher', 
        initials: 'JS', 
        email: 'john.smith@sentinel.edu', 
        status: 'Active' 
    },
    { 
        id: 'u3', 
        name: 'Sarah Connor', 
        role: 'DSL', 
        initials: 'SC', 
        email: 'sarah.connor@sentinel.edu', 
        status: 'Active',
        orgId: 'org-1'
    },
    { 
        id: 'u4', 
        name: 'Emily Blunt', 
        role: 'IT Admin', 
        initials: 'EB', 
        email: 'admin@sentinel.edu', 
        status: 'Active', 
        orgId: 'org-1' 
    },
];

class AuthService {
    private currentUser: UserProfile | null = null;
    private readonly STORAGE_KEY = 'sentinel_secure_session';

    constructor() {
        this.loadSession();
    }

    private loadSession() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const session = JSON.parse(saved);
                // Basic session validity check (could add expiration here)
                this.currentUser = session;
            }
        } catch (e) {
            console.error("Session load failed", e);
            this.logout();
        }
    }

    async login(email: string): Promise<UserProfile> {
        // Simulate secure handshake latency
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = SECURE_USERS.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (user) {
            if (user.status !== 'Active') {
                throw new Error('Account is suspended or locked.');
            }
            this.currentUser = user;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            return user;
        }
        
        throw new Error('Invalid credentials provided.');
    }

    async logout(): Promise<void> {
        // Simulate network logout
        await new Promise(resolve => setTimeout(resolve, 400));
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
    }

    getCurrentUser(): UserProfile | null {
        return this.currentUser;
    }

    isAuthenticated(): boolean {
        return !!this.currentUser;
    }
}

export const authService = new AuthService();
