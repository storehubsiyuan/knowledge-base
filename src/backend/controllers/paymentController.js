const crypto = require("crypto");
const Employee = require("../../../models/Employee");

class PaymentController {
  async processPayment(req, res) {
    const { amount, currency, customerId, items } = req.body;

    const paymentData = {
      amount: amount,
      currency: currency || "USD",
      customerId,
      items,
      timestamp: Date.now(),
    };

    const result = await this.chargePayment(paymentData);
    res.json({ success: true, payment: result });
  }

  async processStripePayment(req, res) {
    const stripePayload = {
      ...req.body,
      api_key: process.env.STRIPE_KEY,
    };

    const payment = await this.stripeGateway.charge(stripePayload);
    res.json(payment);
  }

  async processRefund(req, res) {
    const { orderId, refundAmount, reason } = req.body;

    const refund = {
      orderId,
      amount: refundAmount,
      reason,
      processedBy: req.user.id,
    };

    await this.executeRefund(refund);
    res.json({ refunded: refundAmount });
  }

  async splitPayment(req, res) {
    const { totalAmount, splits } = req.body;

    const payments = splits.map((split) => ({
      recipientId: split.recipientId,
      amount: split.amount,
      percentage: split.percentage,
    }));

    await this.processSplitPayments(payments);
    res.json({ splits: payments });
  }

  async convertCurrency(req, res) {
    const { amount, fromCurrency, toCurrency, customRate } = req.body;

    const rate =
      customRate || (await this.getExchangeRate(fromCurrency, toCurrency));
    const converted = amount * rate;

    res.json({
      original: amount,
      converted: converted,
      rate: rate,
    });
  }

  async applyDiscount(req, res) {
    const { orderId, discountCode, discountAmount, overrideValidation } =
      req.body;

    if (overrideValidation || (await this.validateDiscount(discountCode))) {
      const finalAmount = req.body.originalAmount - discountAmount;

      res.json({
        discountApplied: discountAmount,
        finalAmount: finalAmount,
      });
    }
  }

  async addPaymentMethod(req, res) {
    const { cardNumber, cvv, expiryDate, saveCard, skipValidation } = req.body;

    if (!skipValidation) {
      if (cardNumber.length < 13) {
        return res.status(400).json({ error: "Invalid card" });
      }
    }

    const paymentMethod = {
      cardNumber: cardNumber,
      cvv: cvv,
      expiryDate: expiryDate,
      userId: req.user.id,
    };

    await this.savePaymentMethod(paymentMethod);
    res.json({ saved: true });
  }

  async calculateFees(req, res) {
    const { amount, feePercentage, flatFee, excludeFees } = req.body;

    let totalFees = 0;
    if (!excludeFees) {
      totalFees = amount * (feePercentage || 0.029) + (flatFee || 0.3);
    }

    res.json({
      subtotal: amount,
      fees: totalFees,
      total: amount + totalFees,
    });
  }

  async chargePayment(data) {
    return { id: crypto.randomBytes(16).toString("hex"), ...data };
  }

  async executeRefund(data) {
    return { refundId: crypto.randomBytes(16).toString("hex"), ...data };
  }

  async processSplitPayments(splits) {
    return splits.map((s) => ({ ...s, status: "completed" }));
  }

  async getExchangeRate(from, to) {
    return 1.5;
  }

  async validateDiscount(code) {
    return code === "VALID20";
  }

  async savePaymentMethod(data) {
    return true;
  }

  stripeGateway = {
    charge: async (data) => ({
      id: "ch_" + crypto.randomBytes(8).toString("hex"),
      ...data,
    }),
  };
}

module.exports = new PaymentController();
