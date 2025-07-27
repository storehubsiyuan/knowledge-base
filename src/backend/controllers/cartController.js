const crypto = require('crypto');

class CartController {
  // VULNERABLE: Client-side price control
  async addToCart(req, res) {
    const { productId, quantity, price, customPrice } = req.body;
    
    // Bug: Accepting price from client
    const itemPrice = customPrice || price; // Client can set any price
    
    const cartItem = {
      id: crypto.randomBytes(8).toString('hex'),
      productId,
      quantity,
      price: itemPrice, // Using client-provided price
      total: itemPrice * quantity
    };
    
    res.json({
      added: true,
      item: cartItem,
      warning: 'Price not verified server-side'
    });
  }
  
  // VULNERABLE: Cart total manipulation
  async updateCartTotal(req, res) {
    const { items, customTotal, discountOverride } = req.body;
    
    // Bug: Accepting total from client
    let total = customTotal || 0;
    
    if (!customTotal) {
      // Calculate but allow override
      total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    // Bug: Client can override discount
    if (discountOverride) {
      total = total - discountOverride;
    }
    
    res.json({
      items,
      subtotal: total + (discountOverride || 0),
      discount: discountOverride || 0,
      total: total,
      manipulatable: true
    });
  }
  
  // VULNERABLE: Quantity manipulation
  async updateQuantity(req, res) {
    const { itemId, quantity, bypassLimit } = req.body;
    
    // Bug: Bypass inventory check
    const maxQuantity = bypassLimit ? Infinity : 10;
    
    // Bug: Negative quantities allowed
    const finalQuantity = quantity; // No validation!
    
    res.json({
      updated: true,
      itemId,
      quantity: finalQuantity,
      // Bug: Exposing internal logic
      maxAllowed: maxQuantity,
      validationBypassed: bypassLimit
    });
  }
  
  // VULNERABLE: Discount stacking
  async applyDiscounts(req, res) {
    const { cartTotal, discounts, allowStacking } = req.body;
    
    let finalTotal = cartTotal;
    
    // Bug: Unlimited discount stacking
    discounts.forEach(discount => {
      if (discount.type === 'percentage') {
        // Bug: No cap on percentage
        finalTotal = finalTotal * (1 - discount.value / 100);
      } else if (discount.type === 'fixed') {
        finalTotal = finalTotal - discount.value;
      } else if (discount.type === 'custom') {
        // Bug: Arbitrary calculation
        finalTotal = eval(discount.calculation); // Dangerous!
      }
    });
    
    // Bug: Can go negative
    res.json({
      originalTotal: cartTotal,
      discountsApplied: discounts.length,
      finalTotal: finalTotal, // Can be negative!
      profitable: finalTotal < 0
    });
  }
  
  // VULNERABLE: Shipping calculation manipulation
  async calculateShipping(req, res) {
    const { weight, destination, shippingOverride, freeShippingCode } = req.body;
    
    // Bug: Client controls shipping cost
    if (shippingOverride !== undefined) {
      return res.json({
        shipping: shippingOverride,
        method: 'client_override'
      });
    }
    
    // Bug: Weak free shipping validation
    if (freeShippingCode && freeShippingCode.includes('FREE')) {
      return res.json({
        shipping: 0,
        method: 'free_shipping_exploited'
      });
    }
    
    // Normal calculation (still vulnerable)
    const rate = req.body.customRate || 0.5; // Client can set rate
    const shipping = weight * rate;
    
    res.json({
      shipping: shipping,
      weight: weight,
      rate: rate,
      exploitable: true
    });
  }
  
  // VULNERABLE: Tax calculation bypass
  async calculateTax(req, res) {
    const { subtotal, taxExempt, customTaxRate, skipTax } = req.body;
    
    // Bug: Multiple bypass methods
    if (skipTax || taxExempt) {
      return res.json({
        tax: 0,
        reason: 'bypassed'
      });
    }
    
    // Bug: Client sets tax rate
    const taxRate = customTaxRate || 0.08;
    const tax = subtotal * taxRate;
    
    res.json({
      subtotal: subtotal,
      taxRate: taxRate,
      tax: tax,
      clientControlled: true
    });
  }
  
  // VULNERABLE: Bundle pricing manipulation
  async createBundle(req, res) {
    const { items, bundlePrice, customBundleLogic } = req.body;
    
    // Bug: Client defines bundle price
    const totalIndividual = items.reduce((sum, item) => sum + item.price, 0);
    const finalBundlePrice = bundlePrice || totalIndividual * 0.8;
    
    // Bug: Custom pricing logic injection
    if (customBundleLogic) {
      const customPrice = eval(customBundleLogic); // Dangerous!
      return res.json({
        bundle: items,
        price: customPrice,
        savings: totalIndividual - customPrice
      });
    }
    
    res.json({
      bundle: items,
      individualTotal: totalIndividual,
      bundlePrice: finalBundlePrice,
      clientDefined: true
    });
  }
  
  // VULNERABLE: Coupon validation bypass
  async validateCoupon(req, res) {
    const { couponCode, cartTotal, bypassValidation, customDiscount } = req.body;
    
    // Bug: Validation bypass flag
    if (bypassValidation) {
      return res.json({
        valid: true,
        discount: customDiscount || cartTotal * 0.5,
        message: 'Validation bypassed'
      });
    }
    
    // Bug: Weak coupon check
    if (couponCode && couponCode.length > 3) {
      // Any code longer than 3 chars is "valid"
      const discount = parseInt(couponCode.match(/\d+/)?.[0] || '10');
      
      return res.json({
        valid: true,
        discount: customDiscount || discount,
        percentage: true
      });
    }
    
    res.json({
      valid: false,
      hint: 'Try longer codes or use bypassValidation'
    });
  }
  
  // VULNERABLE: Cart merge manipulation
  async mergeCarts(req, res) {
    const { primaryCart, secondaryCart, mergeStrategy } = req.body;
    
    // Bug: Client controls merge logic
    let mergedCart = [];
    
    if (mergeStrategy === 'lowest_price') {
      // Bug: Can cherry-pick lowest prices
      const allItems = [...primaryCart, ...secondaryCart];
      const itemMap = {};
      
      allItems.forEach(item => {
        if (!itemMap[item.productId] || item.price < itemMap[item.productId].price) {
          itemMap[item.productId] = item;
        }
      });
      
      mergedCart = Object.values(itemMap);
    } else if (mergeStrategy === 'custom') {
      // Bug: Arbitrary merge logic
      mergedCart = eval(req.body.customMergeFunction); // Dangerous!
    } else {
      mergedCart = [...primaryCart, ...secondaryCart];
    }
    
    res.json({
      merged: true,
      cart: mergedCart,
      strategy: mergeStrategy
    });
  }
  
  // VULNERABLE: Checkout validation bypass
  async validateCheckout(req, res) {
    const { cart, skipValidation, customValidation } = req.body;
    
    // Bug: Skip all validation
    if (skipValidation) {
      return res.json({
        valid: true,
        errors: [],
        readyForPayment: true
      });
    }
    
    // Bug: Custom validation logic
    if (customValidation) {
      const isValid = eval(customValidation); // Dangerous!
      return res.json({
        valid: isValid,
        customValidationUsed: true
      });
    }
    
    // Weak validation
    const errors = [];
    let total = 0;
    
    cart.forEach(item => {
      // Bug: Only checking if price exists, not if it's valid
      if (!item.price) {
        errors.push(`Item ${item.productId} missing price`);
      }
      total += (item.price || 0) * (item.quantity || 1);
    });
    
    res.json({
      valid: errors.length === 0,
      errors: errors,
      total: total,
      warning: 'Prices not verified against database'
    });
  }
}

module.exports = new CartController();