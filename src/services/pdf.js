import { jsPDF } from 'jspdf';

export const PDF = {
  generate(buvette, order) {
    const W = 80, margin = 5, cw = W - margin * 2;
    const doc = new jsPDF({ unit:'mm', format:[W, 110] }); // height auto-expanded
    let y = margin;

    

    const dotLine = () => {
      doc.setDrawColor(70,70,84);
      doc.setLineDashPattern([0.8,1.5],0);
      doc.line(margin, y, W-margin, y); y += 3.5;
    };
    
    const rect = (h, fill=[18,18,28]) => {
      doc.setFillColor(...fill); doc.rect(0, y, W, h, 'F');
    };

    /* ── HEADER ── */
    rect(38, [10,10,18]);
    doc.setFillColor(240,165,0);
    doc.circle(W/2, y+11, 8, 'F');
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(10,10,18);
    doc.text((buvette.name||'B')[0].toUpperCase(), W/2, y+14.5, { align:'center' });
    y += 22;
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(240,165,0);
    doc.text(buvette.name||'Apeiron Buvette', W/2, y, { align:'center' }); y += 5;
    if (buvette.slogan) {
      doc.setFontSize(7); doc.setFont('helvetica','italic'); doc.setTextColor(130,130,145);
      doc.text(buvette.slogan, W/2, y, { align:'center' }); y += 4;
    }
    if (buvette.address || buvette.city) {
      doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,110);
      doc.text([buvette.city, buvette.address].filter(Boolean).join(', '), W/2, y, { align:'center' }); y += 4;
    }
    y += 2;

    /* ── ORDER INFO BAR ── */
    rect(16, [20,20,32]);
    y += 4;
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(240,165,0);
    doc.text(`TICKET ${order.orderNumber}`, W/2, y, { align:'center' }); y += 5;
    const dateStr = new Date(order.paidAt||order.createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(130,130,145);
    doc.text(dateStr, W/2, y, { align:'center' }); y += 4;
    if (order.processedBy) {
      doc.text(`Serveur : ${order.processedBy}`, W/2, y, { align:'center' }); y += 4;
    }
    if (order.clientName && order.clientName !== 'Client') {
      doc.text(`Client : ${order.clientName}`, W/2, y, { align:'center' }); y += 4;
    }
    if (order.tableInfo) {
      doc.text(`Table/Réf : ${order.tableInfo}`, W/2, y, { align:'center' }); y += 4;
    }
    y += 3;

    /* ── ITEMS TABLE HEADER ── */
    doc.setFillColor(240,165,0);
    doc.rect(margin, y, cw, 6, 'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(10,10,18);
    doc.text('ARTICLE', margin+1.5, y+4);
    doc.text('QTÉ', W/2, y+4, { align:'center' });
    doc.text('TOTAL', W-margin-1.5, y+4, { align:'right' });
    y += 8;

    /* ── ITEMS ── */
    const cur = buvette.currency || 'FCFA';
    order.items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(18,18,28); doc.rect(margin, y-1, cw, 6.5, 'F');
      }
      doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(215,215,208);
      const nm = item.name.length > 20 ? item.name.slice(0,18)+'..' : item.name;
      doc.text(nm, margin+1.5, y+3.5);
      doc.text(`x${item.qty}`, W/2, y+3.5, { align:'center' });
      doc.text(`${(item.price*item.qty).toFixed(0)} ${cur}`, W-margin-1.5, y+3.5, { align:'right' });
      y += 6.5;
    });

    y += 3;

    /* ── TOTAL ── */
    doc.setFillColor(240,165,0);
    doc.rect(margin, y, cw, 10, 'F');
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(10,10,18);
    doc.text('TOTAL', margin+2, y+6.5);
    doc.text(`${order.total.toFixed(0)} ${cur}`, W-margin-2, y+6.5, { align:'right' });
    y += 14;

    /* ── FOOTER ── */
    dotLine();
    doc.setFontSize(8); doc.setFont('helvetica','italic'); doc.setTextColor(100,100,110);
    doc.text('Merci pour votre visite ! 🙏', W/2, y, { align:'center' }); y += 5;
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(70,70,84);
    doc.text('Powered by Apeiron Buvette', W/2, y, { align:'center' }); y += 4;
    dotLine();
    y += 3;

    doc.internal.pageSize.setHeight(y + margin);

    const fname = `ticket_${(order.orderNumber||'').replace('#','')||Date.now()}.pdf`;
    doc.save(fname);
  },
};
