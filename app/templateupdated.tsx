'use client'

import { useState } from 'react'

export default function TemplatePage() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Sample invoice data
  const invoiceData = {
    invoiceNumber: 'INV-2024-001',
    clientName: 'Tech Solutions Ltd',
    clientEmail: 'contact@techsolutions.com',
    clientPhone: '+254 712 345 678',
    clientAddress: 'Nairobi, Kenya',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    items: [
      { description: 'Website Development', quantity: 1, price: 50000, total: 50000 },
      { description: 'UI/UX Design', quantity: 1, price: 25000, total: 25000 },
      { description: 'SEO Optimization', quantity: 1, price: 15000, total: 15000 },
    ],
    discount: 5000,
    subtotal: 90000,
    total: 85000,
    status: 'paid'
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-100'} flex flex-col items-center justify-center py-4 sm:py-8`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
      >
        {isDarkMode ? <i className="fas fa-sun text-sm"></i> : <i className="fas fa-moon text-sm"></i>}
      </button>

      {/* Scaled container */}
      <div className="scale-container w-full flex justify-center px-4">
        
        {/* Invoice Template - Scales with viewport */}
        <div className="invoice-template w-full max-w-[800px] mx-auto">
          
          <div className={`relative rounded-none overflow-hidden ${isDarkMode ? 'bg-black' : 'bg-white'} shadow-2xl`}>
            
            {/* Full Page Watermark - PAID */}
            <div 
              className="absolute inset-0 pointer-events-none select-none flex items-center justify-center z-20"
              style={{ transform: 'rotate(-25deg) scale(1.5)' }}
            >
              <span className={`watermark-paid text-[clamp(50px,8vw,100px)] font-black font-['Orbitron'] tracking-wider`}
                style={{ color: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                PAID
              </span>
            </div>
            
            {/* Corner Watermark - Top Right */}
            <div className="absolute top-[clamp(16px,3vw,30px)] right-[clamp(16px,3vw,30px)] pointer-events-none select-none z-20">
              <span className={`text-[clamp(24px,4vw,50px)] font-black font-['Orbitron']`}
                style={{ color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                INV
              </span>
            </div>
            
            {/* Corner Watermark - Bottom Left */}
            <div className="absolute bottom-[clamp(16px,3vw,30px)] left-[clamp(16px,3vw,30px)] pointer-events-none select-none z-20">
              <span className={`text-[clamp(16px,3vw,30px)] font-black font-['Orbitron']`}
                style={{ color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {invoiceData.invoiceNumber}
              </span>
            </div>

            {/* Header Section */}
            <div className={`relative ${isDarkMode ? 'bg-gradient-to-r from-gray-900 to-black' : 'bg-gray-900'} px-[clamp(12px,3vw,24px)] py-[clamp(12px,3vw,20px)]`}>
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <h1 className={`font-['Orbitron'] text-[clamp(16px,4vw,24px)] font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-white'}`}>
                    INVOICE
                  </h1>
                  <p className={`text-[clamp(8px,2vw,11px)] mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}>
                    #{invoiceData.invoiceNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-[clamp(11px,2.5vw,14px)] ${isDarkMode ? 'text-white' : 'text-white'}`}>SIMON CODEZ</p>
                  <p className={`text-[clamp(7px,1.8vw,10px)] ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}>Full-Stack Developer</p>
                  <p className={`text-[clamp(7px,1.8vw,10px)] ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}>Nairobi, Kenya</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-white/20 via-white/50 to-white/20"></div>
            </div>

            {/* Status Badge */}
            <div className="px-[clamp(12px,3vw,24px)] pt-[clamp(12px,3vw,16px)]">
              <div className={`inline-flex items-center gap-1.5 px-[clamp(8px,2vw,12px)] py-[clamp(4px,1vw,6px)] rounded-full text-[clamp(8px,2vw,11px)] font-semibold ${isDarkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                <i className="fas fa-check-circle text-[clamp(6px,1.5vw,9px)]"></i>
                <span>PAID</span>
              </div>
            </div>

            {/* Client & Invoice Details */}
            <div className="px-[clamp(12px,3vw,24px)] py-[clamp(12px,3vw,16px)]">
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div>
                  <p className={`text-[clamp(7px,1.8vw,10px)] font-semibold uppercase tracking-wide mb-1 md:mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Bill To</p>
                  <div className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    <p className={`text-[clamp(11px,2.5vw,14px)] font-bold`}>{invoiceData.clientName}</p>
                    <p className={`text-[clamp(8px,2vw,11px)] mt-0.5`}>{invoiceData.clientEmail}</p>
                    <p className={`text-[clamp(8px,2vw,11px)]`}>{invoiceData.clientPhone}</p>
                    <p className={`text-[clamp(8px,2vw,11px)]`}>{invoiceData.clientAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1.5">
                    <div>
                      <p className={`text-[clamp(7px,1.8vw,10px)] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Issue Date</p>
                      <p className={`text-[clamp(8px,2vw,11px)] font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(invoiceData.issueDate)}</p>
                    </div>
                    <div>
                      <p className={`text-[clamp(7px,1.8vw,10px)] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Due Date</p>
                      <p className={`text-[clamp(8px,2vw,11px)] font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(invoiceData.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table - No scroll, smaller text */}
            <div className="px-[clamp(12px,3vw,24px)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <th className={`text-left py-1.5 md:py-2 text-[clamp(8px,1.8vw,10px)] font-semibold uppercase tracking-wide w-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>#</th>
                    <th className={`text-left py-1.5 md:py-2 text-[clamp(8px,1.8vw,10px)] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Description</th>
                    <th className={`text-right py-1.5 md:py-2 text-[clamp(8px,1.8vw,10px)] font-semibold uppercase tracking-wide w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Qty</th>
                    <th className={`text-right py-1.5 md:py-2 text-[clamp(8px,1.8vw,10px)] font-semibold uppercase tracking-wide w-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Unit Price</th>
                    <th className={`text-right py-1.5 md:py-2 text-[clamp(8px,1.8vw,10px)] font-semibold uppercase tracking-wide w-24 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                      <td className={`py-1.5 md:py-2 text-[clamp(8px,2vw,11px)] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{index + 1}</td>
                      <td className={`py-1.5 md:py-2 text-[clamp(8px,2vw,11px)] ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.description}</td>
                      <td className={`py-1.5 md:py-2 text-[clamp(8px,2vw,11px)] text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.quantity}</td>
                      <td className={`py-1.5 md:py-2 text-[clamp(8px,2vw,11px)] text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatCurrency(item.price)}</td>
                      <td className={`py-1.5 md:py-2 text-[clamp(8px,2vw,11px)] text-right font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="px-[clamp(12px,3vw,24px)] py-[clamp(12px,3vw,16px)]">
              <div className="flex justify-end">
                <div className="w-full max-w-[240px]">
                  <div className="space-y-1">
                    <div className="flex justify-between py-0.5">
                      <span className={`text-[clamp(8px,2vw,11px)] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal:</span>
                      <span className={`text-[clamp(8px,2vw,11px)] ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(invoiceData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className={`text-[clamp(8px,2vw,11px)] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discount:</span>
                      <span className={`text-[clamp(8px,2vw,11px)] ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>- {formatCurrency(invoiceData.discount)}</span>
                    </div>
                    <div className={`flex justify-between py-1.5 md:py-2 mt-1 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                      <span className={`text-[clamp(10px,2.5vw,13px)] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                      <span className={`text-[clamp(12px,3vw,16px)] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(invoiceData.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className={`mx-[clamp(12px,3vw,24px)] mb-4 p-[clamp(10px,2.5vw,12px)] ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <p className={`text-[clamp(7px,1.8vw,10px)] font-semibold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Payment Instructions</p>
              <p className={`text-[clamp(7px,1.8vw,10px)] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                Bank: Equity Bank Kenya | Acc: Simon Ngugi | 1234567890<br />
                M-PESA Paybill: 123456 | Acc: {invoiceData.invoiceNumber}
              </p>
            </div>

            {/* Footer Note */}
            <div className={`px-[clamp(12px,3vw,24px)] py-[clamp(10px,2.5vw,16px)] text-center border-t ${isDarkMode ? 'border-gray-800 bg-black/50' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-[clamp(7px,1.8vw,10px)] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                <i className="fas fa-shield-alt mr-1 text-[clamp(6px,1.5vw,8px)]"></i> 
                Thank you for your business! Payment due within 30 days.
              </p>
              <p className={`text-[clamp(6px,1.5vw,9px)] mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                sngugi175@gmail.com | +254 773 743 248
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-6">
            <button className={`px-3 md:px-5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[10px] md:text-xs ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
              <i className="fas fa-download text-[8px] md:text-xs"></i>
              <span className="hidden sm:inline">Download</span> PDF
            </button>
            <button className={`px-3 md:px-5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[10px] md:text-xs ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
              <i className="fas fa-print text-[8px] md:text-xs"></i>
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          button {
            display: none;
          }
          .shadow-2xl {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}
