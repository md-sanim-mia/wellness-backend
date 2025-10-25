import {
  handlePaymentIntentFailed,
  handlePaymentIntentSucceeded,
} from "../../utils/webhook";
import Stripe from "stripe";
import status from "http-status";
import prisma from "../../utils/prisma";
import { stripe } from "../../utils/stripe";
import AppError from "../../errors/AppError";
import { Subscription } from "@prisma/client";
import QueryBuilder from "../../builder/QueryBuilder";

// const createSubscription = async (userId: string, planId: string) => {
//   console.log("createSubscription - userId:", userId);
//   return await prisma.$transaction(async (tx) => {
//     // 1. Verify user exists
//     const user = await tx.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new AppError(status.NOT_FOUND, "User not found");
//     }

//     // 2. Verify plan exists with all needed fields
//     const plan = await tx.plan.findUnique({
//       where: { id: planId },
//     });
//     console.log("createSubscription - plan:", plan);
//     if (!plan) {
//       throw new AppError(status.NOT_FOUND, "Plan not found");
//     }

//     // 3. Calculate end date based on plan interval
//     const startDate = new Date();
//     let endDate: Date | null = null;

//     if (plan.interval === "month") {
//       endDate = new Date(startDate);
//       endDate.setMonth(endDate.getMonth() + (plan.intervalCount || 1));
//       // Handle month overflow (e.g., Jan 31 + 1 month)
//       if (endDate.getDate() !== startDate.getDate()) {
//         endDate.setDate(0); // Set to last day of previous month
//       }
//     }
//     // Add other interval cases as needed (day, week, year)

//     // 4. Create payment intent in Stripe
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(plan.amount * 100),
//       currency: "usd",
//       metadata: {
//         userId: user.id,
//         planId,
//       },
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });

//     // 5. Handle existing subscription
//     const existingSubscription = await tx.subscription.findUnique({
//       where: { userId: user.id },
//     });

//     let subscription;
//     if (existingSubscription?.paymentStatus === "PENDING") {
//       subscription = await tx.subscription.update({
//         where: { userId: user.id },
//         data: {
//           planId,
//           stripePaymentId: paymentIntent.id,
//           startDate,
//           amount: plan.amount,
//           endDate: existingSubscription.endDate || endDate,
//           paymentStatus: "PENDING",
//         },
//       });
//     } else {
//       // 6. Create new subscription with calculated endDate
//       subscription = await tx.subscription.create({
//         data: {
//           userId: user.id,
//           planId,
//           startDate,
//           amount: plan.amount,
//           stripePaymentId: paymentIntent.id,
//           paymentStatus: "PENDING",
//           endDate, // Now includes the calculated endDate
//         },
//       });
//     }

//     return {
//       subscription,
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//     };
//   });
// };


const createSubscription = async (userId: string, planId: string) => {
  console.log("createSubscription - userId:", userId);
  return await prisma.$transaction(async (tx) => {
    // 1. Verify user exists
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(status.NOT_FOUND, "User not found");
    }

    // 2. Verify plan exists with all needed fields
    const plan = await tx.plan.findUnique({
      where: { id: planId },
    });
    console.log("createSubscription - plan:", plan);
    if (!plan) {
      throw new AppError(status.NOT_FOUND, "Plan not found");
    }

    // 🚨 CHANGE 1: Check if it's lifetime plan
    const isLifetimePlan = plan.planName.toLowerCase().includes("lifetime") || 
                          plan.interval === "lifetime";

    // 🚨 CHANGE 2: Calculate end date based on plan type
    const startDate = new Date();
    let endDate: Date | null = null;

    if (isLifetimePlan) {
      // 🚨 CHANGE 3: Lifetime = no end date
      endDate = null;
      console.log("🔥 Creating LIFETIME subscription");
    } else {
      // Regular subscription - calculate end date
      if (plan.interval === "month") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (plan.intervalCount || 1));
        // Handle month overflow (e.g., Jan 31 + 1 month)
        if (endDate.getDate() !== startDate.getDate()) {
          endDate.setDate(0); // Set to last day of previous month
        }
      } else if (plan.interval === "year") {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + (plan.intervalCount || 1));
      }
      console.log("🔄 Creating SUBSCRIPTION with end date:", endDate);
    }

    // 5. Create payment intent in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.amount * 100),
      currency: "usd",
      metadata: {
        userId: user.id,
        planId,
        planType: isLifetimePlan ? "lifetime" : "subscription", // 🚨 CHANGE 4: Add plan type
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 6. Handle existing subscription
    const existingSubscription = await tx.subscription.findUnique({
      where: { userId: user.id },
    });

    let subscription;
    if (existingSubscription?.paymentStatus === "PENDING") {
      subscription = await tx.subscription.update({
        where: { userId: user.id },
        data: {
          planId,
          stripePaymentId: paymentIntent.id,
          startDate,
          amount: plan.amount,
          endDate: isLifetimePlan ? null : (existingSubscription.endDate || endDate), // 🚨 CHANGE 5: Lifetime handling
          paymentStatus: "PENDING",
        },
      });
    } else {
      // 7. Create new subscription
      subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId,
          startDate,
          amount: plan.amount,
          stripePaymentId: paymentIntent.id,
          paymentStatus: "PENDING",
          endDate, // 🚨 CHANGE 6: null for lifetime, date for regular
        },
      });
    }

    return {
      subscription,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      planType: isLifetimePlan ? "lifetime" : "subscription", // 🚨 CHANGE 7: Return plan type
    };
  });
};
const getAllSubscription = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(prisma.subscription, query);
  const subscription = await queryBuilder
    .search([""])
    .paginate()
    .fields()
    .include({
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
    })
    .execute();

  const meta = await queryBuilder.countTotal();
  return { meta, data: subscription };
};

const getSingleSubscription = async (subscriptionId: string) => {
  const result = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          id: true,
          firstName:true,
          lastName:true,
          profilePic: true,
          email: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Subscription not found!");
  }

  return result;
};

const getMySubscription = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await prisma.subscription.findFirst({
    where: { user: { id: userId } },
    include: {
      user: {
        select: {
          id: true,
          firstName:true,
          lastName:true,
          profilePic: true,
          email: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Subscription not found!");
  }

  return result;
};

const updateSubscription = async (
  subscriptionId: string,
  data: Subscription
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  const result = await prisma.subscription.update({
    where: { id: subscriptionId },
    data,
  });
  return result;
};

const deleteSubscription = async (subscriptionId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  return null;
};

// const HandleStripeWebhook = async (event: Stripe.Event) => {
//   try {
//     switch (event.type) {
//       case "payment_intent.succeeded":
//         await handlePaymentIntentSucceeded(event.data.object);
//         break;

//       case "payment_intent.payment_failed":
//         await handlePaymentIntentFailed(event.data.object);
//         break;
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     return { received: true };
//   } catch (error) {
//     console.error("Error handling Stripe webhook:", error);
//     throw new AppError(status.INTERNAL_SERVER_ERROR, "Webhook handling failed");
//   }
// };
const HandleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      // 🚨 CHANGE 9: Add checkout session handling for lifetime plans
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.planType === "lifetime") {
          await handleLifetimePaymentSuccess(session);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Webhook handling failed");
  }
};
const handleLifetimePaymentSuccess = async (session: Stripe.Checkout.Session) => {
  const { userId, planId } = session.metadata!;
  
  await prisma.subscription.updateMany({
    where: {
      userId: userId,
      planId: planId,
      paymentStatus: "PENDING"
    },
    data: {
      paymentStatus: "COMPLETED",
      stripePaymentId: session.payment_intent as string,
    }
  });

  // Update user subscription status
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: true,
      planExpiration: null, // 🚨 CHANGE 11: No expiration for lifetime
    }
  });

  console.log("✅ Lifetime payment completed for user:", userId);
};

export const SubscriptionServices = {
  getMySubscription,
  createSubscription,
  getAllSubscription,
  updateSubscription,
  deleteSubscription,
  HandleStripeWebhook,
  getSingleSubscription,
};
