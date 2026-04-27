import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

const empresa = {
  nombre: 'E-Commerce',
  ruc: '12345678901',
};

export class ReporteController {
  private toNumber(value: unknown) {
    return Number(value || 0);
  }

  private drawTable(doc: any, headers: string[], rows: string[][]) {
    const startX = 40;
    let y = doc.y;
    const colWidth = (doc.page.width - 80) / headers.length;
    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, idx) => doc.text(h, startX + idx * colWidth, y, { width: colWidth - 6 }));
    y += 18;
    doc.moveTo(startX, y - 4).lineTo(doc.page.width - 40, y - 4).stroke();
    doc.font('Helvetica').fontSize(8);
    for (const row of rows) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      row.forEach((cell, idx) => doc.text(cell, startX + idx * colWidth, y, { width: colWidth - 6 }));
      y += 14;
    }
    doc.y = y + 8;
  }

  private async getDataOperacional(reporte: string) {
    switch (reporte) {
      case 'ordenes-periodo':
        return prisma.ord_ordenes.findMany({ include: { items: true, cliente: { include: { usuario: true } } }, take: 200, orderBy: { created_at: 'desc' } });
      case 'inventario-valorizado':
        return prisma.inv_stock_producto.findMany({ include: { producto: { include: { categoria: true } } } });
      case 'movimientos-periodo':
        return prisma.inv_movimientos_inventario.findMany({ include: { producto: { include: { producto: true } } }, take: 200, orderBy: { fecha_movimiento: 'desc' } });
      case 'stock-bajo':
        return prisma.inv_stock_producto.findMany({ where: { stock_fisico: { lte: 10 } }, include: { producto: true } });
      case 'pagos-periodo':
        return prisma.ord_pagos.findMany({ include: { orden: true }, take: 200, orderBy: { created_at: 'desc' } });
      case 'devoluciones':
        return prisma.ord_ordenes.findMany({ where: { estado: 'devuelta' }, include: { historial_estados: true, pagos: true } });
      default:
        throw new AppError('Reporte operacional no soportado', 400);
    }
  }

  async reporteOperacional(req: Request, res: Response, next: NextFunction) {
    try {
      const reporte = String(req.params.reporte);
      const data: any[] = await this.getDataOperacional(reporte);

      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${reporte}.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).text(`${empresa.nombre} - Reporte Operacional`, { align: 'center' });
      doc.fontSize(10).text(`RUC: ${empresa.ruc}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Reporte: ${reporte}`);
      doc.text(`Generado: ${new Date().toLocaleString()}`);
      doc.moveDown();
      doc.text(`Registros: ${data.length}`);
      doc.moveDown();
      switch (reporte) {
        case 'ordenes-periodo':
          this.drawTable(
            doc,
            ['Orden', 'Fecha', 'Cliente', 'Estado', 'Total'],
            data.slice(0, 200).map((o: any) => [
              o.orden_numero,
              new Date(o.created_at).toLocaleDateString(),
              o.cliente?.usuario?.email || 'N/A',
              o.estado,
              `S/ ${this.toNumber(o.total).toFixed(2)}`,
            ]),
          );
          break;
        case 'inventario-valorizado':
          this.drawTable(
            doc,
            ['SKU', 'Producto', 'Categoria', 'Stock', 'Valor'],
            data.slice(0, 200).map((s: any) => [
              s.producto?.sku || '-',
              s.producto?.nombre || '-',
              s.producto?.categoria?.nombre || 'Sin categoria',
              `${s.stock_fisico}`,
              `S/ ${(s.stock_fisico * this.toNumber(s.producto?.precio_costo)).toFixed(2)}`,
            ]),
          );
          break;
        case 'movimientos-periodo':
          this.drawTable(
            doc,
            ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo'],
            data.slice(0, 200).map((m: any) => [
              new Date(m.fecha_movimiento).toLocaleDateString(),
              m.producto?.producto?.nombre || `#${m.producto_id}`,
              m.tipo_movimiento,
              `${m.cantidad}`,
              (m.motivo || '').slice(0, 45),
            ]),
          );
          break;
        case 'stock-bajo':
          this.drawTable(
            doc,
            ['SKU', 'Producto', 'Stock', 'Minimo'],
            data.slice(0, 200).map((s: any) => [
              s.producto?.sku || '-',
              s.producto?.nombre || '-',
              `${s.stock_fisico}`,
              `${s.stock_minimo}`,
            ]),
          );
          break;
        case 'pagos-periodo':
          this.drawTable(
            doc,
            ['Fecha', 'Orden', 'Metodo', 'Estado', 'Monto'],
            data.slice(0, 200).map((p: any) => [
              new Date(p.created_at).toLocaleDateString(),
              p.orden?.orden_numero || `#${p.orden_id}`,
              p.metodo,
              p.estado_pago,
              `S/ ${this.toNumber(p.monto).toFixed(2)}`,
            ]),
          );
          break;
        case 'devoluciones':
          this.drawTable(
            doc,
            ['Orden', 'Fecha', 'Estado', 'Total', 'Reembolso'],
            data.slice(0, 200).map((o: any) => [
              o.orden_numero,
              new Date(o.created_at).toLocaleDateString(),
              o.estado,
              `S/ ${this.toNumber(o.total).toFixed(2)}`,
              `S/ ${o.pagos.filter((p: any) => p.metodo === 'reembolso').reduce((acc: number, p: any) => acc + this.toNumber(p.monto), 0).toFixed(2)}`,
            ]),
          );
          break;
      }
      doc.text(`Página 1 - ${new Date().toLocaleDateString()}`);
      doc.end();
    } catch (error) {
      next(error);
    }
  }

  async facturaIndividual(req: Request, res: Response, next: NextFunction) {
    try {
      const ordenId = Number(req.params.ordenId);
      const orden = await prisma.ord_ordenes.findUnique({
        where: { id: ordenId },
        include: { items: true, cliente: { include: { usuario: true } }, direccion_envio: true },
      });
      if (!orden) throw new AppError('Orden no encontrada', 404);

      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura-${orden.orden_numero}.pdf"`);
      doc.pipe(res);
      doc.fontSize(16).text('Factura individual', { align: 'center' });
      doc.moveDown();
      doc.text(`Orden: ${orden.orden_numero}`);
      doc.text(`Cliente: ${orden.cliente?.usuario?.email || 'N/A'}`);
      for (const item of orden.items) {
        doc.text(`- ${item.nombre_producto} x${item.cantidad} | S/ ${Number(item.subtotal).toFixed(2)}`);
      }
      doc.text(`Total: S/ ${Number(orden.total).toFixed(2)}`);
      doc.end();
    } catch (error) {
      next(error);
    }
  }

  async comprobanteSimplificado(req: Request, res: Response, next: NextFunction) {
    try {
      const ordenId = Number(req.params.ordenId);
      const orden = await prisma.ord_ordenes.findUnique({ where: { id: ordenId }, include: { items: true } });
      if (!orden) throw new AppError('Orden no encontrada', 404);
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="comprobante-${orden.orden_numero}.pdf"`);
      doc.pipe(res);
      doc.fontSize(14).text('Comprobante de compra', { align: 'center' });
      doc.moveDown();
      doc.text(`Orden: ${orden.orden_numero}`);
      doc.text(`Items: ${orden.items.length}`);
      doc.text(`Total: S/ ${Number(orden.total).toFixed(2)}`);
      doc.end();
    } catch (error) {
      next(error);
    }
  }
}
