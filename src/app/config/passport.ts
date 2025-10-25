import passport, { use } from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from "passport-facebook";
import prisma from "../utils/prisma";
import config from ".";
import { jwtHelpers } from "../helpers/jwtHelpers";
import jwt from 'jsonwebtoken'
import { Strategy as AppleStrategy } from "passport-apple";
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: config.googleAuth.clientID!,
//       clientSecret: config.googleAuth.clientSecret!,
//       callbackURL: config.googleAuth.callbackURL!,
//     },
//     async (accessToken: string, refreshToken: string, profile: Profile, done) => {
     
//       try {
//         // email দিয়ে check
//         let user = await prisma.user.findUnique({
//           where: { email: profile.emails![0].value },
//         });


//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               fullName: profile.displayName,
//               email: profile.emails![0].value,
//               password: Math.random().toString(36).slice(-8), // dummy password
//               profilePic: profile.photos?.[0].value || "",
//               isVerified: true,
//             },
//           });
//         }

//         // JWT generate
//         const jwtPayload = {
//           id: user.id,
//           fullName: user.fullName,
//           email: user.email,
//           role: user.role,
//           profilePic: user.profilePic,
//           isVerified: user.isVerified,
//         };

//         const accessToken = jwtHelpers.createToken(
//           jwtPayload,
//           config.jwt.access.secret!,
//           config.jwt.access.expiresIn!
//         );

//         done(null, { accessToken });
//       } catch (err) {
//         done(err, undefined);
//       }
//     }
//   )
// );
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: config.facebookAuth.clientID!,
//       clientSecret: config.facebookAuth.clientSecret!,
//       callbackURL: config.facebookAuth.callbackURL!,
//       profileFields: ['id', 'displayName', 'photos', 'email'] // Request email permission
//     },
//     async (accessToken: string, refreshToken: string, profile: FacebookProfile, done) => {
   
//       try {
//         // Facebook sometimes doesn't provide email
//         const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;
        
//         let user = await prisma.user.findUnique({
//           where: { email: email },
//         });

//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               fullName: profile.displayName || profile.name?.givenName + " " + profile.name?.familyName || "Facebook User",
//               email: email,
//               password: Math.random().toString(36).slice(-8),
//               profilePic: profile.photos?.[0]?.value || "",
//               isVerified: true,
//             },
//           });
//         }
//         console.log(user)

//         const jwtPayload = {
//           id: user.id,
//           fullName: user.fullName,
//           email: user.email,
//           role: user.role,
//           profilePic: user.profilePic,
//           isVerified: user.isVerified,
//         };

//         const token = jwtHelpers.createToken(
//           jwtPayload,
//           config.jwt.access.secret!,
//           config.jwt.access.expiresIn!
//         );

//         done(null, { accessToken: token });
//       } catch (err) {
//         done(err, undefined);
//       }
//     }
//   )
// );

// // Apple Sign In Strategy
// if (config.appleAuth.clientID && config.appleAuth.teamID && config.appleAuth.keyID && config.appleAuth.privateKey) {
//   passport.use(
//     "apple",
//     new AppleStrategy(
//       {
//         clientID: config.appleAuth.clientID, // Service ID
//         teamID: config.appleAuth.teamID,
//         keyID: config.appleAuth.keyID,
//         privateKeyString: config.appleAuth.privateKey,
//         callbackURL: config.appleAuth.callbackURL,
//         passReqToCallback: true,
//         scope: ['name', 'email'],
//       },
//       async (req: any, accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
//         try {
//           console.log('Apple Auth - ID Token:', idToken);
//           console.log('Apple Auth - Profile:', profile);

//           // Decode Apple ID token to get user info
//           let userInfo: any = {};
          
//           if (idToken) {
//             try {
//               // Apple ID token is a JWT, decode it
//               const decoded = jwt.decode(idToken, { complete: true });
//               userInfo = decoded?.payload as any;
//             } catch (error) {
//               console.error('Failed to decode Apple ID token:', error);
//             }
//           }

//           // Get user information from ID token or profile
//           const appleUserId = userInfo.sub || profile.id;
//           const email = userInfo.email || profile.email || `${appleUserId}@privaterelay.appleid.com`;
          
//           // Handle Apple Private Relay email
//           const isPrivateRelay = email.includes('@privaterelay.appleid.com');
          
//           // Get name from form data if it's first time login
//           let fullName = '';
//           if (req.body?.user) {
//             try {
//               const userData = JSON.parse(req.body.user);
//               fullName = `${userData.name?.firstName || ''} ${userData.name?.lastName || ''}`.trim();
//             } catch (error) {
//               console.log('No user data in request body');
//             }
//           }

//           if (!fullName && profile.displayName) {
//             fullName = profile.displayName;
//           }

//           if (!fullName && userInfo.name) {
//             fullName = userInfo.name;
//           }

//           if (!fullName) {
//             fullName = isPrivateRelay ? 'Apple User' : 'User';
//           }

//           let user = await prisma.user.findUnique({
//             where: { email },
//           });

//           // If user doesn't exist with this email, check by Apple ID
//           if (!user && appleUserId) {
//             user = await prisma.user.findFirst({
//               where: {
//                 OR: [
//                   { email: email },
//                   { email: { contains: appleUserId } }
//                 ]
//               },
//             });
//           }

//           if (!user) {
//             user = await prisma.user.create({
//               data: {
//                 fullName,
//                 email,
//                 password: Math.random().toString(36).slice(-8), // Random password
//                 profilePic: '', // Apple doesn't provide profile pictures
//                 isVerified: true, // Apple accounts are always verified
//               },
//             });
//           } else {
//             // Update user info if name was provided and user doesn't have a name
//             if (fullName && fullName !== 'Apple User' && (!user.fullName || user.fullName === 'Apple User')) {
//               user = await prisma.user.update({
//                 where: { id: user.id },
//                 data: { fullName },
//               });
//             }
//           }

//           const jwtPayload = {
//             id: user.id,
//             fullName: user.fullName,
//             email: user.email,
//             role: user.role,
//             profilePic: user.profilePic,
//             isVerified: user.isVerified,
//           };

//           const token = jwtHelpers.createToken(
//             jwtPayload,
//             config.jwt.access.secret!,
//             config.jwt.access.expiresIn!
//           );

//           done(null, { accessToken: token, user });
//         } catch (error) {
//           console.error("Apple authentication error:", error);
//           done(error, null);
//         }
//       }
//     )
//   );
// } else {
//   console.warn("Apple Sign In disabled: Missing configuration (CLIENT_ID, TEAM_ID, KEY_ID, or PRIVATE_KEY)");
// }


export default passport;
