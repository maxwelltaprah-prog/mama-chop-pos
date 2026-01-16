import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, QrCode, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Custom domain for the order page
const CUSTOM_DOMAIN = 'https://eidikoskouzina.com';

export function OrderQRCode() {
  const [copied, setCopied] = useState(false);
  
  // Use custom domain for QR code
  const orderUrl = `${CUSTOM_DOMAIN}/order`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(orderUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('order-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 400, 400);
      }
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'eidikos-kouzina-order-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR code downloaded!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = document.getElementById('order-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Eidikos Kouzina - Order QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 40px;
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
            }
            .logo { font-size: 48px; margin-bottom: 16px; }
            h1 { font-size: 28px; margin: 0 0 8px; color: #333; }
            p { font-size: 16px; color: #666; margin: 0 0 24px; }
            .qr-container { 
              padding: 20px; 
              background: white; 
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .url { 
              margin-top: 24px; 
              font-size: 14px; 
              color: #888;
              word-break: break-all;
            }
            @media print {
              body { padding: 20px; }
              .qr-container { box-shadow: none; border: 2px solid #eee; }
            }
          </style>
        </head>
        <body>
          <img src="/eidikos-logo.jpeg" alt="Eidikos Kouzina" style="width: 80px; height: 80px; border-radius: 16px; object-fit: cover; margin-bottom: 8px;" />
          <h1>Eidikos Kouzina</h1>
          <p>Scan to Order Online</p>
          <div class="qr-container">
            ${svgData}
          </div>
          <p class="url">${orderUrl}</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Customer Order QR Code
        </CardTitle>
        <CardDescription>
          Print or display this QR code for customers to scan and place orders online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-primary/20">
            <QRCodeSVG
              id="order-qr-code"
              value={orderUrl}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#1a1a1a"
              bgColor="#ffffff"
            />
          </div>
        </div>

        {/* Restaurant branding under QR */}
        <div className="text-center">
          <p className="text-lg font-display font-bold text-gradient">Eidikos Kouzina</p>
          <p className="text-sm text-muted-foreground">Scan to Order Online</p>
        </div>

        {/* URL display */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Order page URL</p>
          <p className="text-sm font-mono break-all">{orderUrl}</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyLink}
            className="flex-1"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-1 text-success" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            Copy
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadQR}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button 
            variant="gradient" 
            size="sm" 
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
