/**
 * Safety Service
 * Requires explicit confirmation for sensitive actions
 * Prevents accidental execution of high-risk commands
 */

class SafetyService {
    constructor() {
        // Pending confirmations: sessionId -> { action, data, timestamp }
        this.pendingConfirmations = new Map();

        // Sensitive action patterns
        this.sensitiveActions = [
            'payment-phonepe',
            'payment-googlepay',
            'payment-paytm',
            'payment-upi',
            'device-control', // Smart home controls
            'gmail-send', // Sending emails
            'whatsapp-send', // Sending messages
            'call-contact', // Making calls
        ];

        // Confirmation timeout (30 seconds)
        this.confirmationTimeout = 30000;
    }

    /**
     * Check if action requires confirmation
     */
    requiresConfirmation(intentType) {
        return this.sensitiveActions.includes(intentType);
    }

    /**
     * Request confirmation for sensitive action
     */
    requestConfirmation(sessionId, intentData) {
        const confirmationMessage = this.generateConfirmationMessage(intentData);

        this.pendingConfirmations.set(sessionId, {
            intent: intentData.type,
            data: intentData,
            timestamp: Date.now(),
            confirmationMessage
        });

        return {
            requiresConfirmation: true,
            message: confirmationMessage,
            timeout: this.confirmationTimeout / 1000 // seconds
        };
    }

    /**
     * Generate confirmation message
     */
    generateConfirmationMessage(intentData) {
        const { type, userInput, metadata } = intentData;

        switch (type) {
            case 'payment-phonepe':
            case 'payment-googlepay':
            case 'payment-paytm':
            case 'payment-upi':
                const app = type.replace('payment-', '').replace('upi', 'UPI app');
                return `You're about to make a payment using ${app}. Please say "Yes, confirm" to proceed.`;

            case 'gmail-send':
                return `You're about to send an email. Please say "Yes, confirm" to proceed.`;

            case 'whatsapp-send':
                return `You're about to send a WhatsApp message. Please say "Yes, confirm" to proceed.`;

            case 'call-contact':
                return `You're about to make a call. Please say "Yes, confirm" to proceed.`;

            case 'device-control':
                const device = metadata?.device || 'device';
                const action = metadata?.action || 'control';
                return `You're about to ${action} ${device}. Please say "Yes, confirm" to proceed.`;

            default:
                return `Please say "Yes, confirm" to proceed with this action.`;
        }
    }

    /**
     * Verify confirmation from user response
     */
    verifyConfirmation(sessionId, userResponse) {
        const pending = this.pendingConfirmations.get(sessionId);

        if (!pending) {
            return {
                confirmed: false,
                expired: true,
                message: 'No pending confirmation found.'
            };
        }

        // Check timeout
        if (Date.now() - pending.timestamp > this.confirmationTimeout) {
            this.pendingConfirmations.delete(sessionId);
            return {
                confirmed: false,
                expired: true,
                message: 'Confirmation timeout. Please try again.'
            };
        }

        const normalized = userResponse.toLowerCase().trim();

        // Check for explicit confirmation
        const confirmationPhrases = [
            'yes confirm',
            'confirm',
            'yes, confirm',
            'confirmed',
            'proceed',
            'go ahead',
            'do it'
        ];

        const confirmed = confirmationPhrases.some(phrase =>
            normalized.includes(phrase)
        );

        if (confirmed) {
            const intentData = pending.data;
            this.pendingConfirmations.delete(sessionId);
            return {
                confirmed: true,
                intent: intentData,
                message: 'Confirmed. Proceeding with action.'
            };
        }

        // Check for cancellation
        const cancellationPhrases = ['cancel', 'no', 'stop', 'abort', 'nevermind'];
        const cancelled = cancellationPhrases.some(phrase =>
            normalized.includes(phrase)
        );

        if (cancelled) {
            this.pendingConfirmations.delete(sessionId);
            return {
                confirmed: false,
                cancelled: true,
                message: 'Action cancelled.'
            };
        }

        // Unclear response - ask again
        return {
            confirmed: false,
            unclear: true,
            message: 'Please say "Yes, confirm" to proceed or "Cancel" to abort.'
        };
    }

    /**
     * Check if session has pending confirmation
     */
    hasPendingConfirmation(sessionId) {
        return this.pendingConfirmations.has(sessionId);
    }

    /**
     * Cancel pending confirmation
     */
    cancelConfirmation(sessionId) {
        this.pendingConfirmations.delete(sessionId);
    }

    /**
     * Cleanup expired confirmations
     */
    cleanup() {
        const now = Date.now();

        for (const [sessionId, pending] of this.pendingConfirmations.entries()) {
            if (now - pending.timestamp > this.confirmationTimeout) {
                this.pendingConfirmations.delete(sessionId);
                console.info('[SAFETY] Expired confirmation:', sessionId);
            }
        }
    }
}

// Export singleton
const safetyService = new SafetyService();

// Auto-cleanup every 10 seconds
setInterval(() => safetyService.cleanup(), 10000);

export default safetyService;
