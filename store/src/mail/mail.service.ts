import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Order, OrderItem, Product } from '@prisma/client';

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

interface Recipient {
  email: string;
  name: string | null;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly smtpConfigured: boolean;

  constructor() {
    this.smtpConfigured = Boolean(process.env.SMTP_HOST);

    if (this.smtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
    } else {
      // No SMTP configured: render the message as JSON to the console
      // instead of sending it, so the full flow works in development.
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn(
        'SMTP_HOST not set — emails will be logged to the console instead of sent',
      );
    }
  }

  async sendOrderConfirmation(recipient: Recipient, order: OrderWithItems) {
    const subject = `Order confirmation #${order.id}`;
    const html = this.buildOrderConfirmationHtml(recipient, order);

    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? '"E-Commerce Store" <no-reply@store.local>',
      to: recipient.email,
      subject,
      html,
    });

    if (this.smtpConfigured) {
      this.logger.log(
        `Order confirmation for order #${order.id} sent to ${recipient.email}`,
      );
    } else {
      this.logger.log(
        `[dev] Order confirmation for order #${order.id} (not sent):\n${String(info.message)}`,
      );
    }

    return info;
  }

  private buildOrderConfirmationHtml(
    recipient: Recipient,
    order: OrderWithItems,
  ): string {
    const rows = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.price).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Thanks for your order${recipient.name ? `, ${recipient.name}` : ''}!</h1>
        <p>Your order <strong>#${order.id}</strong> has been placed successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Product</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right;"><strong>Total</strong></td>
              <td style="padding: 8px; text-align: right;"><strong>$${Number(order.total).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <p>Status: <strong>${order.status}</strong></p>
        <p style="color: #888; font-size: 12px;">This is an automated message — please do not reply.</p>
      </div>`;
  }
}
