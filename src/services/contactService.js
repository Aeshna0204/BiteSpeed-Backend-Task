const prisma = require('../db');

class ContactService {
  /**
   * Find all contacts that match the given email or phone number
   */
  async findMatchingContacts(email, phoneNumber) {
    const whereConditions = [];
    
    if (email) {
      whereConditions.push({ email });
    }
    
    if (phoneNumber) {
      whereConditions.push({ phoneNumber });
    }

    if (whereConditions.length === 0) {
      return [];
    }

    return await prisma.contact.findMany({
      where: {
        AND: [
          { deletedAt: null },
          { OR: whereConditions }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Get all contacts in a linked network starting from given contact IDs
   */
  async getAllLinkedContacts(contactIds) {
    if (!contactIds.length) return [];

    
    const contacts = await prisma.$queryRaw`
      WITH RECURSIVE contact_tree AS (
        -- Base case: start with the given contact IDs
        SELECT id, phone_number, email, linked_id, link_precedence, created_at, updated_at
        FROM contacts 
        WHERE id = ANY(${contactIds}) AND deleted_at IS NULL
        
        UNION
        
        -- Recursive case: find all linked contacts
        SELECT c.id, c.phone_number, c.email, c.linked_id, c.link_precedence, c.created_at, c.updated_at
        FROM contacts c
        INNER JOIN contact_tree ct ON (c.linked_id = ct.id OR c.id = ct.linked_id)
        WHERE c.deleted_at IS NULL
      )
      SELECT DISTINCT * FROM contact_tree
      ORDER BY created_at ASC;
    `;

    return contacts;
  }

  /**
   * Find the primary contact (oldest one)
   */
  findPrimaryContact(contacts) {
    return contacts.reduce((oldest, contact) => {
      const oldestDate = new Date(oldest.created_at || oldest.createdAt);
      const currentDate = new Date(contact.created_at || contact.createdAt);
      return currentDate < oldestDate ? contact : oldest;
    });
  }

  /**
   * Create a new primary contact
   */
  async createPrimaryContact(email, phoneNumber) {
    return await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: null,
        linkPrecedence: 'primary'
      }
    });
  }

  /**
   * Create a new secondary contact
   */
  async createSecondaryContact(email, phoneNumber, primaryContactId) {
    return await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primaryContactId,
        linkPrecedence: 'secondary'
      }
    });
  }

  /**
   * Update a contact to be secondary
   */
  async updateToSecondary(contactId, primaryContactId) {
    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        linkedId: primaryContactId,
        linkPrecedence: 'secondary',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Check if the request contains new information not present in existing contacts
   */
  hasNewInformation(email, phoneNumber, existingContacts) {
    const hasNewEmail = email && !existingContacts.some(c => 
      (c.email || c.email) === email
    );
    const hasNewPhone = phoneNumber && !existingContacts.some(c => 
      (c.phoneNumber || c.phone_number) === phoneNumber
    );
    
    return hasNewEmail || hasNewPhone;
  }

  /**
   * Check if there's an exact match for the given email and phone
   */
  hasExactMatch(email, phoneNumber, existingContacts) {
    return existingContacts.some(contact => {
      const contactEmail = contact.email || contact.email;
      const contactPhone = contact.phoneNumber || contact.phone_number;
      return contactEmail === email && contactPhone === phoneNumber;
    });
  }

  /**
   * Format the response according to the required structure
   */
  formatResponse(allContacts) {
    // Find primary contact
    const primaryContact = allContacts.find(c => 
      (c.linkPrecedence || c.link_precedence) === 'primary'
    );
    
    if (!primaryContact) {
      throw new Error('No primary contact found');
    }

    // Get secondary contacts
    const secondaryContacts = allContacts.filter(c => 
      (c.linkPrecedence || c.link_precedence) === 'secondary'
    );

    // Collect unique emails and phone numbers
    const emails = [];
    const phoneNumbers = [];

    // Add primary contact info first
    const primaryEmail = primaryContact.email || primaryContact.email;
    const primaryPhone = primaryContact.phoneNumber || primaryContact.phone_number;
    
    if (primaryEmail) emails.push(primaryEmail);
    if (primaryPhone) phoneNumbers.push(primaryPhone);

    // Add secondary contact info
    secondaryContacts.forEach(contact => {
      const contactEmail = contact.email || contact.email;
      const contactPhone = contact.phoneNumber || contact.phone_number;
      
      if (contactEmail && !emails.includes(contactEmail)) {
        emails.push(contactEmail);
      }
      if (contactPhone && !phoneNumbers.includes(contactPhone)) {
        phoneNumbers.push(contactPhone);
      }
    });

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id)
      }
    };
  }

  /**
   * Main identify logic
   */
  async identify(email, phoneNumber) {
    // Validate input
    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    // Find existing contacts
    const existingContacts = await this.findMatchingContacts(email, phoneNumber);

    // Case 1: No existing contacts - create new primary
    if (existingContacts.length === 0) {
      const newContact = await this.createPrimaryContact(email, phoneNumber);
      return this.formatResponse([newContact]);
    }

    // Get all linked contacts
    const contactIds = existingContacts.map(c => c.id);
    const allLinkedContacts = await this.getAllLinkedContacts(contactIds);

    // Case 2: Check if we need to create a new secondary contact
    const hasExactMatch = this.hasExactMatch(email, phoneNumber, allLinkedContacts);
    const hasNewInfo = this.hasNewInformation(email, phoneNumber, allLinkedContacts);

    if (!hasExactMatch && hasNewInfo) {
      const primaryContact = this.findPrimaryContact(allLinkedContacts);
      const newSecondary = await this.createSecondaryContact(
        email, 
        phoneNumber, 
        primaryContact.id
      );
      allLinkedContacts.push(newSecondary);
    }

    // Case 3: Handle multiple primary contacts (merge them)
    const primaryContacts = allLinkedContacts.filter(c => 
      (c.linkPrecedence || c.link_precedence) === 'primary'
    );

    if (primaryContacts.length > 1) {
      const oldestPrimary = this.findPrimaryContact(primaryContacts);
      
      // Convert other primaries to secondary
      for (const primary of primaryContacts) {
        if (primary.id !== oldestPrimary.id) {
          await this.updateToSecondary(primary.id, oldestPrimary.id);
          // Update the local object to reflect the change
          primary.linkedId = oldestPrimary.id;
          primary.linkPrecedence = 'secondary';
          primary.linked_id = oldestPrimary.id;
          primary.link_precedence = 'secondary';
        }
      }
    }

    return this.formatResponse(allLinkedContacts);
  }
}

module.exports = new ContactService();