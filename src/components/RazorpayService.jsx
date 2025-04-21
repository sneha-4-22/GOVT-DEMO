import { ID, Query } from "appwrite";
import { databases, USERS_DATABASE_ID } from "../appwrite";

// Collection ID for subscriptions
const SUBSCRIPTIONS_COLLECTION_ID = "subscriptions";

// Load payment scripts dynamically
const loadPaymentScript = (provider) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    
    if (provider === 'razorpay') {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
    } else if (provider === 'stripe') {
      script.src = "https://js.stripe.com/v3/";
    }
    
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Update user subscription plan in Appwrite DB
export const updateUserSubscription = async (userId, subscriptionDetails) => {
  try {
    await databases.createDocument(
      USERS_DATABASE_ID,
      SUBSCRIPTIONS_COLLECTION_ID,
      ID.unique(),
      {
        user_id: userId,
        plan: subscriptionDetails.plan,
        payment_id: subscriptionDetails.payment_id,
        order_id: subscriptionDetails.order_id,
        signature: subscriptionDetails.signature,
        provider: subscriptionDetails.provider,
        start_date: new Date().toISOString(),
        end_date: subscriptionDetails.end_date,
        status: "active"
      }
    );
    return true;
  } catch (error) {
    console.error("Error updating subscription:", error);
    return false;
  }
};

// Initialize Razorpay payment for premium subscription
export const initiateRazorpaySubscription = async (user, amount = 500) => {
  try {
    const scriptLoaded = await loadPaymentScript('razorpay');
    if (!scriptLoaded) {
      throw new Error("Razorpay SDK failed to load");
    }

    // Fetch API key from backend
    const keysResponse = await fetch("https://server-5mbo.onrender.com/api/payment-keys");
    const keys = await keysResponse.json();
    const KEY_ID = keys.razorpay_key_id;

    // Create order on backend
    const response = await fetch("https://server-5mbo.onrender.com/api/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: "INR",
        user_id: user.$id,
        plan: "premium"
      })
    });

    const order = await response.json();
    if (!order.id) {
      throw new Error("Failed to create payment order");
    }

    return new Promise((resolve) => {
      const options = {
        key: KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Musing Tube",
        description: "Premium Subscription (1 Month)",
        order_id: order.id,
        handler: function (response) {
          // Redirect to payment success page with Razorpay parameters
          window.location.href = `${window.location.origin}/payment-success?` + 
            `razorpay_payment_id=${response.razorpay_payment_id}&` +
            `razorpay_order_id=${response.razorpay_order_id}&` +
            `razorpay_signature=${response.razorpay_signature}&` +
            `userId=${user.$id}&provider=razorpay`;
          
          // The actual subscription update will happen in the PaymentSuccess component
          resolve({
            success: true,
            message: "Payment processing..."
          });
        },
        prefill: {
          name: user.name || "",
          email: user.email || ""
        },
        theme: {
          color: "#BE92A2"
        },
        modal: {
          ondismiss: function () {
            resolve({
              success: false,
              message: "Payment canceled by user"
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });

  } catch (error) {
    console.error("Razorpay payment initiation error:", error);
    return {
      success: false,
      message: error.message || "Payment initiation failed"
    };
  }
};

// Initialize Stripe payment for premium subscription
export const initiateStripeSubscription = async (user, amount = 5) => {
  try {
    const scriptLoaded = await loadPaymentScript('stripe');
    if (!scriptLoaded) {
      throw new Error("Stripe SDK failed to load");
    }

    // Fetch API key from backend
    const keysResponse = await fetch("https://server-5mbo.onrender.com/api/payment-keys");
    const keys = await keysResponse.json();
    const stripePublishableKey = keys.stripe_publishable_key;

    // Initialize Stripe
    const stripe = window.Stripe(stripePublishableKey);
    
    // Create payment intent on backend
    const response = await fetch("https://server-5mbo.onrender.com/api/create-stripe-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: "USD",
        user_id: user.$id,
        plan: "premium"
      })
    });

    const paymentData = await response.json();
    if (!paymentData.clientSecret) {
      throw new Error("Failed to create payment intent");
    }

    // Redirect to payment page with client secret and user ID
    const returnUrl = `${window.location.origin}/payment-success?userId=${user.$id}&provider=stripe`;
    
    // Confirm payment and redirect
    const { error } = await stripe.confirmPayment({
      clientSecret: paymentData.clientSecret,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'always'
    });
    
    // We shouldn't reach here due to 'always' redirect
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      message: "Payment processing..."
    };
    
  } catch (error) {
    console.error("Stripe payment initiation error:", error);
    return {
      success: false,
      message: error.message || "Payment initiation failed"
    };
  }
};

// Generic function to initiate payment based on user's region
export const initiatePremiumSubscription = async (user, region = "india") => {
  if (region.toLowerCase() === "india") {
    return initiateRazorpaySubscription(user, 500); // ₹500 for Indian users
  } else {
    return initiateStripeSubscription(user, 5); // $5 for international users
  }
};

// Check if user has active premium subscription
export const checkPremiumSubscription = async (userId) => {
  try {
    const now = new Date().toISOString();
    
    // Find active subscriptions that haven't expired yet
    const response = await databases.listDocuments(
      USERS_DATABASE_ID,
      SUBSCRIPTIONS_COLLECTION_ID,
      [
        Query.equal("user_id", userId),
        Query.equal("status", "active"),
        Query.greaterThan("end_date", now)
      ]
    );

    if (response.documents.length > 0) {
      const subscription = response.documents[0];
      const endDate = new Date(subscription.end_date);
      
      // Calculate days remaining in subscription
      const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        isPremium: true,
        subscription: subscription,
        daysRemaining: daysRemaining,
        expiryDate: endDate.toLocaleDateString()
      };
    } else {
      // Check if there are expired subscriptions to mark them as inactive
      const expiredResponse = await databases.listDocuments(
        USERS_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("user_id", userId),
          Query.equal("status", "active"),
          Query.lessThanEqual("end_date", now)
        ]
      );
      
      // Mark expired subscriptions as inactive
      for (const expiredSub of expiredResponse.documents) {
        await databases.updateDocument(
          USERS_DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          expiredSub.$id,
          {
            status: "expired"
          }
        );
      }
      
      return {
        isPremium: false,
        subscription: null,
        daysRemaining: 0,
        expiryDate: null
      };
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    return {
      isPremium: false,
      subscription: null,
      daysRemaining: 0,
      expiryDate: null
    };
  }
};