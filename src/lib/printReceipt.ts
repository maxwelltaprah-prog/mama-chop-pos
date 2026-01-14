import { OrderWithItems } from '@/hooks/useOrders';

export interface PrintReceiptOptions {
  order: OrderWithItems;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
}

export function formatCurrencyForPrint(amount: number): string {
  return `GHS ${amount.toFixed(2)}`;
}

export function generateReceiptHTML(options: PrintReceiptOptions): string {
  const {
    order,
    restaurantName = 'ChopBar POS',
    restaurantAddress = 'Accra, Ghana',
    restaurantPhone = '+233 XX XXX XXXX',
  } = options;

  const orderDate = new Date(order.created_at).toLocaleString('en-GH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const itemsHTML = order.order_items
    .map((item) => {
      const itemName = item.menu_items?.name || 'Unknown Item';
      const qty = item.quantity;
      const unitPrice = Number(item.unit_price);
      const totalPrice = Number(item.total_price);
      const size = item.size ? ` (${item.size})` : '';
      
      return `
        <tr>
          <td style="text-align: left; padding: 4px 0;">
            ${qty}x ${itemName}${size}
            ${item.notes ? `<br><small style="color: #666;">Note: ${item.notes}</small>` : ''}
          </td>
          <td style="text-align: right; padding: 4px 0;">
            ${formatCurrencyForPrint(totalPrice)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${order.order_number}</title>
      <style>
        @media print {
          body { width: 80mm; margin: 0; padding: 8mm; }
          @page { margin: 0; size: 80mm auto; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 300px;
          margin: 0 auto;
          padding: 10px;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .restaurant-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .order-info {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .order-number {
          font-weight: bold;
          font-size: 14px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .totals {
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .grand-total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          margin-top: 5px;
          padding-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 11px;
        }
        .payment-info {
          margin-top: 10px;
          padding: 5px;
          background: #f5f5f5;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">${restaurantName}</div>
        <div>${restaurantAddress}</div>
        <div>${restaurantPhone}</div>
      </div>

      <div class="order-info">
        <div class="order-number">${order.order_number}</div>
        <div>Date: ${orderDate}</div>
        <div>Type: ${order.order_type.toUpperCase()}</div>
        ${order.customer_name ? `<div>Customer: ${order.customer_name}</div>` : ''}
        ${order.customer_phone ? `<div>Phone: ${order.customer_phone}</div>` : ''}
        ${order.table_id ? `<div>Table Order</div>` : ''}
      </div>

      <table class="items-table">
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrencyForPrint(Number(order.subtotal))}</span>
        </div>
        <div class="total-row">
          <span>Tax (5%):</span>
          <span>${formatCurrencyForPrint(Number(order.tax))}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrencyForPrint(Number(order.total))}</span>
        </div>
      </div>

      <div class="payment-info">
        Payment: ${order.payment_method ? order.payment_method.toUpperCase() : 'PENDING'}<br>
        Status: ${order.payment_status.toUpperCase()}
      </div>

      <div class="footer">
        <div>Thank you for your patronage!</div>
        <div>Please come again</div>
        <div style="margin-top: 5px;">
          --------------------------------
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printReceipt(options: PrintReceiptOptions): void {
  const receiptHTML = generateReceiptHTML(options);
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow pop-ups to print receipts');
    return;
  }
  
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close after printing (with a small delay for the print dialog)
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };
}
