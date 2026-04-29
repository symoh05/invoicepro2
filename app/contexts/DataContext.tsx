import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, Invoice, Quotation, Client, formatCurrency } from '../services/storage';

interface DataContextType {
  // Data
  invoices: Invoice[];
  quotations: Quotation[];
  clients: Client[];
  stats: {
    totalInvoices: number;
    activeQuotes: number;
    monthlyRevenue: number;
    pendingPayments: number;
  };
  
  // Actions
  refreshData: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Quotation>;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  updateQuotationStatus: (id: string, status: Quotation['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Helpers
  formatCurrency: (amount: number) => string;
  getNextInvoiceNumber: () => Promise<string>;
  getNextQuotationNumber: () => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    activeQuotes: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });

  const refreshData = async () => {
    try {
      const [invoicesData, quotationsData, clientsData, statsData] = await Promise.all([
        storage.getInvoices(),
        storage.getQuotations(),
        storage.getClients(),
        storage.getDashboardStats(),
      ]);

      // Sort by date (newest first)
      const sortedInvoices = invoicesData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const sortedQuotations = quotationsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setInvoices(sortedInvoices);
      setQuotations(sortedQuotations);
      setClients(clientsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
    const newInvoice = await storage.saveInvoice(invoice);
    await refreshData();
    return newInvoice;
  };

  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quotation> => {
    const newQuotation = await storage.saveQuotation(quotation);
    await refreshData();
    return newQuotation;
  };

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const newClient = await storage.saveClient(client);
    await refreshData();
    return newClient;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']): Promise<void> => {
    await storage.updateInvoiceStatus(id, status);
    await refreshData();
  };

  const updateQuotationStatus = async (id: string, status: Quotation['status']): Promise<void> => {
    await storage.updateQuotationStatus(id, status);
    await refreshData();
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    await storage.deleteInvoice(id);
    await refreshData();
  };

  const deleteQuotation = async (id: string): Promise<void> => {
    await storage.deleteQuotation(id);
    await refreshData();
  };

  const deleteClient = async (id: string): Promise<void> => {
    await storage.deleteClient(id);
    await refreshData();
  };

  const getNextInvoiceNumber = async (): Promise<string> => {
    return await storage.getNextInvoiceNumber();
  };

  const getNextQuotationNumber = async (): Promise<string> => {
    return await storage.getNextQuotationNumber();
  };

  useEffect(() => {
    refreshData();
  }, []);

  const value: DataContextType = {
    invoices,
    quotations,
    clients,
    stats,
    refreshData,
    addInvoice,
    addQuotation,
    addClient,
    updateInvoiceStatus,
    updateQuotationStatus,
    deleteInvoice,
    deleteQuotation,
    deleteClient,
    formatCurrency,
    getNextInvoiceNumber,
    getNextQuotationNumber,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};