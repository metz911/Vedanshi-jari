window.generateInvoicePDF = async function(invoiceId) {
  
  console.log("--- STARTING PDF GENERATION ---");
  console.log("Invoice ID:", invoiceId);

  // 1. CHECK LIBRARY
  if (!window.jspdf) {
    alert("Error: jsPDF library not loaded.");
    return;
  }
  const { jsPDF } = window.jspdf;
  
  try {
    // 2. FETCH INVOICE
    const { data: invoice, error } = await window.supabase
      .from("invoices")
      .select(`
        invoice_no, created_at, subtotal, cgst, sgst, total,
        clients ( name, phone, address, gstin, state )
      `)
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) { 
      console.error("Invoice Fetch Error:", error);
      alert("Error: Could not find invoice details."); 
      return; 
    }

    // 3. FETCH ITEMS (The likely problem area)
    const { data: rows, error: rowErr } = await window.supabase
      .from("invoice_items")
      .select(`
        qty, rate, amount,
        items ( item_name, hsn )
      `)
      .eq("invoice_id", invoiceId);

    if (rowErr) {
      console.error("Items Fetch Error:", rowErr);
      alert("Error fetching items.");
      return;
    }

    // --- DEBUG CHECK ---
    console.log("Items found:", rows.length);
    if (rows.length === 0) {
      alert("WARNING: This invoice has 0 items saved in the database.\nThe PDF table will be empty.");
    }

    // 4. PDF SETUP
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const colorRed = [220, 38, 38];
    const colorBlack = [0, 0, 0];

    doc.setLineWidth(0.1);
    doc.setDrawColor(0);

    // 5. HEADER
    doc.rect(margin, margin, contentWidth, 277); // Border

    // Company
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...colorRed);
    doc.text("VEDANSHI JARI", margin + 4, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colorBlack);
    doc.text("1st, Pl.No 37/B, Sareeta Sangam Society,", margin + 4, 26);
    doc.text("Nana Varachha, Surat – 395006", margin + 4, 30);
    doc.text("GSTIN: 24AIGPK4658N1ZT", margin + 4, 36);
    doc.text("Mobile: +91 9228762703", margin + 4, 41);

    doc.line(pageWidth / 2, margin, pageWidth / 2, 50);

    // Invoice Meta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TAX INVOICE", (pageWidth / 2) + 4, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${invoice.invoice_no}`, (pageWidth / 2) + 4, 28);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, (pageWidth / 2) + 4, 33);
    doc.text("State: Gujarat (24)", (pageWidth / 2) + 4, 38);

    doc.line(margin, 50, pageWidth - margin, 50);

    // Client
    const printClient = (x) => {
      doc.setFont("helvetica", "bold");
      doc.text(invoice.clients.name || "Client Name", x, 60);
      doc.setFont("helvetica", "normal");
      const addr = doc.splitTextToSize(invoice.clients.address || "", (contentWidth/2)-10);
      doc.text(addr, x, 64);
      let y = 64 + (addr.length * 4);
      doc.text(`Phone: ${invoice.clients.phone || "-"}`, x, y);
      doc.text(`GSTIN: ${invoice.clients.gstin || "-"}`, x, y + 4);
      doc.text(`State: ${invoice.clients.state || "-"}`, x, y + 8);
    };

    doc.text("BILL TO", margin + 4, 55);
    printClient(margin + 4);
    doc.text("SHIP TO", (pageWidth / 2) + 4, 55);
    printClient((pageWidth / 2) + 4);

    doc.line(pageWidth / 2, 50, pageWidth / 2, 85); 
    doc.line(margin, 85, pageWidth - margin, 85);

    // 6. TABLE
    const tableRows = rows.map((r, i) => [
      i + 1,
      r.items?.item_name || "-", // Ensure this isn't undefined
      r.items?.hsn || "-",
      r.qty,
      `Rs. ${r.rate.toFixed(2)}`,
      `Rs. ${r.amount.toFixed(2)}`
    ]);

    const itemSectionBottomY = 200;

    doc.autoTable({
      startY: 85,
      head: [["S.No", "Item Description", "HSN", "Qty", "Rate", "Amount"]],
      body: tableRows,
      theme: 'plain',
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        valign: 'middle', 
        lineWidth: 0, 
        textColor: [0, 0, 0] // Force Black Text
      },
      headStyles: { 
        fillColor: colorRed, 
        textColor: 255, 
        fontStyle: 'bold', 
        halign: 'center' 
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 84, halign: 'left' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin },
      
      // === CRITICAL FIX: Safe Line Drawing ===
      didDrawPage: function (data) {
        // Use cursor.y to find where drawing stopped
        const currentY = data.cursor ? data.cursor.y : 0;
        const gridBottomY = Math.max(currentY, itemSectionBottomY);
        const startY = data.settings.startY; 
        
        let currentX = data.settings.margin.left;
        
        // Vertical Lines
        doc.line(currentX, startY, currentX, gridBottomY);
        data.table.columns.forEach(col => {
          currentX += col.width;
          doc.line(currentX, startY, currentX, gridBottomY);
        });
        
        // Bottom Line
        doc.line(data.settings.margin.left, gridBottomY, currentX, gridBottomY);
      }
    });

    // 7. TOTALS & FOOTER
    // Use lastAutoTable safely
    let finalY = doc.lastAutoTable.finalY || 85; 
    const gridBottomY = Math.max(finalY, itemSectionBottomY);
    
    let y = gridBottomY + 6;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", margin + 4, y);
    doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 4, y, { align: "right" });
    doc.line(margin, gridBottomY + 10, pageWidth - margin, gridBottomY + 10);

    y = gridBottomY + 16;
    const thirdWidth = contentWidth / 3;
    const totalTax = (invoice.cgst || 0) + (invoice.sgst || 0);

    doc.setFont("helvetica", "normal");
    doc.text("Received Amount:", margin + 4, y);
    doc.text("Rs. 0.00", margin + 35, y); 
    doc.text("Total Tax:", margin + thirdWidth + 4, y);
    doc.text(`Rs. ${totalTax.toFixed(2)}`, margin + thirdWidth + 35, y);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", margin + (thirdWidth * 2) + 4, y);
    doc.text(`Rs. ${invoice.total.toFixed(2)}`, pageWidth - margin - 4, y, { align: "right" });

    doc.setLineWidth(0.1);
    doc.line(margin + thirdWidth, gridBottomY + 10, margin + thirdWidth, gridBottomY + 20);
    doc.line(margin + (thirdWidth * 2), gridBottomY + 10, margin + (thirdWidth * 2), gridBottomY + 20);
    doc.line(margin, gridBottomY + 20, pageWidth - margin, gridBottomY + 20);

    // Tax Table
    const taxY = gridBottomY + 20;
    doc.autoTable({
      startY: taxY,
      head: [["HSN/SAC", "Taxable Amt", "CGST Rate", "CGST Amt", "SGST Rate", "SGST Amt", "Total Tax"]],
      body: [[
          "Summary", invoice.subtotal.toFixed(2), "2.5%", (invoice.cgst || 0).toFixed(2), "2.5%", (invoice.sgst || 0).toFixed(2), totalTax.toFixed(2)
      ]],
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center' },
      headStyles: { fillColor: [245, 245, 245], textColor: 0, lineWidth: 0.1, lineColor: 200 },
      margin: { left: margin, right: margin }
    });

    const footerY = 245; 
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", margin + 4, footerY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Bank Name: SBI", margin + 4, footerY + 10);
    doc.text("A/c No: 38028101723", margin + 4, footerY + 15);
    doc.text("IFSC: SBIN0002836", margin + 4, footerY + 20);
    doc.line(pageWidth / 2 + 20, footerY, pageWidth / 2 + 20, 287); 
    doc.text("For, VEDANSHI JARI", pageWidth - 15, footerY + 5, { align: "right" });
    doc.text("Authorised Signatory", pageWidth - 15, footerY + 35, { align: "right" });

    doc.save(`${invoice.invoice_no}.pdf`);
  
  } catch (err) {
    console.error("PDF Error:", err);
    alert("Unexpected error: " + err.message);
  }
};