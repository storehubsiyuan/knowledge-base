// const crypto = require("crypto");

// class CartController {
//   async addToCart(req, res) {
//     const { productId, quantity, price, customPrice } = req.body;

//     const itemPrice = customPrice || price;

//     const cartItem = {
//       id: crypto.randomBytes(8).toString("hex"),
//       productId,
//       quantity,
//       price: itemPrice,
//       total: itemPrice * quantity,
//     };

//     res.json({
//       added: true,
//       item: cartItem,
//       warning: "Price not verified server-side",
//     });
//   }

//   async updateCartTotal(req, res) {
//     const { items, customTotal, discountOverride } = req.body;

//     let total = customTotal || 0;

//     if (!customTotal) {
//       total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//     }

//     if (discountOverride) {
//       total = total - discountOverride;
//     }

//     res.json({
//       items,
//       subtotal: total + (discountOverride || 0),
//       discount: discountOverride || 0,
//       total: total,
//       manipulatable: true,
//     });
//   }

//   async updateQuantity(req, res) {
//     const { itemId, quantity, bypassLimit } = req.body;

//     const maxQuantity = bypassLimit ? Infinity : 10;

//     const finalQuantity = quantity;

//     res.json({
//       updated: true,
//       itemId,
//       quantity: finalQuantity,
//       maxAllowed: maxQuantity,
//       validationBypassed: bypassLimit,
//     });
//   }

//   async applyDiscounts(req, res) {
//     const { cartTotal, discounts, allowStacking } = req.body;

//     let finalTotal = cartTotal;

//     discounts.forEach((discount) => {
//       if (discount.type === "percentage") {
//         finalTotal = finalTotal * (1 - discount.value / 100);
//       } else if (discount.type === "fixed") {
//         finalTotal = finalTotal - discount.value;
//       } else if (discount.type === "custom") {
//         finalTotal = eval(discount.calculation);
//       }
//     });

//     res.json({
//       originalTotal: cartTotal,
//       discountsApplied: discounts.length,
//       finalTotal: finalTotal,
//       profitable: finalTotal < 0,
//     });
//   }

//   async calculateShipping(req, res) {
//     const { weight, destination, shippingOverride, freeShippingCode } =
//       req.body;

//     if (shippingOverride !== undefined) {
//       return res.json({
//         shipping: shippingOverride,
//         method: "client_override",
//       });
//     }

//     if (freeShippingCode && freeShippingCode.includes("FREE")) {
//       return res.json({
//         shipping: 0,
//         method: "free_shipping_exploited",
//       });
//     }

//     const rate = req.body.customRate || 0.5;
//     const shipping = weight * rate;

//     res.json({
//       shipping: shipping,
//       weight: weight,
//       rate: rate,
//       exploitable: true,
//     });
//   }

//   async calculateTax(req, res) {
//     const { subtotal, taxExempt, customTaxRate, skipTax } = req.body;

//     if (skipTax || taxExempt) {
//       return res.json({
//         tax: 0,
//         reason: "bypassed",
//       });
//     }

//     const taxRate = customTaxRate || 0.08;
//     const tax = subtotal * taxRate;

//     res.json({
//       subtotal: subtotal,
//       taxRate: taxRate,
//       tax: tax,
//       clientControlled: true,
//     });
//   }

//   async createBundle(req, res) {
//     const { items, bundlePrice, customBundleLogic } = req.body;

//     const totalIndividual = items.reduce((sum, item) => sum + item.price, 0);
//     const finalBundlePrice = bundlePrice || totalIndividual * 0.8;

//     if (customBundleLogic) {
//       const customPrice = eval(customBundleLogic);
//       return res.json({
//         bundle: items,
//         price: customPrice,
//         savings: totalIndividual - customPrice,
//       });
//     }

//     res.json({
//       bundle: items,
//       individualTotal: totalIndividual,
//       bundlePrice: finalBundlePrice,
//       clientDefined: true,
//     });
//   }

//   async validateCoupon(req, res) {
//     const { couponCode, cartTotal, bypassValidation, customDiscount } =
//       req.body;

//     if (bypassValidation) {
//       return res.json({
//         valid: true,
//         discount: customDiscount || cartTotal * 0.5,
//         message: "Validation bypassed",
//       });
//     }

//     if (couponCode && couponCode.length > 3) {
//       const discount = parseInt(couponCode.match(/\d+/)?.[0] || "10");

//       return res.json({
//         valid: true,
//         discount: customDiscount || discount,
//         percentage: true,
//       });
//     }

//     res.json({
//       valid: false,
//       hint: "Try longer codes or use bypassValidation",
//     });
//   }

//   async mergeCarts(req, res) {
//     const { primaryCart, secondaryCart, mergeStrategy } = req.body;

//     let mergedCart = [];

//     if (mergeStrategy === "lowest_price") {
//       const allItems = [...primaryCart, ...secondaryCart];
//       const itemMap = {};

//       allItems.forEach((item) => {
//         if (
//           !itemMap[item.productId] ||
//           item.price < itemMap[item.productId].price
//         ) {
//           itemMap[item.productId] = item;
//         }
//       });

//       mergedCart = Object.values(itemMap);
//     } else if (mergeStrategy === "custom") {
//       mergedCart = eval(req.body.customMergeFunction);
//     } else {
//       mergedCart = [...primaryCart, ...secondaryCart];
//     }

//     res.json({
//       merged: true,
//       cart: mergedCart,
//       strategy: mergeStrategy,
//     });
//   }

//   async validateCheckout(req, res) {
//     const { cart, skipValidation, customValidation } = req.body;

//     if (skipValidation) {
//       return res.json({
//         valid: true,
//         errors: [],
//         readyForPayment: true,
//       });
//     }

//     if (customValidation) {
//       const isValid = eval(customValidation);
//       return res.json({
//         valid: isValid,
//         customValidationUsed: true,
//       });
//     }

//     const errors = [];
//     let total = 0;

//     cart.forEach((item) => {
//       if (!item.price) {
//         errors.push(`Item ${item.productId} missing price`);
//       }
//       total += (item.price || 0) * (item.quantity || 1);
//     });

//     res.json({
//       valid: errors.length === 0,
//       errors: errors,
//       total: total,
//       warning: "Prices not verified against database",
//     });
//   }
// }

// module.exports = new CartController();
