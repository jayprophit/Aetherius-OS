
import axios from 'axios';

// Use environment variable if available, otherwise default to local gateway
const API_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) || 'http://localhost:8000';

export interface QuantumTaskResult {
    status: string;
    circuit?: string;
    results?: Record<string, number>;
    energy?: number;
    entanglement_verified?: boolean;
}

export interface ChainStatus {
    height: number;
    last_hash: string;
    quantum_signature: string;
}

class QuantumBackendService {
    private static instance: QuantumBackendService;
    private token: string | null = null;

    private constructor() {}

    public static getInstance(): QuantumBackendService {
        if (!QuantumBackendService.instance) {
            QuantumBackendService.instance = new QuantumBackendService();
        }
        return QuantumBackendService.instance;
    }

    // --- Quantum Agent Interaction ---
    public async runQuantumTask(type: 'entangle' | 'optimize', params?: any): Promise<QuantumTaskResult> {
        try {
            const response = await axios.post(`${API_URL}/process-task`, {
                agent: 'quantum',
                type: type,
                params: params
            });
            return response.data;
        } catch (error) {
            console.warn('Quantum Backend Offline (Simulation Mode Active):', error);
            // Return simulation data if backend is offline to prevent app crash
            return {
                status: 'simulated',
                energy: Math.random(),
                results: { '00': 0.5, '11': 0.5 },
                entanglement_verified: true
            };
        }
    }

    // --- QKD Security Handshake ---
    public async establishSecureChannel(): Promise<boolean> {
        try {
            const response = await axios.post(`${API_URL}/auth/qkd-handshake`);
            if (response.data.quantum_safe) {
                this.token = response.data.session_token;
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // --- Blockchain Data ---
    public async getChainStatus(): Promise<ChainStatus> {
        try {
            const response = await axios.get(`${API_URL}/blockchain/status`);
            return response.data;
        } catch (error) {
            return { height: 0, last_hash: '0x0', quantum_signature: 'none' };
        }
    }
}

export const quantumBackend = QuantumBackendService.getInstance();
