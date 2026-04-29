export const generateInvoiceHTML = (invoiceData: any) => {
  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Safely format items
  const itemsHTML = invoiceData.items?.map((item: any, index: number) => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.description || ''}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.price || 0)}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.total || 0)}</td>
    </tr>
  `).join('') || '';

  // Calculate totals
  const subtotal = invoiceData.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
  const discount = invoiceData.discount || 0;
  const total = subtotal - discount;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${invoiceData.invoiceNumber || ''}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        
        .container {
          width: 800px;
          background: #fff;
          margin: 20px auto;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        /* Header Styling */
        .header {
          position: relative;
          padding: 20px;
        }
        
        .header::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 70%;
          height: 80px;
          background: rgba(0, 31, 61, 1);
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
        }
        
        .header::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 60%;
          height: 80px;
          background: #4ea8de;
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
        }
        
        .header-content {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: white;
          position: relative;
          padding-left: 20px;
        }
        
        .company-info {
          text-align: right;
          color: white;
          position: relative;
          padding-right: 20px;
          font-size: 14px;
        }
        
        /* Title */
        .invoice-title {
          background: rgba(0, 31, 61, 1);
          color: #fff;
          padding: 10px;
          text-align: center;
          font-size: 24px;
          margin: 20px 0;
        }
        
        /* Details Section */
        .details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .bill-to {
          flex: 1;
        }
        
        .invoice-details {
          flex: 1;
          text-align: right;
        }
        
        .details strong {
          font-size: 14px;
        }
        
        .details p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        /* Table Container */
        .table-container {
          width: 100%;
          margin-bottom: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: black;
          color: #fff;
          padding: 10px;
          text-align: center;
          font-size: 14px;
          border: 1px solid #ddd;
        }
        
        td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: center;
          font-size: 14px;
        }
        
        .amount-cell {
          text-align: right;
        }
        
        .total-row {
          font-weight: bold;
          background: #f4f4f4;
        }
        
        /* Total Section */
        .total {
          text-align: right;
          margin-top: 20px;
          font-size: 16px;
          font-weight: bold;
        }
        
        /* Footer Styling */
        .footer {
          position: relative;
          margin-top: 30px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          font-weight: bold;
          padding: 0 20px;
          z-index: 2;
          overflow: hidden;
        }
        
        .footer::before {
          content: "";
          position: absolute;
          left: 0;
          width: 70%;
          height: 100%;
          background: #4ea8de;
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
          z-index: -1;
        }
        
        .footer::after {
          content: "";
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: rgba(0, 31, 61, 1);
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
          z-index: -1;
        }
        
        .footer-left, .footer-right {
          position: relative;
          font-size: 14px;
          padding: 0 20px;
        }
        
        @media print {
          body {
            padding: 0;
            background: white;
          }
          
          .container {
            box-shadow: none;
            margin: 0;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="logo">Aksa Genset Services</div>
            <div class="company-info">
              P.O. Box 65516-00600, Nairobi <br>
              Phone: 0722222257 <br>
              Contact: Mr. Peter Kamau
            </div>
          </div>
        </div>
        
        <!-- Invoice Title -->
        <div class="invoice-title">INVOICE</div>
        
        <!-- Invoice Details -->
        <div class="details">
          <div class="bill-to">
            <p><strong>Bill To:</strong> ${invoiceData.clientName || 'Client Name'}</p>
            ${invoiceData.clientEmail ? `<p><strong>Email:</strong> ${invoiceData.clientEmail}</p>` : ''}
            ${invoiceData.clientPhone ? `<p><strong>Phone:</strong> ${invoiceData.clientPhone}</p>` : ''}
            ${invoiceData.clientAddress ? `<p><strong>Address:</strong> ${invoiceData.clientAddress}</p>` : ''}
          </div>
          
          <div class="invoice-details">
            <p><strong>Invoice No:</strong> ${invoiceData.invoiceNumber || 'INV-0001'}</p>
            <p><strong>Date:</strong> ${formatDate(invoiceData.issueDate || new Date().toISOString())}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoiceData.dueDate || new Date().toISOString())}</p>
            <p><strong>Terms:</strong> Cash / Cheque</p>
          </div>
        </div>
        
        <!-- Invoice Items Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price (Ksh)</th>
                <th>Total Price (Ksh)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              ${discount > 0 ? `
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Subtotal</strong></td>
                  <td class="amount-cell"><strong>${formatCurrency(subtotal)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Discount</strong></td>
                  <td class="amount-cell"><strong>- ${formatCurrency(discount)}</strong></td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;"><strong>Total Amount</strong></td>
                <td class="amount-cell"><strong>${formatCurrency(total)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Thank You Message -->
        <div class="total">
          <strong>Thank you for your business!</strong>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">
            Contact: kamau2222@gmail.com
          </div>
          <div class="footer-right">
            Phone: 0722222257
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateQuotationHTML = (quotationData: any) => {
  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Safely format items
  const itemsHTML = quotationData.items?.map((item: any, index: number) => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.description || ''}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.price || 0)}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.total || 0)}</td>
    </tr>
  `).join('') || '';

  // Calculate totals
  const subtotal = quotationData.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
  const discount = quotationData.discount || 0;
  const total = subtotal - discount;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quotation #${quotationData.quotationNumber || ''}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        
        .container {
          width: 800px;
          background: #fff;
          margin: 20px auto;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        /* Header Styling */
        .header {
          position: relative;
          padding: 20px;
        }
        
        .header::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 70%;
          height: 80px;
          background: rgba(0, 31, 61, 1);
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
        }
        
        .header::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 60%;
          height: 80px;
          background: #4ea8de;
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
        }
        
        .header-content {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: white;
          position: relative;
          padding-left: 20px;
        }
        
        .company-info {
          text-align: right;
          color: white;
          position: relative;
          padding-right: 20px;
          font-size: 14px;
        }
        
        /* Title */
        .quotation-title {
          background: rgba(0, 31, 61, 1);
          color: #fff;
          padding: 10px;
          text-align: center;
          font-size: 24px;
          margin: 20px 0;
        }
        
        /* Details Section */
        .details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .client-info {
          flex: 1;
        }
        
        .quotation-details {
          flex: 1;
          text-align: right;
        }
        
        .details strong {
          font-size: 14px;
        }
        
        .details p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        /* Table Container */
        .table-container {
          width: 100%;
          margin-bottom: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: black;
          color: #fff;
          padding: 10px;
          text-align: center;
          font-size: 14px;
          border: 1px solid #ddd;
        }
        
        td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: center;
          font-size: 14px;
        }
        
        .amount-cell {
          text-align: right;
        }
        
        .total-row {
          font-weight: bold;
          background: #f4f4f4;
        }
        
        /* Total Section */
        .total {
          text-align: right;
          margin-top: 20px;
          font-size: 16px;
          font-weight: bold;
        }
        
        /* Footer Styling */
        .footer {
          position: relative;
          margin-top: 30px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          font-weight: bold;
          padding: 0 20px;
          z-index: 2;
          overflow: hidden;
        }
        
        .footer::before {
          content: "";
          position: absolute;
          left: 0;
          width: 70%;
          height: 100%;
          background: #4ea8de;
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
          z-index: -1;
        }
        
        .footer::after {
          content: "";
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: rgba(0, 31, 61, 1);
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
          z-index: -1;
        }
        
        .footer-left, .footer-right {
          position: relative;
          font-size: 14px;
          padding: 0 20px;
        }
        
        /* Notes Section */
        .notes-section {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-left: 4px solid #f59e0b;
          font-size: 14px;
        }
        
        .notes-title {
          font-weight: bold;
          margin-bottom: 8px;
          color: #92400e;
        }
        
        /* Terms Section */
        .terms-section {
          margin-top: 20px;
          padding: 15px;
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          font-size: 14px;
        }
        
        .terms-title {
          font-weight: bold;
          margin-bottom: 8px;
          color: #0369a1;
        }
        
        .terms-list {
          padding-left: 20px;
        }
        
        .terms-list li {
          margin-bottom: 5px;
        }
        
        @media print {
          body {
            padding: 0;
            background: white;
          }
          
          .container {
            box-shadow: none;
            margin: 0;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="logo">Aksa Genset Services</div>
            <div class="company-info">
              P.O. Box 65516-00600, Nairobi <br>
              Phone: 0722222257 <br>
              Contact: Mr. Peter Kamau
            </div>
          </div>
        </div>
        
        <!-- Quotation Title -->
        <div class="quotation-title">QUOTATION</div>
        
        <!-- Quotation Details -->
        <div class="details">
          <div class="client-info">
            <p><strong>Bill To:</strong> ${quotationData.clientName || 'Client Name'}</p>
            ${quotationData.clientCompany ? `<p><strong>Company:</strong> ${quotationData.clientCompany}</p>` : ''}
            ${quotationData.clientEmail ? `<p><strong>Email:</strong> ${quotationData.clientEmail}</p>` : ''}
            ${quotationData.clientPhone ? `<p><strong>Phone:</strong> ${quotationData.clientPhone}</p>` : ''}
            ${quotationData.clientAddress ? `<p><strong>Address:</strong> ${quotationData.clientAddress}</p>` : ''}
          </div>
          
          <div class="quotation-details">
            <p><strong>Quotation No:</strong> ${quotationData.quotationNumber || 'QT-0001'}</p>
            <p><strong>Date:</strong> ${formatDate(quotationData.issueDate || new Date().toISOString())}</p>
            <p><strong>Valid Until:</strong> ${formatDate(quotationData.validUntil || new Date().toISOString())}</p>
            <p><strong>Terms:</strong> Cash / Cheque</p>
          </div>
        </div>
        
        <!-- Quotation Items Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price (Ksh)</th>
                <th>Total Price (Ksh)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              ${discount > 0 ? `
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Subtotal</strong></td>
                  <td class="amount-cell"><strong>${formatCurrency(subtotal)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Discount</strong></td>
                  <td class="amount-cell"><strong>- ${formatCurrency(discount)}</strong></td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;"><strong>Total Quoted Amount</strong></td>
                <td class="amount-cell"><strong>${formatCurrency(total)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Terms & Conditions -->
        ${quotationData.terms && quotationData.terms.length > 0 ? `
          <div class="terms-section">
            <div class="terms-title">Terms & Conditions</div>
            <ul class="terms-list">
              ${quotationData.terms.map((term: string) => `<li>${term}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <!-- Notes -->
        ${quotationData.notes ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div>${quotationData.notes.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
        
        <!-- Thank You Message -->
        <div class="total">
          <strong>Thank you for your business!</strong>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">
            Contact: info@aksagensetservices.co.ke
          </div>
          <div class="footer-right">
            Phone: 0722222257
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};