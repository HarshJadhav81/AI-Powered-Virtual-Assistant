/**
 * Payment Service - UPI Payment Integration
 * [COPILOT-UPGRADE]: PhonePe, Google Pay, Paytm, and UPI payment support
 */

class PaymentService {
  constructor() {
    // UPI app schemes
    this.upiApps = {
      phonepe: 'phonepe://',
      googlepay: 'tez://upi/',
      paytm: 'paytmmp://',
      bhim: 'bhim://'
    };
  }

  /**
   * Generate UPI payment URL
   */
  generateUpiUrl(params) {
    const {
      recipientUpi,
      recipientName,
      amount,
      transactionNote,
      transactionRef
    } = params;

    // Standard UPI URL format
    const upiParams = new URLSearchParams({
      pa: recipientUpi,                    // Payee Address (UPI ID)
      pn: recipientName,                   // Payee Name
      am: amount.toString(),               // Amount
      tn: transactionNote || 'Payment',    // Transaction Note
      tr: transactionRef || Date.now().toString(), // Transaction Reference
      cu: 'INR'                           // Currency
    });

    return `upi://pay?${upiParams.toString()}`;
  }

  /**
   * Pay using PhonePe
   */
  async payWithPhonePe(params) {
    try {
      console.info('[COPILOT-UPGRADE]', 'Initiating PhonePe payment:', params);
      
      const upiUrl = this.generateUpiUrl(params);
      
      // Try PhonePe app first
      const phonePeUrl = `${this.upiApps.phonepe}pay?${new URLSearchParams({
        pa: params.recipientUpi,
        pn: params.recipientName,
        am: params.amount.toString(),
        tn: params.transactionNote || 'Payment',
        cu: 'INR'
      }).toString()}`;

      // Open PhonePe app or fallback to generic UPI
      window.open(phonePeUrl, '_blank') || window.open(upiUrl, '_blank');

      return {
        success: true,
        app: 'PhonePe',
        amount: params.amount,
        recipient: params.recipientName,
        message: `Opening PhonePe to pay ₹${params.amount} to ${params.recipientName}`
      };
    } catch (error) {
      console.error('[PAYMENT-ERROR]:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pay using Google Pay
   */
  async payWithGooglePay(params) {
    try {
      console.info('[COPILOT-UPGRADE]', 'Initiating Google Pay payment:', params);
      
      const upiUrl = this.generateUpiUrl(params);
      
      // Try Google Pay app first
      const gpayUrl = `${this.upiApps.googlepay}pay?${new URLSearchParams({
        pa: params.recipientUpi,
        pn: params.recipientName,
        am: params.amount.toString(),
        tn: params.transactionNote || 'Payment',
        cu: 'INR'
      }).toString()}`;

      window.open(gpayUrl, '_blank') || window.open(upiUrl, '_blank');

      return {
        success: true,
        app: 'Google Pay',
        amount: params.amount,
        recipient: params.recipientName,
        message: `Opening Google Pay to pay ₹${params.amount} to ${params.recipientName}`
      };
    } catch (error) {
      console.error('[PAYMENT-ERROR]:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pay using Paytm
   */
  async payWithPaytm(params) {
    try {
      console.info('[COPILOT-UPGRADE]', 'Initiating Paytm payment:', params);
      
      const upiUrl = this.generateUpiUrl(params);
      
      // Try Paytm app first
      const paytmUrl = `${this.upiApps.paytm}upi?${new URLSearchParams({
        pa: params.recipientUpi,
        pn: params.recipientName,
        am: params.amount.toString(),
        tn: params.transactionNote || 'Payment',
        cu: 'INR'
      }).toString()}`;

      window.open(paytmUrl, '_blank') || window.open(upiUrl, '_blank');

      return {
        success: true,
        app: 'Paytm',
        amount: params.amount,
        recipient: params.recipientName,
        message: `Opening Paytm to pay ₹${params.amount} to ${params.recipientName}`
      };
    } catch (error) {
      console.error('[PAYMENT-ERROR]:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generic UPI payment (opens any installed UPI app)
   */
  async payWithUPI(params) {
    try {
      console.info('[COPILOT-UPGRADE]', 'Initiating UPI payment:', params);
      
      const upiUrl = this.generateUpiUrl(params);
      window.open(upiUrl, '_blank');

      return {
        success: true,
        app: 'UPI',
        amount: params.amount,
        recipient: params.recipientName,
        message: `Opening UPI app to pay ₹${params.amount} to ${params.recipientName}`
      };
    } catch (error) {
      console.error('[PAYMENT-ERROR]:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Smart payment - tries to detect best UPI app
   */
  async smartPay(params) {
    try {
      // Try to detect which UPI app is installed
      // On web, we can't reliably detect installed apps, so we provide options
      
      console.info('[COPILOT-UPGRADE]', 'Smart payment initiated');
      
      // For voice command, default to PhonePe (most popular in India)
      return await this.payWithPhonePe(params);
    } catch (error) {
      console.error('[PAYMENT-ERROR]:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse payment command and extract details
   */
  parsePaymentCommand(command) {
    const lowerCommand = command.toLowerCase();
    
    // Extract amount
    const amountMatch = lowerCommand.match(/(\d+)\s*(rupees?|rs\.?|₹)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract recipient name
    const toMatch = lowerCommand.match(/to\s+([a-z\s]+?)(?:\s+using|\s+via|\s+through|$)/i);
    const recipientName = toMatch ? toMatch[1].trim() : 'Unknown';

    // Extract UPI ID if provided
    const upiMatch = lowerCommand.match(/([a-z0-9._-]+@[a-z]+)/i);
    const recipientUpi = upiMatch ? upiMatch[1] : null;

    // Detect payment app preference
    let preferredApp = null;
    if (lowerCommand.includes('phonepe')) preferredApp = 'phonepe';
    else if (lowerCommand.includes('google pay') || lowerCommand.includes('gpay')) preferredApp = 'googlepay';
    else if (lowerCommand.includes('paytm')) preferredApp = 'paytm';

    return {
      amount,
      recipientName,
      recipientUpi,
      preferredApp,
      transactionNote: `Payment via Voice Assistant`,
      transactionRef: `VA-${Date.now()}`
    };
  }

  /**
   * Execute payment based on voice command
   */
  async executePayment(command, defaultUpiId = null) {
    try {
      const paymentDetails = this.parsePaymentCommand(command);

      // Validate amount
      if (!paymentDetails.amount || paymentDetails.amount <= 0) {
        return {
          success: false,
          error: 'Please specify a valid amount'
        };
      }

      // Use default UPI if not provided in command
      if (!paymentDetails.recipientUpi && defaultUpiId) {
        paymentDetails.recipientUpi = defaultUpiId;
      }

      // Validate UPI ID
      if (!paymentDetails.recipientUpi) {
        return {
          success: false,
          error: 'Please provide recipient UPI ID'
        };
      }

      console.info('[COPILOT-UPGRADE]', 'Payment details:', paymentDetails);

      // Execute payment with preferred app
      switch (paymentDetails.preferredApp) {
        case 'phonepe':
          return await this.payWithPhonePe(paymentDetails);
        case 'googlepay':
          return await this.payWithGooglePay(paymentDetails);
        case 'paytm':
          return await this.payWithPaytm(paymentDetails);
        default:
          return await this.smartPay(paymentDetails);
      }
    } catch (error) {
      console.error('[PAYMENT-ERROR]:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check payment status (requires backend integration)
   */
  async checkPaymentStatus(transactionRef) {
    // This would require backend API integration with payment gateway
    console.info('[COPILOT-UPGRADE]', 'Checking payment status:', transactionRef);
    return {
      status: 'pending',
      message: 'Payment status check requires backend integration'
    };
  }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;
