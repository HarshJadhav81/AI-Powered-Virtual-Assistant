/**
 * Contacts Service - Contact Management
 * Handles phone contacts access and management
 * Uses Contact Picker API (experimental)
 */

class ContactsService {
  constructor() {
    this.contacts = [];
  }

  /**
   * Check if Contacts API is supported
   */
  checkSupport() {
    const hasContactPicker = 'contacts' in navigator && 'ContactsManager' in window;
    
    return {
      supported: hasContactPicker,
      message: hasContactPicker 
        ? 'Contact Picker API is supported' 
        : 'Contact Picker API not supported in this browser',
      note: 'Contact Picker API is experimental and only available on Android Chrome',
      features: hasContactPicker ? ['select', 'call', 'message'] : [],
      browserSupport: {
        android: true,
        iOS: false,
        desktop: false
      }
    };
  }

  /**
   * Pick contacts from device
   * @param {object} options - Selection options
   */
  async pickContacts(options = {}) {
    try {
      const support = this.checkSupport();
      if (!support.supported) {
        return {
          success: false,
          message: support.message,
          fallback: 'manual',
          note: 'Please enter contact manually'
        };
      }

      const properties = options.properties || ['name', 'tel', 'email'];
      const opts = {
        multiple: options.multiple !== false
      };

      const selectedContacts = await navigator.contacts.select(properties, opts);

      this.contacts = selectedContacts.map(contact => ({
        name: contact.name ? contact.name[0] : 'Unknown',
        phone: contact.tel ? contact.tel[0] : null,
        email: contact.email ? contact.email[0] : null
      }));

      console.info('[CONTACTS]', `Selected ${this.contacts.length} contacts`);

      return {
        success: true,
        message: `Selected ${this.contacts.length} contact${this.contacts.length !== 1 ? 's' : ''}`,
        contacts: this.contacts,
        count: this.contacts.length
      };
    } catch (error) {
      console.error('[CONTACTS-ERROR]:', error);
      
      if (error.name === 'InvalidStateError') {
        return {
          success: false,
          message: 'Contact picker is already open',
          error: error.message
        };
      }

      return {
        success: false,
        message: 'Failed to pick contacts',
        error: error.message,
        fallback: 'manual'
      };
    }
  }

  /**
   * Pick a single contact
   */
  async pickSingleContact() {
    return await this.pickContacts({ multiple: false });
  }

  /**
   * Get selected contacts
   */
  getSelectedContacts() {
    return {
      contacts: this.contacts,
      count: this.contacts.length,
      hasContacts: this.contacts.length > 0
    };
  }

  /**
   * Call a contact
   * @param {string} phoneNumber - Phone number to call
   */
  callContact(phoneNumber) {
    try {
      if (!phoneNumber) {
        return {
          success: false,
          message: 'Phone number required'
        };
      }

      // Clean phone number
      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
      const telUrl = `tel:${cleanNumber}`;

      window.location.href = telUrl;

      return {
        success: true,
        message: `Calling ${phoneNumber}`,
        phoneNumber: cleanNumber
      };
    } catch (error) {
      console.error('[CONTACTS-CALL-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to initiate call',
        error: error.message
      };
    }
  }

  /**
   * Send SMS to contact
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   */
  sendSMS(phoneNumber, message = '') {
    try {
      if (!phoneNumber) {
        return {
          success: false,
          message: 'Phone number required'
        };
      }

      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
      const smsUrl = `sms:${cleanNumber}${message ? `?body=${encodeURIComponent(message)}` : ''}`;

      window.location.href = smsUrl;

      return {
        success: true,
        message: `Opening SMS to ${phoneNumber}`,
        phoneNumber: cleanNumber
      };
    } catch (error) {
      console.error('[CONTACTS-SMS-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error.message
      };
    }
  }

  /**
   * Send email to contact
   * @param {string} email - Email address
   * @param {object} options - Email options
   */
  sendEmail(email, options = {}) {
    try {
      if (!email) {
        return {
          success: false,
          message: 'Email address required'
        };
      }

      let mailtoUrl = `mailto:${email}`;
      const params = [];

      if (options.subject) {
        params.push(`subject=${encodeURIComponent(options.subject)}`);
      }
      if (options.body) {
        params.push(`body=${encodeURIComponent(options.body)}`);
      }
      if (options.cc) {
        params.push(`cc=${encodeURIComponent(options.cc)}`);
      }

      if (params.length > 0) {
        mailtoUrl += `?${params.join('&')}`;
      }

      window.location.href = mailtoUrl;

      return {
        success: true,
        message: `Opening email to ${email}`,
        email
      };
    } catch (error) {
      console.error('[CONTACTS-EMAIL-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  /**
   * Search contacts by name
   * @param {string} query - Search query
   */
  searchContacts(query) {
    if (!query) {
      return {
        success: true,
        contacts: this.contacts,
        count: this.contacts.length
      };
    }

    const filtered = this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      contacts: filtered,
      count: filtered.length,
      query
    };
  }

  /**
   * Add contact manually (mock - stores in memory only)
   * @param {object} contactData - Contact data
   */
  addContact(contactData) {
    try {
      const contact = {
        name: contactData.name || 'Unknown',
        phone: contactData.phone || null,
        email: contactData.email || null,
        id: Date.now().toString()
      };

      this.contacts.push(contact);

      return {
        success: true,
        message: 'Contact added',
        contact,
        note: 'Contact stored in memory only. Not saved to device.'
      };
    } catch (error) {
      console.error('[CONTACTS-ADD-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to add contact',
        error: error.message
      };
    }
  }

  /**
   * Clear selected contacts
   */
  clearContacts() {
    this.contacts = [];
    return {
      success: true,
      message: 'Contacts cleared'
    };
  }

  /**
   * Export contacts as VCF (vCard)
   */
  exportToVCard(contact) {
    try {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
${contact.phone ? `TEL:${contact.phone}` : ''}
${contact.email ? `EMAIL:${contact.email}` : ''}
END:VCARD`;

      const blob = new Blob([vcard], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contact.name.replace(/\s+/g, '-')}.vcf`;
      link.click();

      return {
        success: true,
        message: 'Contact exported as vCard',
        filename: `${contact.name}.vcf`
      };
    } catch (error) {
      console.error('[CONTACTS-EXPORT-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to export contact',
        error: error.message
      };
    }
  }

  /**
   * Get contact by index
   */
  getContact(index) {
    if (index < 0 || index >= this.contacts.length) {
      return {
        success: false,
        message: 'Invalid contact index'
      };
    }

    return {
      success: true,
      contact: this.contacts[index]
    };
  }

  /**
   * Get contacts count
   */
  getCount() {
    return this.contacts.length;
  }
}

// Export singleton instance
const contactsService = new ContactsService();
export default contactsService;
