
import axios from 'axios';

class OllamaService {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:11434';
        this.model = 'llama3'; // Default model, can be configured
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            await axios.get(`${this.baseUrl}/api/tags`);
            console.log('[OLLAMA] Local instance detected and available.');
            this.isAvailable = true;
        } catch (error) {
            console.log('[OLLAMA] Local instance not detected. Offline LLM disabled.');
            this.isAvailable = false;
        }
    }

    async generateResponse(prompt) {
        if (!this.isAvailable) return null;

        try {
            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false
            });

            if (response.data && response.data.response) {
                return response.data.response;
            }
        } catch (error) {
            console.error('[OLLAMA] Generation failed:', error.message);
            // If it fails once, mark as unavailable to prevent hanging
            if (error.code === 'ECONNREFUSED') {
                this.isAvailable = false;
            }
        }
        return null;
    }
}

const ollamaService = new OllamaService();
export default ollamaService;
