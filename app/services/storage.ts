import AsyncStorage from '@react-native-async-storage/async-storage';

// Data Models
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  clientName: string;
  issueDate: Date;
  validUntil: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  terms: string[];
  status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// Storage Keys
const STORAGE_KEYS = {
  CLIENTS: '@InvoicePro:clients',
  INVOICES: '@InvoicePro:invoices',
  QUOTATIONS: '@InvoicePro:quotations',
  SETTINGS: '@InvoicePro:settings',
  NEXT_INVOICE_NUMBER: '@InvoicePro:nextInvoiceNumber',
  NEXT_QUOTATION_NUMBER: '@InvoicePro:nextQuotationNumber',
};

// Helper functions
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Format currency in KSH
export const formatCurrency = (amount: number): string => {
  return `Ksh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Storage Service
class StorageService {
  // Clients
  async saveClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    try {
      const clients = await this.getClients();
      const newClient: Client = {
        ...client,
        id: generateId(),
        createdAt: new Date(),
      };
      
      clients.push(newClient);
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      return newClient;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const clients = await this.getClients();
      const filteredClients = clients.filter(client => client.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filteredClients));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Invoices
  async getNextInvoiceNumber(): Promise<string> {
    try {
      const nextNumber = await AsyncStorage.getItem(STORAGE_KEYS.NEXT_INVOICE_NUMBER);
      const currentNumber = nextNumber ? parseInt(nextNumber) : 1;
      
      // Save next number
      await AsyncStorage.setItem(STORAGE_KEYS.NEXT_INVOICE_NUMBER, (currentNumber + 1).toString());
      
      // Format with leading zeros
      return `INV-${currentNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      return `INV-${Date.now().toString().slice(-4)}`;
    }
  }

  async saveInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const invoices = await this.getInvoices();
      const newInvoice: Invoice = {
        ...invoice,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      invoices.push(newInvoice);
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      return newInvoice;
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
      const invoices = data ? JSON.parse(data) : [];
      
      // Convert date strings back to Date objects
      return invoices.map((invoice: any) => ({
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        createdAt: new Date(invoice.createdAt),
        updatedAt: new Date(invoice.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      const index = invoices.findIndex(invoice => invoice.id === id);
      
      if (index !== -1) {
        invoices[index].status = status;
        invoices[index].updatedAt = new Date();
        await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      const filteredInvoices = invoices.filter(invoice => invoice.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filteredInvoices));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Quotations
  async getNextQuotationNumber(): Promise<string> {
    try {
      const nextNumber = await AsyncStorage.getItem(STORAGE_KEYS.NEXT_QUOTATION_NUMBER);
      const currentNumber = nextNumber ? parseInt(nextNumber) : 1;
      
      // Save next number
      await AsyncStorage.setItem(STORAGE_KEYS.NEXT_QUOTATION_NUMBER, (currentNumber + 1).toString());
      
      // Format with leading zeros
      return `QT-${currentNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error getting next quotation number:', error);
      return `QT-${Date.now().toString().slice(-4)}`;
    }
  }

  async saveQuotation(quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quotation> {
    try {
      const quotations = await this.getQuotations();
      const newQuotation: Quotation = {
        ...quotation,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      quotations.push(newQuotation);
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
      return newQuotation;
    } catch (error) {
      console.error('Error saving quotation:', error);
      throw error;
    }
  }

  async getQuotations(): Promise<Quotation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.QUOTATIONS);
      const quotations = data ? JSON.parse(data) : [];
      
      // Convert date strings back to Date objects
      return quotations.map((quotation: any) => ({
        ...quotation,
        issueDate: new Date(quotation.issueDate),
        validUntil: new Date(quotation.validUntil),
        createdAt: new Date(quotation.createdAt),
        updatedAt: new Date(quotation.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting quotations:', error);
      return [];
    }
  }

  async updateQuotationStatus(id: string, status: Quotation['status']): Promise<void> {
    try {
      const quotations = await this.getQuotations();
      const index = quotations.findIndex(quotation => quotation.id === id);
      
      if (index !== -1) {
        quotations[index].status = status;
        quotations[index].updatedAt = new Date();
        await AsyncStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
      }
    } catch (error) {
      console.error('Error updating quotation status:', error);
      throw error;
    }
  }

  async deleteQuotation(id: string): Promise<void> {
    try {
      const quotations = await this.getQuotations();
      const filteredQuotations = quotations.filter(quotation => quotation.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(filteredQuotations));
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error;
    }
  }

  // Statistics
  async getDashboardStats() {
    const invoices = await this.getInvoices();
    const quotations = await this.getQuotations();
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter invoices for current month
    const monthlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      return invoiceDate.getMonth() === currentMonth && 
             invoiceDate.getFullYear() === currentYear;
    });
    
    // Filter pending invoices
    const pendingInvoices = invoices.filter(invoice => 
      invoice.status === 'pending'
    );
    
    // Calculate total revenue for current month
    const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Get active (pending) quotations
    const activeQuotations = quotations.filter(quotation => 
      quotation.status === 'pending'
    );
    
    return {
      totalInvoices: invoices.length,
      activeQuotes: activeQuotations.length,
      monthlyRevenue,
      pendingPayments: pendingInvoices.length,
    };
  }

  // Clear all data (for debugging)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CLIENTS,
        STORAGE_KEYS.INVOICES,
        STORAGE_KEYS.QUOTATIONS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.NEXT_INVOICE_NUMBER,
        STORAGE_KEYS.NEXT_QUOTATION_NUMBER,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const storage = new StorageService();