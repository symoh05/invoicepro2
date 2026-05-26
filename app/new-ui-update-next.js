'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'invoices' | 'quotations'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Apply theme to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('bg-black')
      document.body.classList.remove('bg-white')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.add('bg-white')
      document.body.classList.remove('bg-black')
    }
  }, [isDarkMode])

  // Dummy data
  const invoices = [
    {
      id: '1',
      type: 'invoice',
      number: 'INV-2024-001',
      client_name: 'Tech Solutions Ltd',
      client_email: 'contact@techsolutions.com',
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      valid_until: null,
      total: 45000,
      status: 'paid'
    },
    {
      id: '2',
      type: 'invoice',
      number: 'INV-2024-002',
      client_name: 'Digital Edge Agency',
      client_email: 'hello@digitaledge.com',
      issue_date: '2024-01-20',
      due_date: '2024-02-20',
      valid_until: null,
      total: 125000,
      status: 'pending'
    },
    {
      id: '3',
      type: 'invoice',
      number: 'INV-2024-003',
      client_name: 'Nairobi Web Solutions',
      client_email: 'info@nairobiweb.co.ke',
      issue_date: '2024-02-01',
      due_date: '2024-03-01',
      valid_until: null,
      total: 78000,
      status: 'overdue'
    },
    {
      id: '4',
      type: 'invoice',
      number: 'INV-2024-004',
      client_name: 'Creative Studios KE',
      client_email: 'studio@creativestudios.com',
      issue_date: '2024-02-10',
      due_date: '2024-03-10',
      valid_until: null,
      total: 32000,
      status: 'paid'
    },
    {
      id: '5',
      type: 'invoice',
      number: 'INV-2024-005',
      client_name: 'Smart Solutions Africa',
      client_email: 'info@smartsolutions.co.ke',
      issue_date: '2024-02-15',
      due_date: '2024-03-15',
      valid_until: null,
      total: 95000,
      status: 'pending'
    }
  ]

  const quotations = [
    {
      id: '6',
      type: 'quotation',
      number: 'QUO-2024-001',
      client_name: 'Sunset Properties',
      client_email: 'admin@sunsetproperties.com',
      issue_date: '2024-01-10',
      due_date: null,
      valid_until: '2024-02-10',
      total: 150000,
      status: 'accepted'
    },
    {
      id: '7',
      type: 'quotation',
      number: 'QUO-2024-002',
      client_name: 'Green Energy Kenya',
      client_email: 'hello@greenenergy.co.ke',
      issue_date: '2024-01-25',
      due_date: null,
      valid_until: '2024-02-25',
      total: 89000,
      status: 'pending'
    },
    {
      id: '8',
      type: 'quotation',
      number: 'QUO-2024-003',
      client_name: 'FastTrack Logistics',
      client_email: 'info@fasttracklogistics.com',
      issue_date: '2024-02-05',
      due_date: null,
      valid_until: '2024-03-05',
      total: 210000,
      status: 'expired'
    },
    {
      id: '9',
      type: 'quotation',
      number: 'QUO-2024-004',
      client_name: 'Nairobi Tech Hub',
      client_email: 'contact@nairobi.tech',
      issue_date: '2024-02-12',
      due_date: null,
      valid_until: '2024-03-12',
      total: 67000,
      status: 'accepted'
    }
  ]

  // Combine all items for 'all' tab
  const allItems = [...invoices, ...quotations].sort((a, b) => 
    new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
  )

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    if (!isDarkMode) {
      switch (status.toLowerCase()) {
        case 'paid':
        case 'accepted':
          return 'text-green-600 bg-green-100 border-green-200'
        case 'pending':
          return 'text-yellow-700 bg-yellow-100 border-yellow-200'
        case 'overdue':
        case 'expired':
          return 'text-red-600 bg-red-100 border-red-200'
        default:
          return 'text-gray-600 bg-gray-100 border-gray-200'
      }
    }
    switch (status.toLowerCase()) {
      case 'paid':
      case 'accepted':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'overdue':
      case 'expired':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      default:
        return 'text-gray-400 bg-white/5 border-white/10'
    }
  }

  const stats = {
    totalInvoices: invoices.length,
    totalQuotations: quotations.length,
    totalItems: invoices.length + quotations.length,
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingAmount: [...invoices.filter(i => i.status === 'pending'), ...quotations.filter(q => q.status === 'pending')].reduce((sum, item) => sum + item.total, 0),
  }

  const getFilteredItems = () => {
    let items = []
    if (activeTab === 'invoices') {
      items = invoices
    } else if (activeTab === 'quotations') {
      items = quotations
    } else {
      items = allItems
    }
    
    return items.filter(item =>
      item.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <>
      {/* Custom Cursor - Hide in light mode */}
      {isDarkMode && (
        <div className="fixed w-2 h-2 md:w-3 md:h-3 bg-white rounded-full pointer-events-none z-[9999] transition-transform duration-75"
          style={{ transform: 'translate(-50%, -50%)' }}
          id="custom-cursor"
        />
      )}
      
      {/* Cyber Background - Only in dark mode */}
      {isDarkMode && (
        <>
          <div className="cyber-bg"></div>
          <div className="grid-overlay"></div>
        </>
      )}
      
      {/* Light mode background */}
      {!isDarkMode && (
        <div className="fixed inset-0 bg-gray-50 z-[-2]"></div>
      )}
      
      <div className={`container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl relative z-10 ${!isDarkMode && 'text-gray-900'}`}>
        {/* Simple Navbar */}
        <div className={`flex justify-between items-center py-3 md:py-4 border-b mb-4 md:mb-6 ${isDarkMode ? 'border-white/30' : 'border-gray-200'}`}>
          <Link href="/">
            <div className={`font-['Orbitron'] font-extrabold text-base sm:text-lg md:text-xl lg:text-2xl tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              SIMON<span className={`text-[10px] sm:text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>_CODEZ</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-4 lg:gap-6">
              <Link href="/" className={`transition-colors font-['Orbitron'] text-xs lg:text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>HOME</Link>
              <Link href="/projects" className={`transition-colors font-['Orbitron'] text-xs lg:text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>PROJECTS</Link>
              <Link href="/contact" className={`transition-colors font-['Orbitron'] text-xs lg:text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>CONTACT</Link>
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              {isDarkMode ? (
                <i className="fas fa-sun text-sm"></i>
              ) : (
                <i className="fas fa-moon text-sm"></i>
              )}
            </button>
          </div>
        </div>
        
        <div className="py-4 md:py-8">
          {/* Header */}
          <div className="relative text-center mb-6 md:mb-8">
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none hidden sm:flex"
              style={{
                fontSize: 'clamp(30px, 8vw, 120px)',
                fontWeight: '900',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                letterSpacing: 'clamp(6px, 2vw, 15px)',
                fontFamily: "'Orbitron', monospace",
                whiteSpace: 'nowrap',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              INVOICE
            </div>
            
            <div className="relative z-10">
              <h1 className={`font-['Orbitron'] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                INVOICE<span className={`text-lg sm:text-xl md:text-2xl lg:text-3xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>_PRO</span>
              </h1>
              <div className={`w-12 md:w-16 h-0.5 mx-auto ${isDarkMode ? 'bg-white/30' : 'bg-gray-300'}`}></div>
              <p className={`mt-2 md:mt-3 text-[11px] sm:text-xs md:text-sm max-w-2xl mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage your invoices and quotations
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 md:mb-8">
            <i className={`fas fa-search absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
            <input
              type="text"
              placeholder="Search by number or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-lg md:rounded-xl py-2 sm:py-2.5 md:py-3 pl-8 sm:pl-10 md:pl-11 pr-8 sm:pr-10 md:pr-12 focus:outline-none transition-all text-[11px] sm:text-xs md:text-sm ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:border-white/50' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500 shadow-sm'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 hover:text-white transition-all ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                <i className="fas fa-times text-[10px] sm:text-xs md:text-sm"></i>
              </button>
            )}
          </div>

          {/* Stats Cards - Fixed watermark positioning */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 md:mb-8">
            <div className={`relative rounded-lg md:rounded-xl p-2.5 sm:p-3 md:p-4 border transition-all overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-white/40' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'}`}>
              <i className={`fas fa-file-invoice absolute pointer-events-none ${isDarkMode ? 'text-white/5' : 'text-gray-100'}`}
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  fontSize: '2.5rem',
                  transform: 'rotate(-15deg)'
                }}
              ></i>
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <i className={`fas fa-file-invoice text-base sm:text-lg md:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-700'}`}></i>
                <span className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Invoices</span>
              </div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalInvoices}</div>
            </div>
            <div className={`relative rounded-lg md:rounded-xl p-2.5 sm:p-3 md:p-4 border transition-all overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-white/40' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'}`}>
              <i className={`fas fa-quote-right absolute pointer-events-none ${isDarkMode ? 'text-white/5' : 'text-gray-100'}`}
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  fontSize: '2.5rem',
                  transform: 'rotate(-15deg)'
                }}
              ></i>
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <i className={`fas fa-quote-right text-base sm:text-lg md:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-700'}`}></i>
                <span className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quotations</span>
              </div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalQuotations}</div>
            </div>
            <div className={`relative rounded-lg md:rounded-xl p-2.5 sm:p-3 md:p-4 border transition-all overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-white/40' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'}`}>
              <i className={`fas fa-check-circle absolute pointer-events-none ${isDarkMode ? 'text-green-400/10' : 'text-green-100'}`}
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  fontSize: '2.5rem',
                  transform: 'rotate(-15deg)'
                }}
              ></i>
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <i className="fas fa-check-circle text-base sm:text-lg md:text-2xl text-green-400"></i>
                <span className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Paid</span>
              </div>
              <div className="text-xs sm:text-sm md:text-xl font-bold text-green-400 truncate">{formatCurrency(stats.paidAmount)}</div>
            </div>
            <div className={`relative rounded-lg md:rounded-xl p-2.5 sm:p-3 md:p-4 border transition-all overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-white/40' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'}`}>
              <i className={`fas fa-clock absolute pointer-events-none ${isDarkMode ? 'text-yellow-400/10' : 'text-yellow-100'}`}
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  fontSize: '2.5rem',
                  transform: 'rotate(-15deg)'
                }}
              ></i>
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <i className="fas fa-clock text-base sm:text-lg md:text-2xl text-yellow-400"></i>
                <span className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending</span>
              </div>
              <div className="text-xs sm:text-sm md:text-xl font-bold text-yellow-400 truncate">{formatCurrency(stats.pendingAmount)}</div>
            </div>
          </div>

          {/* Sticky Header Section - Fixed on scroll */}
          <div className="sticky top-0 z-20 bg-inherit pt-2 pb-2">
            {/* Separator Line */}
            <div className="relative mb-4 md:mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}></div>
              </div>
              <div className="relative flex justify-center">
                <span className={`px-4 text-xs font-['Orbitron'] ${isDarkMode ? 'bg-black text-gray-500' : 'bg-gray-50 text-gray-400'}`}>MANAGE</span>
              </div>
            </div>

            {/* Three Tabs - Fixed on scroll */}
            <div className="flex gap-1.5 sm:gap-2 md:gap-3 mb-4 md:mb-5">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 md:py-2.5 px-1 sm:px-2 md:px-3 rounded-lg md:rounded-xl border transition-all duration-300 ${
                  activeTab === 'all'
                    ? isDarkMode 
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-gray-900 text-white border-gray-900 shadow-lg'
                    : isDarkMode
                      ? 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10 hover:text-white'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <i className={`fas fa-layer-group text-[10px] sm:text-xs md:text-sm ${activeTab === 'all' && !isDarkMode ? 'text-white' : activeTab === 'all' && isDarkMode ? 'text-black' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <span className="font-['Orbitron'] font-bold text-[9px] sm:text-[10px] md:text-xs">ALL</span>
                <span className={`text-[8px] sm:text-[9px] md:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                  activeTab === 'all' 
                    ? isDarkMode 
                      ? 'bg-black/10 text-black' 
                      : 'bg-white/20 text-white'
                    : isDarkMode
                      ? 'bg-white/10 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {stats.totalItems}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 md:py-2.5 px-1 sm:px-2 md:px-3 rounded-lg md:rounded-xl border transition-all duration-300 ${
                  activeTab === 'invoices'
                    ? isDarkMode 
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-gray-900 text-white border-gray-900 shadow-lg'
                    : isDarkMode
                      ? 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10 hover:text-white'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <i className={`fas fa-file-invoice text-[10px] sm:text-xs md:text-sm ${activeTab === 'invoices' && !isDarkMode ? 'text-white' : activeTab === 'invoices' && isDarkMode ? 'text-black' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <span className="font-['Orbitron'] font-bold text-[9px] sm:text-[10px] md:text-xs">INVOICES</span>
                <span className={`text-[8px] sm:text-[9px] md:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                  activeTab === 'invoices' 
                    ? isDarkMode 
                      ? 'bg-black/10 text-black' 
                      : 'bg-white/20 text-white'
                    : isDarkMode
                      ? 'bg-white/10 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {invoices.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('quotations')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 md:py-2.5 px-1 sm:px-2 md:px-3 rounded-lg md:rounded-xl border transition-all duration-300 ${
                  activeTab === 'quotations'
                    ? isDarkMode 
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-gray-900 text-white border-gray-900 shadow-lg'
                    : isDarkMode
                      ? 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10 hover:text-white'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <i className={`fas fa-quote-right text-[10px] sm:text-xs md:text-sm ${activeTab === 'quotations' && !isDarkMode ? 'text-white' : activeTab === 'quotations' && isDarkMode ? 'text-black' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <span className="font-['Orbitron'] font-bold text-[9px] sm:text-[10px] md:text-xs">QUOTATIONS</span>
                <span className={`text-[8px] sm:text-[9px] md:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                  activeTab === 'quotations' 
                    ? isDarkMode 
                      ? 'bg-black/10 text-black' 
                      : 'bg-white/20 text-white'
                    : isDarkMode
                      ? 'bg-white/10 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {quotations.length}
                </span>
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 sm:space-y-3">
            {filteredItems.length === 0 ? (
              <div className={`text-center py-8 sm:py-10 md:py-12 rounded-lg md:rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-200'}`}>
                <i className={`fas fa-search text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item)
                    setShowModal(true)
                  }}
                  className={`relative rounded-lg md:rounded-xl p-3 sm:p-4 border transition-all cursor-pointer group w-full overflow-hidden ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/20 hover:border-white/40' 
                      : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'
                  }`}
                >
                  {/* Watermark - INV or QUO */}
                  <div 
                    className={`absolute pointer-events-none select-none font-black font-['Orbitron'] ${isDarkMode ? 'text-white/5' : 'text-gray-100'}`}
                    style={{
                      bottom: '-10px',
                      right: '-10px',
                      fontSize: '3rem',
                      transform: 'rotate(-15deg)',
                      zIndex: 0
                    }}
                  >
                    {item.type === 'invoice' ? 'INV' : 'QUO'}
                  </div>
                  
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <i className={`fas fa-hashtag text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`font-['Orbitron'] font-bold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.number}
                        </span>
                        {/* Full word badge - INVOICE or QUOTATION with gray styling */}
                        <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full border ${isDarkMode ? 'border-gray-500/50 bg-gray-500/10 text-gray-300' : 'border-gray-400 bg-gray-100 text-gray-600'}`}>
                          {item.type === 'invoice' ? 'INVOICE' : 'QUOTATION'}
                        </span>
                      </div>
                      <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <i className={`fas fa-building text-[9px] sm:text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <span className={`text-[10px] sm:text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.client_name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-auto pt-1">
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-[9px] sm:text-xs text-gray-500">
                        <span className="flex items-center gap-0.5 sm:gap-1"><i className="far fa-calendar"></i>{formatDate(item.issue_date)}</span>
                        {item.type === 'invoice' ? (
                          <span className="flex items-center gap-0.5 sm:gap-1"><i className="far fa-clock"></i>Due: {formatDate(item.due_date)}</span>
                        ) : (
                          <span className="flex items-center gap-0.5 sm:gap-1"><i className="far fa-hourglass"></i>Valid: {formatDate(item.valid_until)}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm sm:text-base md:text-lg font-bold whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Button */}
          <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 md:right-8 z-20">
            <button className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
              <i className="fas fa-plus text-base sm:text-lg md:text-xl"></i>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className={`mt-8 md:mt-10 pt-3 md:pt-4 border-t text-center text-[9px] sm:text-[10px] md:text-xs pb-4 md:pb-6 ${isDarkMode ? 'border-white/20 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
          <i className={`fas fa-shield-haltered mr-1 sm:mr-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}></i>
          SIMON NGUGI — NAIROBI, KE — full-stack • mobile • cyber security enthusiast
        </footer>
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className={`border rounded-xl md:rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-gray-200'}`}>
            <div className={`sticky top-0 p-3 sm:p-4 flex justify-between items-center border-b ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-['Orbitron'] text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedItem.type === 'invoice' ? 'Invoice Details' : 'Quotation Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all flex items-center justify-center ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <i className={`fas fa-times text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-700'}`}></i>
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div className="text-center pb-2 sm:pb-3 border-b border-white/10">
                <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${getStatusColor(selectedItem.status)} text-[10px] sm:text-sm mb-1 sm:mb-2`}>
                  <span>{selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}</span>
                </div>
                <div className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.number}</div>
                <div className={`mt-1 inline-flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <i className={`fas ${selectedItem.type === 'invoice' ? 'fa-file-invoice' : 'fa-quote-right'}`}></i>
                  <span>{selectedItem.type === 'invoice' ? 'INVOICE' : 'QUOTATION'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`text-[10px] sm:text-xs block mb-0.5 sm:mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Client Name</label>
                  <p className={`font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.client_name}</p>
                </div>
                <div>
                  <label className={`text-[10px] sm:text-xs block mb-0.5 sm:mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                  <p className={`text-[10px] sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedItem.client_email || '—'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`text-[10px] sm:text-xs block mb-0.5 sm:mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Issue Date</label>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedItem.issue_date)}</p>
                </div>
                <div>
                  <label className={`text-[10px] sm:text-xs block mb-0.5 sm:mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedItem.type === 'invoice' ? 'Due Date' : 'Valid Until'}
                  </label>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(selectedItem.type === 'invoice' ? selectedItem.due_date : selectedItem.valid_until)}
                  </p>
                </div>
              </div>
              
              <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <label className={`text-[10px] sm:text-xs block mb-0.5 sm:mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</label>
                <p className={`text-xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedItem.total)}</p>
              </div>
              
              <div className="flex gap-2 sm:gap-3 pt-2">
                <button className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  <i className="fas fa-download text-[10px] sm:text-sm"></i>
                  PDF
                </button>
                <button className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  <i className="fas fa-share-alt text-[10px] sm:text-sm"></i>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom cursor script - Only in dark mode */}
      {isDarkMode && (
        <script dangerouslySetInnerHTML={{
          __html: `
            const cursor = document.getElementById('custom-cursor');
            if (cursor) {
              document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
              });
            }
          `
        }} />
      )}
    </>
  )
}
