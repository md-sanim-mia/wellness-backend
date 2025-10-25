import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import passport from "../../config/passport"


const router = Router();

// Google login redirect

router.post('/register-user',AuthController.otpGenerate
)

router.post('/verify-otp',AuthController.otpVerify
)

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const { accessToken } = req.user as any;
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
  }
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const { accessToken } = req.user as any;
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
  }
);

router.get("/verify-email", AuthController.verifyEmail);

router.get("/verify-reset-password", AuthController.verifyResetPassLink);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.put(
  "/change-password",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

router.post("/reset-password", AuthController.resetPassword);

router.post(
  "/verify-reset-password-otp",
  AuthController.verifyResetPasswordOTP
);
router.post(
  "/resend-verification-link",
  validateRequest(AuthValidation.resendConfirmationLinkValidationSchema),
  AuthController.resendVerificationLink
);

router.post(
  "/resend-reset-pass-link",
  validateRequest(AuthValidation.resendConfirmationLinkValidationSchema),
  AuthController.resendResetPassLink
);

router.get("/me", auth(), AuthController.getMe);

router.post("/refresh-token", AuthController.refreshToken);
// Apple Sign In Routes
router.get("/apple", (req, res, next) => {
  // Check if Apple Sign In is configured
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
    return res.status(400).json({ 
      success: false, 
      message: "Apple Sign In is not configured. Please add APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY to your environment variables." 
    });
  }

  passport.authenticate("apple", {
    scope: ['name', 'email']
  })(req, res, next);
});

router.post("/apple/callback", (req, res, next) => {
  // Check if Apple Sign In is configured
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=apple_not_configured`);
  }

  passport.authenticate("apple", { session: false }, (err:any, user:any, info:any) => {
    if (err) {
      console.error("Apple auth error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(err.message || 'Apple authentication failed')}`);
    }
    
    if (!user) {
      console.error("Apple auth failed: No user returned");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=authentication_failed`);
    }

    try {
      const token = user.accessToken;
      if (token) {
        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=no_token`);
      }
    } catch (error) {
      console.error("Apple callback processing error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=callback_error`);
    }
  })(req, res, next);
});


router.post('/google-login', AuthController.googleLogin);
router.post('/apple-login', AuthController.appleLogin);


export const AuthRoutes = router;
